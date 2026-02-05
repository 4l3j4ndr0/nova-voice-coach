const {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const { NodeHttp2Handler } = require("@smithy/node-http-handler");
const { EventEmitter } = require("events");

class NovaSessionManager extends EventEmitter {
  constructor(credentials = {}) {
    super();
    this.sessions = new Map();
    this.credentials = credentials;
    this.initializeClient();
  }

  initializeClient(credentials = null) {
    const creds = credentials || this.credentials;

    const clientConfig = {
      region: creds.region || process.env.AWS_REGION || "us-east-1",
    };

    // Use provided credentials or default from environment
    if (creds.accessKeyId && creds.secretAccessKey) {
      console.log("Using provided AWS credentials");
      clientConfig.credentials = {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        ...(creds.sessionToken && { sessionToken: creds.sessionToken }),
      };
    } else {
      console.log("Using default AWS credentials from environment");
    }

    // Configure HTTP/2 for bidirectional streaming
    clientConfig.requestHandler = new NodeHttp2Handler({
      requestTimeout: 300000,
      sessionTimeout: 300000,
      disableConcurrentStreams: false,
      maxConcurrentStreams: 20,
    });

    this.client = new BedrockRuntimeClient(clientConfig);
  }

  async createSession(config = {}) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[${sessionId}] Creating session`);

    // If AWS credentials are provided, reinitialize client
    if (config.awsCredentials && config.awsCredentials.accessKeyId) {
      console.log(`[${sessionId}] Using custom AWS credentials`);
      this.initializeClient(config.awsCredentials);
    }

    const session = {
      id: sessionId,
      config,
      isActive: true,
      queue: [],
      queueResolvers: [],
      promptId: `prompt_${Date.now()}`,
      audioContentId: `audio_${Date.now()}`,
      hasReceivedAudio: false,
    };

    this.sessions.set(sessionId, session);

    try {
      // Queue session start event first
      this.queueSessionStart(sessionId, config);

      // Create async iterable
      const asyncIterable = this.createAsyncIterable(sessionId);

      console.log(`[${sessionId}] Sending command to Bedrock...`);
      const response = await this.client.send(
        new InvokeModelWithBidirectionalStreamCommand({
          modelId: "amazon.nova-2-sonic-v1:0",
          body: asyncIterable,
        }),
      );

      console.log(`[${sessionId}] Stream established, processing responses...`);

      // Start processing responses
      this.processResponses(sessionId, response);

      return sessionId;
    } catch (error) {
      console.error(`[${sessionId}] Error creating session:`, error);
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  queueSessionStart(sessionId, config) {
    console.log(
      `[${sessionId}] Queueing session events with config:`,
      JSON.stringify(config, null, 2),
    );
    const session = this.sessions.get(sessionId);

    // Map voice gender to voiceId based on language
    const voiceId = this.getVoiceId(config.language, config.voiceGender);
    console.log(
      `[${sessionId}] Using voiceId: ${voiceId} (language: ${config.language}, gender: ${config.voiceGender})`,
    );

    // 1. Session Start Event
    this.queueEvent(sessionId, {
      event: {
        sessionStart: {
          inferenceConfiguration: {
            maxTokens: 2048,
            topP: 0.9,
            temperature: 0.7,
          },
        },
      },
    });

    // 2. Prompt Start Event
    this.queueEvent(sessionId, {
      event: {
        promptStart: {
          promptName: session.promptId,
          textOutputConfiguration: {
            mediaType: "text/plain",
          },
          audioOutputConfiguration: {
            mediaType: "audio/lpcm",
            sampleRateHertz: 16000,
            sampleSizeBits: 16,
            channelCount: 1,
            voiceId: voiceId,
            encoding: "base64",
            audioType: "SPEECH",
          },
        },
      },
    });

    // 3. System Prompt - Content Start
    const textContentId = `text_${Date.now()}`;
    this.queueEvent(sessionId, {
      event: {
        contentStart: {
          promptName: session.promptId,
          contentName: textContentId,
          type: "TEXT",
          interactive: false,
          role: "SYSTEM",
          textInputConfiguration: {
            mediaType: "text/plain",
          },
        },
      },
    });

    // 4. System Prompt - Text Input
    const { role, techStack, tone, language, userName } = config;
    const systemPrompt = this.buildSystemPrompt(
      role,
      techStack,
      tone,
      language,
      userName,
    );

    this.queueEvent(sessionId, {
      event: {
        textInput: {
          promptName: session.promptId,
          contentName: textContentId,
          content: systemPrompt,
        },
      },
    });

    // 5. System Prompt - Content End
    this.queueEvent(sessionId, {
      event: {
        contentEnd: {
          promptName: session.promptId,
          contentName: textContentId,
        },
      },
    });

    // 6. Audio Input - Content Start
    this.queueEvent(sessionId, {
      event: {
        contentStart: {
          promptName: session.promptId,
          contentName: session.audioContentId,
          type: "AUDIO",
          interactive: true,
          role: "USER",
          audioInputConfiguration: {
            mediaType: "audio/lpcm",
            sampleRateHertz: 16000,
            sampleSizeBits: 16,
            channelCount: 1,
            encoding: "base64",
          },
        },
      },
    });

    console.log(`[${sessionId}] All session events queued`);
  }

  queueEvent(sessionId, event) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.queue.push(event);

    // Resolve any waiting promises
    if (session.queueResolvers.length > 0) {
      const resolve = session.queueResolvers.shift();
      resolve();
    }
  }

  createAsyncIterable(sessionId) {
    const session = this.sessions.get(sessionId);

    console.log(
      `[${sessionId}] Creating async iterable, queue length: ${session.queue.length}`,
    );

    return {
      [Symbol.asyncIterator]: () => {
        console.log(`[${sessionId}] AsyncIterator created`);
        return {
          next: async () => {
            console.log(
              `[${sessionId}] next() called, isActive: ${session.isActive}, queue length: ${session.queue.length}`,
            );

            if (!session.isActive) {
              console.log(`[${sessionId}] Session not active, returning done`);
              return { value: undefined, done: true };
            }

            // Wait for queue to have items
            while (session.queue.length === 0 && session.isActive) {
              console.log(`[${sessionId}] Queue empty, waiting...`);
              await new Promise((resolve) => {
                session.queueResolvers.push(resolve);
                // Timeout after 100ms to check isActive
                setTimeout(resolve, 100);
              });
            }

            if (!session.isActive || session.queue.length === 0) {
              console.log(
                `[${sessionId}] Returning done: isActive=${session.isActive}, queue=${session.queue.length}`,
              );
              return { value: undefined, done: true };
            }

            const event = session.queue.shift();
            console.log(
              `[${sessionId}] Sending event from queue, remaining: ${session.queue.length}`,
            );

            return {
              value: {
                chunk: {
                  bytes: Buffer.from(JSON.stringify(event)),
                },
              },
              done: false,
            };
          },
        };
      },
    };
  }

  async processResponses(sessionId, response) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`[${sessionId}] Starting to process responses...`);

    try {
      for await (const event of response.body) {
        if (!session.isActive) break;

        console.log(`[${sessionId}] Received event from Bedrock`);

        if (event.chunk?.bytes) {
          const textResponse = new TextDecoder().decode(event.chunk.bytes);
          console.log(
            `[${sessionId}] Raw response:`,
            textResponse.substring(0, 200),
          );

          try {
            const jsonResponse = JSON.parse(textResponse);
            console.log(
              `[${sessionId}] Parsed event type:`,
              Object.keys(jsonResponse.event || {}),
            );

            if (jsonResponse.event?.audioOutput) {
              const audioContent = jsonResponse.event.audioOutput.content;
              // Filter out silent chunks (base64 with only zeros)
              if (
                audioContent &&
                audioContent.length > 50 &&
                !audioContent.match(/^A+={0,2}$/)
              ) {
                console.log(
                  `[${sessionId}] Audio output received (${audioContent.length} chars)`,
                );
                this.emit(
                  `${sessionId}:audioOutput`,
                  jsonResponse.event.audioOutput,
                );
              }
            } else if (jsonResponse.event?.textOutput) {
              console.log(
                `[${sessionId}] Text output received:`,
                jsonResponse.event.textOutput.content?.substring(0, 50),
              );
              this.emit(
                `${sessionId}:textOutput`,
                jsonResponse.event.textOutput,
              );
            } else if (jsonResponse.event?.contentStart) {
              console.log(`[${sessionId}] Content started`);
            } else if (jsonResponse.event?.completionEnd) {
              console.log(`[${sessionId}] Completion ended`);
            } else {
              console.log(
                `[${sessionId}] Other event:`,
                JSON.stringify(jsonResponse).substring(0, 100),
              );
            }
          } catch (parseError) {
            console.error(`[${sessionId}] Parse error:`, parseError);
            console.error(`[${sessionId}] Raw text:`, textResponse);
          }
        }
      }
      console.log(`[${sessionId}] Response stream ended`);
    } catch (error) {
      console.error(`[${sessionId}] Error processing responses:`, error);
      
      // Handle specific timeout errors
      if (error.message && error.message.includes('timed out')) {
        console.log(`[${sessionId}] Model timeout - this is normal for long responses`);
        this.emit(`${sessionId}:textOutput`, {
          role: 'ASSISTANT',
          content: 'I apologize, my response took too long. Could you please repeat your question?'
        });
      } else {
        this.emit(`${sessionId}:error`, error);
      }
    }
  }

  async sendAudio(sessionId, audioBase64) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Mark that we've received audio
    session.hasReceivedAudio = true;

    this.queueEvent(sessionId, {
      event: {
        audioInput: {
          promptName: session.promptId,
          contentName: session.audioContentId,
          content: audioBase64,
        },
      },
    });

    // Reset silence timer
    if (session.silenceTimer) {
      clearTimeout(session.silenceTimer);
    }

    // After 2 seconds of no audio, send contentEnd to trigger response
    session.silenceTimer = setTimeout(() => {
      console.log(`[${sessionId}] Silence detected, sending contentEnd`);
      this.queueEvent(sessionId, {
        event: {
          contentEnd: {
            promptName: session.promptId,
            contentName: session.audioContentId,
          },
        },
      });

      // Start new audio content for next turn
      session.audioContentId = `audio_${Date.now()}`;
      this.queueEvent(sessionId, {
        event: {
          contentStart: {
            promptName: session.promptId,
            contentName: session.audioContentId,
            type: "AUDIO",
            interactive: true,
            role: "USER",
            audioInputConfiguration: {
              mediaType: "audio/lpcm",
              sampleRateHertz: 16000,
              sampleSizeBits: 16,
              channelCount: 1,
              encoding: "base64",
            },
          },
        },
      });
    }, 2000);
  }

  async endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`[${sessionId}] Ending session gracefully...`);

    // Clear silence timer if exists
    if (session.silenceTimer) {
      clearTimeout(session.silenceTimer);
    }

    // If no audio was received, send a minimal audio chunk first
    if (!session.hasReceivedAudio) {
      console.log(`[${sessionId}] No audio received, sending minimal chunk...`);
      // Send a very small silent audio chunk (320 bytes = 10ms at 16kHz)
      const silentChunk = Buffer.alloc(320, 0).toString("base64");
      this.queueEvent(sessionId, {
        event: {
          audioInput: {
            promptName: session.promptId,
            contentName: session.audioContentId,
            content: silentChunk,
          },
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Close the audio content
    console.log(`[${sessionId}] Closing audio content...`);
    this.queueEvent(sessionId, {
      event: {
        contentEnd: {
          promptName: session.promptId,
          contentName: session.audioContentId,
        },
      },
    });

    // Close the prompt
    console.log(`[${sessionId}] Closing prompt...`);
    this.queueEvent(sessionId, {
      event: {
        promptEnd: {
          promptName: session.promptId,
        },
      },
    });

    // Wait for events to be sent
    await new Promise((resolve) => setTimeout(resolve, 200));

    session.isActive = false;

    // Resolve any waiting promises
    session.queueResolvers.forEach((resolve) => resolve());
    session.queueResolvers = [];

    this.sessions.delete(sessionId);
    console.log(`[${sessionId}] Session ended`);
  }

  buildSystemPrompt(role, techStack, tone, language, userName) {
    const toneInstructions = {
      friendly:
        "Be warm, encouraging, and supportive. Make the candidate feel comfortable. Use a conversational and approachable tone.",
      professional:
        "Be polite, clear, and maintain a professional demeanor throughout. Balance formality with approachability.",
      strict:
        "Be direct, challenging, and expect precise technical answers. Push for depth and don't accept vague responses.",
    };

    const languageMap = {
      "en-US": "English (US)",
      "en-GB": "English (UK)",
      "en-AU": "English (Australia)",
      "en-IN": "English (India)",
      "es-US": "Spanish (US)",
      "pt-BR": "Portuguese (Brazil)",
      "fr-FR": "French",
      "de-DE": "German",
      "it-IT": "Italian",
      "hi-IN": "Hindi",
    };

    const languageName = languageMap[language] || "English";

    return `You are an expert Technical Interviewer specializing in ${role}.
You are conducting a comprehensive screening interview with ${userName}, focusing on: ${techStack.join(", ")}.

INTERVIEW CONTEXT:
- Style: ${tone}
- Language: ${languageName}
- Duration: 10-15 questions covering multiple topics
- The candidate will manually end when ready

YOUR GOAL:
Thoroughly assess ${userName}'s proficiency in ${role} through 10-15 targeted questions covering breadth, depth, and practical application.

VOICE INTERACTION GUIDELINES (CRITICAL):
1. BE CONCISE: Keep responses short (1-3 sentences). This is voice, not text.
2. NATURAL FLOW: Use transitions like "Okay," "Right," "I see," "Moving on."
3. ONE QUESTION AT A TIME: Wait for response before continuing.
4. NO MARKDOWN: Plain text only. No asterisks, brackets, or code blocks.
5. USE NAME: Address ${userName} naturally throughout.

INTERVIEW STRUCTURE (10-15 questions):

1. INTRODUCTION (1 question):
   - Welcome ${userName} warmly
   - Ask first foundational question about ${techStack[0] || "technical background"}

2. FUNDAMENTALS (2-3 questions):
   - Core concepts from ${techStack.join(", ")}
   - Basic definitions and use cases
   - Common patterns and best practices

3. PRACTICAL SCENARIOS (4-5 questions) - PRIORITY:
   - "Suppose you need to deploy a highly available web application on AWS. How would you architect it?"
   - "Imagine you're tasked with migrating a monolithic application to microservices. Walk me through your approach."
   - "Let's say your production database is experiencing slow queries. How would you troubleshoot and optimize it?"
   - "If you had to implement CI/CD for a team of 10 developers, what tools and workflow would you choose?"
   - "Suppose you need to reduce cloud costs by 30% without impacting performance. What strategies would you use?"
   
   EVALUATION CRITERIA FOR SCENARIOS:
   - Does ${userName} break down the problem systematically?
   - Do they consider trade-offs and alternatives?
   - Do they mention specific tools, services, or technologies?
   - Do they think about scalability, security, and cost?

4. INTERMEDIATE (2-3 questions):
   - Real-world integration challenges
   - Problem-solving approaches
   - Technology comparisons and when to use each

5. ADVANCED (1-2 questions):
   - Edge cases and optimization
   - Architecture decisions at scale
   - Performance tuning and monitoring

ADAPTATION RULES:
- Strong answers → increase difficulty, add more complex scenarios
- Weak answers → adjust to their level, don't punish
- "I don't know" → appreciate honesty, provide hint or move on
- After each answer, acknowledge before next question

FOLLOW-UP TECHNIQUES (Use these to balance responses):
1. If answer is TOO VAGUE or HIGH-LEVEL:
   ✅ "Can you give me a concrete example?"
   ✅ "Walk me through how you'd actually implement that."
   ✅ "What specific tools or services would you use?"

2. If answer is TOO THEORETICAL:
   ✅ "Have you used this in a real project? Tell me about it."
   ✅ "How would this work in production?"
   ✅ "What challenges did you face when applying this?"

3. If answer is TOO DETAILED (in the weeds):
   ✅ "Okay, zooming out - why did you choose that approach?"
   ✅ "What's the bigger picture here?"
   ✅ "What trade-offs did you consider?"

4. If answer is INCOMPLETE:
   ✅ "What about [missing aspect]?"
   ✅ "And how would you handle [edge case]?"
   ✅ "What if [constraint changes]?"

USE 1-2 FOLLOW-UPS PER QUESTION when needed to get complete answers. Don't accept surface-level responses for senior roles.

TONE ADAPTATION:
${toneInstructions[tone] || toneInstructions.professional}

CRITICAL - INTERNAL REASONING:
Your evaluation and reasoning process MUST be completely internal. Never verbalize:
❌ "That's a good answer because..."
❌ "I'm evaluating your response on..."
❌ "Based on the criteria..."
❌ "Let me assess..."

Instead, think internally and respond naturally:
✅ "Okay, that makes sense. Let's talk about..."
✅ "Interesting approach. Now, suppose you had to..."
✅ "Right. Moving on to..."

BE HUMAN, NOT ROBOTIC:
- Use natural transitions: "Okay," "Right," "I see," "Got it"
- Acknowledge answers briefly: "Makes sense," "Fair point," "Interesting"
- Don't sound like you're reading from a script
- Vary your phrasing - don't repeat the same transitions
- Show engagement through tone, not explicit evaluation

IMPORTANT: Continue naturally through all 10-15 questions. The candidate will click "End Interview" when ready. Do NOT end the conversation yourself.

Start now. Greet ${userName} warmly and ask your first question in ${languageName}.`;
  }

  getVoiceId(language, gender) {
    // Voice mapping based on Nova 2 Sonic documentation
    const voiceMap = {
      "en-US": { male: "matthew", female: "tiffany" },
      "en-GB": { male: "matthew", female: "amy" },
      "en-AU": { male: "matthew", female: "olivia" },
      "en-IN": { male: "arjun", female: "kiara" },
      "es-US": { male: "carlos", female: "lupe" },
      "pt-BR": { male: "leo", female: "carolina" },
      "fr-FR": { male: "florian", female: "ambre" },
      "de-DE": { male: "lennart", female: "tina" },
      "it-IT": { male: "lorenzo", female: "beatrice" },
      "hi-IN": { male: "arjun", female: "kiara" },
    };

    const voices = voiceMap[language] || voiceMap["en-US"];
    return gender === "female" ? voices.female : voices.male;
  }

  async analyzeWithNovaLite(prompt) {
    const { InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

    try {
      const command = new InvokeModelCommand({
        modelId: "us.amazon.nova-2-lite-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [{ text: prompt }],
            },
          ],
          inferenceConfig: {
            max_new_tokens: 2048,
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Extract text from response
      const text = responseBody.output?.message?.content?.[0]?.text || "";

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error("No valid JSON found in response");
    } catch (error) {
      console.error("Nova Lite analysis error:", error);
      throw error;
    }
  }
}

module.exports = NovaSessionManager;
