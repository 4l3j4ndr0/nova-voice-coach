const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const NovaSessionManager = require('./services/NovaSessionManager');

const app = express();
const server = createServer(app);

// CORS configuration from environment variable
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : '*';

console.log('CORS allowed origins:', allowedOrigins);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Nova Voice Coach Backend' });
});

// Nova 2 Lite Analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { transcript, config, awsCredentials } = req.body;
    
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: 'Invalid transcript' });
    }

    const conversationText = transcript
      .filter(t => t.type === 'text')
      .map(t => `${t.role}: ${t.content}`)
      .join('\n\n');

    const languageMap = {
      'en-US': 'English',
      'en-GB': 'English',
      'en-AU': 'English',
      'en-IN': 'English',
      'es-US': 'Spanish',
      'pt-BR': 'Portuguese',
      'fr-FR': 'French',
      'de-DE': 'German',
      'it-IT': 'Italian',
      'hi-IN': 'Hindi'
    };

    const responseLanguage = languageMap[config.language] || 'English';

    const analysisPrompt = `You are an expert Technical Interview Auditor with 15+ years of experience evaluating candidates for senior engineering roles.

CRITICAL: Respond ONLY in ${responseLanguage}. All text in the JSON output must be in ${responseLanguage}.

You will receive a transcript of an interview for the role of: ${config.role || 'Technical Position'}
Tech Stack Focus: ${config.techStack?.join(', ') || 'General Technology'}
Candidate Name: ${config.userName || 'Candidate'}

TRANSCRIPT:
${conversationText}

YOUR TASK:
Analyze the candidate's performance based on these THREE criteria:

1. TECHNICAL ACCURACY (40 points)
   - Are the facts, concepts, and explanations technically correct?
   - Did they demonstrate hands-on knowledge or just theoretical understanding?
   - Were there any factual errors or misconceptions?

2. COMMUNICATION CLARITY (30 points)
   - Did they explain complex concepts in simple, understandable terms?
   - Was their answer structured and coherent?
   - Did they use appropriate examples or analogies?

3. SENIORITY LEVEL (30 points)
   - Did they show depth beyond surface-level knowledge?
   - Did they discuss trade-offs, edge cases, or real-world implications?
   - Did they demonstrate strategic thinking or just tactical knowledge?

SCORING GUIDE:
- 90-100: Exceptional - Senior/Staff level performance
- 75-89: Strong - Solid senior engineer
- 60-74: Competent - Mid-level with growth potential
- 40-59: Developing - Junior to mid-level
- 0-39: Needs improvement - Significant gaps

OUTPUT FORMAT:
Return ONLY a valid JSON object with NO markdown formatting, NO code blocks, NO extra text:

{
  "score": <integer 0-100>,
  "summary": "<One concise sentence summarizing overall performance>",
  "strengths": [
    "<Specific strength with example from transcript>",
    "<Specific strength with example from transcript>",
    "<Specific strength with example from transcript>"
  ],
  "weaknesses": [
    "<Specific weakness with context>",
    "<Specific weakness with context>"
  ],
  "study_recommendations": [
    "<Actionable recommendation: 'Study X to improve Y'>",
    "<Actionable recommendation: 'Practice Z scenarios'>",
    "<Actionable recommendation: 'Review W concepts'>"
  ]
}

Be honest but constructive. Focus on growth opportunities.`;

    const novaManager = new NovaSessionManager(awsCredentials || {});
    const analysis = await novaManager.analyzeWithNovaLite(analysisPrompt);
    
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New Socket.IO connection:', socket.id);
  
  let sessionManager = null;
  let sessionId = null;

  // Initialize session
  socket.on('initSession', async (config) => {
    try {
      console.log('Initializing session with config:', JSON.stringify(config, null, 2));
      
      sessionManager = new NovaSessionManager({
        region: process.env.AWS_REGION || 'us-east-1'
      });

      sessionId = await sessionManager.createSession(config);
      console.log('Session created:', sessionId);
      
      // Listen to session events
      sessionManager.on(`${sessionId}:audioOutput`, (audioData) => {
        socket.emit('audioOutput', audioData);
      });

      sessionManager.on(`${sessionId}:textOutput`, (textData) => {
        socket.emit('textOutput', textData);
      });

      sessionManager.on(`${sessionId}:error`, (error) => {
        socket.emit('error', { message: error.message });
      });

      socket.emit('sessionReady', { sessionId });
      
    } catch (error) {
      console.error('Error initializing session:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Handle audio input
  socket.on('audioInput', async (audioBase64) => {
    if (sessionManager && sessionId) {
      await sessionManager.sendAudio(sessionId, audioBase64);
    }
  });

  // Handle session end
  socket.on('endSession', async () => {
    if (sessionManager && sessionId) {
      await sessionManager.endSession(sessionId);
      socket.emit('sessionEnded');
    }
  });

  socket.on('disconnect', async () => {
    console.log('Socket.IO connection closed:', socket.id);
    if (sessionManager && sessionId) {
      await sessionManager.endSession(sessionId);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Nova Voice Coach Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});
