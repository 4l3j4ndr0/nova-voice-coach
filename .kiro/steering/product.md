Product Definition: CloudOps Voice Coach

1. Visión del Producto

"CloudOps Voice Coach" es una plataforma de entrenamiento inmersiva que democratiza el acceso a simulaciones de entrevistas técnicas de alto nivel. Utilizando Inteligencia Artificial Generativa multimodal, permite a ingenieros y desarrolladores practicar entrevistas técnicas en tiempo real, rompiendo barreras de idioma y ansiedad mediante feedback instantáneo y objetivo.

2. Propuesta de Valor Única (UVP)

Realismo Extremo: A diferencia de los chatbots de texto, utilizamos Amazon Nova 2 Sonic para lograr una interacción de voz fluida (speech-to-speech) con baja latencia, permitiendo interrupciones y entonación humana.

Evaluación Objetiva: Uso de Amazon Nova 2 Lite para auditar la entrevista, generando un "Scorecard" basado en precisión técnica, claridad y seniority.

Agnóstico y Personalizable: El usuario define el Rol, el Stack Tecnológico y la "Personalidad" del entrevistador (Amigable vs. Estricto).

3. Categorías del Hackathon

Primary: Voice AI (Uso de Nova 2 Sonic).

Secondary: Agentic AI (Uso de Nova 2 Lite para razonamiento y evaluación).

Impact: Educational / Community Growth.

4. User Personas

El Candidato Junior: Necesita ganar confianza y aprender la jerga técnica correcta.

El Ingeniero Senior (Non-Native English Speaker): Experto técnico que necesita practicar su fluidez y "soft skills" en inglés para aplicar a trabajos remotos.

El Hiring Manager: (Futuro) Podría usar la herramienta para filtrar candidatos masivamente.

5. User Journey (Flujo Principal)

Onboarding (Lobby):

Usuario ingresa su AWS/Nova API Key (BYOK - Bring Your Own Key).

Selecciona el Rol (ej. "DevOps Engineer").

Define el Stack (ej. "Terraform, AWS Lambda").

Elige el Tono del Entrevistador (Friendly, Professional, Strict).

La Entrevista (The Sonic Room):

Experiencia "Hands-free". Interfaz minimalista (Orbe Sónico).

Interacción de voz bidireccional en tiempo real.

Duración típica: 3-5 minutos de preguntas y respuestas.

Resultados (Feedback Loop):

Visualización gamificada del puntaje (0-100).

Desglose de Fortalezas y Debilidades.

Recomendaciones de estudio accionables.

6. Requerimientos Funcionales Clave

RF1: El sistema debe capturar audio del micrófono del navegador.

RF2: La latencia de respuesta de la IA debe ser menor a 1.5 segundos para mantener la naturalidad.

RF3: El reporte final debe generarse en formato JSON estructurado para su visualización.

RF4: Privacidad total: Las API Keys no se guardan en backend, solo en memoria del navegador.
