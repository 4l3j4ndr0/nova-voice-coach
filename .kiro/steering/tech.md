Technical Architecture & Specifications

1. Tech Stack

Frontend Framework: Vue.js 3 + Quasar Framework (Vite).

Styling: SCSS, Quasar Material Design (Dark Mode / Nova Theme).

AI Models (Amazon Bedrock):

Interacción en vivo: amazon.nova-2-sonic-v1:0 (Streaming Speech-to-Speech).

Análisis Post-Entrevista: amazon.nova-2-lite-v1:0 (Text Generation & Reasoning).

Backend / Integration:

Client-side execution con AWS SDK for JavaScript v3 (@aws-sdk/client-bedrock-runtime).

Alternativa: Python/Boto3 Lambda si se requiere manejo de WebSocket complejo.

2. Arquitectura de Datos

2.1. Configuración de Sesión (Input Object)

{
"apiKey": "sk-user-provided...",
"role": "Senior Cloud Architect",
"techStack": ["Kubernetes", "Terraform", "AWS"],
"tone": "strict", // Options: friendly, professional, strict
"language": "en-US"
}

2.2. Prompt Templates (System Prompts)

A. Nova 2 Sonic (The Interviewer)

Contexto: Inyección dinámica de {{role}}, {{techStack}} y {{tone}}.

Instrucciones Críticas: "Be concise (1-3 sentences)", "No markdown output", "Ask one question at a time", "Challenge the user if answer is vague".

B. Nova 2 Lite (The Auditor)

Input: Transcripción completa de la entrevista (Role: User / Role: Assistant).

Instrucciones Críticas: "Analyze for Technical Accuracy, Clarity, and Seniority". "Output ONLY JSON".

Output Schema (JSON):

{
"score": 85,
"summary": "String...",
"strengths": ["String", "String"],
"weaknesses": ["String", "String"],
"study_recommendations": ["String", "String"]
}

3. Flujo de Comunicación (Sequence)

Start: Frontend inicializa cliente Bedrock con credenciales temporales del usuario.

Audio Capture: Web Audio API captura el stream del micrófono.

Inferencia Sonic:

Envío de Audio Chunks -> Bedrock Runtime (InvokeModelWithResponseStream).

Recepción de Audio Stream -> Decodificación PCM/WAV -> Playback en navegador.

Side-effect: El texto transcrito (transcript) se guarda en un array local conversationHistory.

End Session: Usuario detiene la grabación.

Analysis:

Frontend envía conversationHistory completo a Nova 2 Lite.

Prompt: "Act as an auditor..."

Render: Frontend parsea el JSON recibido y renderiza la vista Feedback.vue.

4. UI/UX Components (Quasar)

Lobby: QForm, QSelect, QCard (Glassmorphism), QInput (Password type para API Key).

Sonic Room: CSS Animations (@keyframes pulse), visualizador de audio personalizado (Canvas o CSS puro para simplicidad), controles flotantes (QBtn).

Report: QKnob (Score animado), QLinearProgress (Skills), QList (Recomendaciones).

5. Consideraciones de Seguridad

Client-Side: Todo el procesamiento ocurre en el navegador del cliente.

No Persistence: No guardamos logs de audio ni transcripciones en base de datos propia.

CORS: Configuración necesaria si se usa un proxy intermedio, o uso directo desde localhost para demo.
