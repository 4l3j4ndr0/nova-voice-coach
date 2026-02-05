# 🎤 Nova Voice Coach

> **Real-time AI-powered technical interview simulator using Amazon Nova 2 Sonic and Nova 2 Lite**

[![AWS](https://img.shields.io/badge/AWS-Bedrock-FF9900?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/bedrock/)
[![Nova 2 Sonic](https://img.shields.io/badge/Nova%202-Sonic-667eea?style=for-the-badge)](https://aws.amazon.com/bedrock/nova/)
[![Nova 2 Lite](https://img.shields.io/badge/Nova%202-Lite-764ba2?style=for-the-badge)](https://aws.amazon.com/bedrock/nova/)
[![Vue 3](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vue.js)](https://vuejs.org/)
[![Quasar](https://img.shields.io/badge/Quasar-2-1976D2?style=for-the-badge&logo=quasar)](https://quasar.dev/)

## 🌟 Overview

**Nova Voice Coach** is an immersive, real-time voice interview simulator that helps engineers and developers practice technical interviews with AI. Using Amazon Bedrock's cutting-edge multimodal models, it provides:

- 🗣️ **Natural voice conversations** with Amazon Nova 2 Sonic (speech-to-speech)
- 📊 **Intelligent post-interview analysis** with Amazon Nova 2 Lite
- 🎯 **Personalized feedback** on technical accuracy, communication clarity, and seniority level
- 🌍 **Multi-language support** (10 languages including English, Spanish, French, German, Portuguese, Italian, Hindi)
- 🎭 **Customizable interviewer personality** (Friendly, Professional, Strict)

---

## 🏆 Hackathon Categories

- **Primary:** Voice AI (Amazon Nova 2 Sonic)
- **Secondary:** Agentic AI (Amazon Nova 2 Lite for reasoning and evaluation)
- **Impact:** Educational / Community Growth

---

## 🎯 Problem Statement

Technical interviews are intimidating, especially for:
- **Junior engineers** lacking confidence and experience
- **Non-native English speakers** struggling with fluency and technical jargon
- **Senior engineers** needing to practice soft skills for remote positions

Traditional mock interviews are expensive, time-consuming, and often lack objective feedback.

---

## 💡 Solution

Nova Voice Coach democratizes access to high-quality technical interview practice by:

1. **Realistic Simulation:** Low-latency voice interaction mimics real interviews
2. **Objective Evaluation:** AI-powered analysis provides unbiased feedback
3. **Accessibility:** Available 24/7, supports multiple languages and tech stacks
4. **Privacy-First:** No data persistence, client-side processing

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Vue.js 3 + TypeScript
- Quasar Framework (Material Design)
- Socket.IO Client
- Web Audio API (PCM audio processing)

**Backend:**
- Node.js + Express
- Socket.IO Server
- AWS SDK for JavaScript v3
- Amazon Bedrock Runtime

**AI Models:**
- **Amazon Nova 2 Sonic** (`amazon.nova-sonic-v1:0`) - Real-time speech-to-speech
- **Amazon Nova 2 Lite** (`us.amazon.nova-lite-v1:0`) - Post-interview analysis

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Vue 3)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ IndexPage    │  │ InterviewPage│  │ FeedbackPage │      │
│  │ (Config)     │→ │ (Voice Chat) │→ │ (Analysis)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         │                  ↓                  ↓              │
│         │          ┌──────────────┐   ┌──────────────┐      │
│         │          │ useNovaSocket│   │ localStorage │      │
│         │          │ (Socket.IO)  │   │ (Transcript) │      │
│         │          └──────────────┘   └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │                  │
                            ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Socket.IO Server                        │   │
│  │  • Session Management                                │   │
│  │  • Audio Streaming (PCM Int16, 16kHz)               │   │
│  │  • Event Handling (audioInput, contentEnd)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         NovaSessionManager                           │   │
│  │  • Bidirectional Streaming                          │   │
│  │  • Silence Detection (2s timeout)                   │   │
│  │  • Voice ID Mapping (10 languages x 2 genders)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         REST API (/api/analyze)                      │   │
│  │  • Transcript Analysis with Nova 2 Lite             │   │
│  │  • JSON Response (score, strengths, weaknesses)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Amazon Bedrock                            │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │  Nova 2 Sonic        │  │  Nova 2 Lite         │         │
│  │  • Speech-to-Speech  │  │  • Text Analysis     │         │
│  │  • 10 Languages      │  │  • JSON Output       │         │
│  │  • 20 Voice IDs      │  │  • Reasoning         │         │
│  └──────────────────────┘  └──────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **AWS Account** with Bedrock access
- **AWS CLI** configured with credentials
- **Microphone** access (HTTPS required for mobile)

### AWS Setup

1. **Enable Amazon Bedrock Models:**
   ```bash
   # Navigate to AWS Console → Bedrock → Model Access
   # Request access to:
   # - amazon.nova-sonic-v1:0
   # - us.amazon.nova-lite-v1:0
   ```

2. **Configure AWS Credentials:**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Default region: us-east-1
   ```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/4l3j4ndr0/nova-voice-coach.git
   cd nova-voice-coach
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

   Or install separately:
   ```bash
   # Frontend
   cd app
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Configure environment variables (Backend):**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env if needed (AWS credentials are read from AWS CLI by default)
   ```

### Running the Application

**Option 1: Using root scripts (Recommended)**
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run dev
```

**Option 2: Manual**
```bash
# Terminal 1 - Backend
cd backend
npm start
# Server runs on http://localhost:3001

# Terminal 2 - Frontend
cd app
npm run dev
# Frontend runs on http://localhost:9000
```

### Access the Application

- Open your browser to `http://localhost:9000`
- Allow microphone permissions when prompted
- Configure your AWS credentials in the app (click "Configure Credentials" button)
- Start practicing!

---

## 🎮 How to Use

### 1. Configure Your Interview

- **Enter your name**
- **Select target role** (e.g., Senior Cloud Architect, DevOps Engineer)
- **Choose tech stack** (e.g., AWS General, Network, Kubernetes)
- **Pick interviewer personality:**
  - 🙂 **Friendly:** Warm and encouraging
  - 💼 **Professional:** Balanced and polite
  - ⚖️ **Strict:** Direct and challenging
- **Select language** (10 options available)
- **Choose voice gender** (Male/Female)

### 2. Conduct the Interview

- Click **"Start Interview"** (microphone permissions will be requested)
- The AI interviewer will greet you and ask 10-15 technical questions
- Speak naturally - the system detects silence and responds automatically
- Visual indicators show when you're speaking (green rings) or AI is responding (purple orb)
- Real-time transcription appears on screen
- Click **"End Interview"** when ready

### 3. Review Your Feedback

- **Overall Score** (0-100) with visual gauge
- **Strengths:** What you did well
- **Areas to Improve:** Specific weaknesses identified
- **Study Recommendations:** Actionable next steps
- **Download Report:** Save your feedback as a text file

---

## 🎨 Features

### Real-Time Voice Interaction
- **Low-latency streaming** (<1.5s response time)
- **Natural conversation flow** with interruption handling
- **Silence detection** (2-second timeout triggers AI response)
- **Audio scheduling** for seamless playback without gaps

### Intelligent Analysis
- **Technical Accuracy** (40%): Correctness of answers
- **Communication Clarity** (30%): Explanation quality
- **Seniority Level** (30%): Depth and strategic thinking

### User Experience
- **Glassmorphism UI** with animated sonic orb
- **Responsive design** (mobile and desktop)
- **Dark mode** optimized for long sessions
- **Accessibility** compliant

### Privacy & Security
- **No data persistence:** Transcripts stored only in browser localStorage
- **Client-side processing:** Audio never leaves your device unencrypted
- **AWS credentials:** Uses your own AWS account (BYOK model)

---

## 📊 Technical Highlights

### Audio Processing
- **Format:** PCM Int16, 16kHz, mono
- **Encoding:** Base64 for transmission
- **Buffer size:** 4096 samples (256ms at 16kHz)
- **Conversion:** Float32 → Int16 → Base64

### Bedrock Integration
- **Bidirectional streaming** with async iterables
- **Event-driven architecture:**
  - `sessionStart` → `promptStart` → `contentStart` → `audioInput` → `contentEnd`
  - Receives: `audioOutput`, `textOutput`, `usageEvent`
- **Voice ID mapping:** 10 languages × 2 genders = 20 voice options

### Prompt Engineering
- **Interviewer prompt:** 10-15 question structure with adaptation logic
- **Analyzer prompt:** 3-criteria evaluation (Technical, Communication, Seniority)
- **JSON-only output** for structured feedback

---

## 🛠️ Development

### Project Structure

```
nova-voice-coach/
├── app/                          # Frontend (Vue 3 + Quasar)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── IndexPage.vue         # Configuration lobby
│   │   │   ├── InterviewPage.vue     # Voice interview room
│   │   │   └── FeedbackPage.vue      # Analysis results
│   │   ├── composables/
│   │   │   ├── useSession.ts         # Session state management
│   │   │   ├── useNovaSocket.ts      # Socket.IO client
│   │   │   └── useAudioRecorder.ts   # Microphone capture
│   │   ├── layouts/
│   │   │   └── MainLayout.vue        # App layout with credentials config
│   │   └── assets/
│   │       └── nova-logo.svg         # Animated logo
│   ├── public/                       # Static assets
│   ├── quasar.config.ts             # Quasar configuration
│   └── package.json                 # Frontend dependencies
├── backend/
│   ├── server.js                 # Express + Socket.IO server
│   ├── services/
│   │   └── NovaSessionManager.js # Bedrock integration
│   └── package.json              # Backend dependencies
├── .kiro/                        # Kiro configuration
├── README.md                     # Documentation
└── package.json                  # Root scripts
```

### Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend Framework | Vue 3 + TypeScript | Reactive UI |
| UI Library | Quasar Framework | Material Design components |
| Real-time Communication | Socket.IO | Bidirectional streaming |
| Audio Processing | Web Audio API | PCM capture and playback |
| Backend | Node.js + Express | REST API and WebSocket server |
| AI Models | Amazon Bedrock | Nova 2 Sonic + Nova 2 Lite |
| State Management | Composables | Lightweight state |

---

## 🔧 Configuration

### Environment Variables (Backend)

```bash
# backend/.env
PORT=3001
AWS_REGION=us-east-1
# AWS credentials are read from AWS CLI by default
```

### Supported Languages

| Language | Code | Male Voice | Female Voice |
|----------|------|------------|--------------|
| English (US) | en-US | matthew | tiffany |
| English (UK) | en-GB | matthew | amy |
| English (AU) | en-AU | matthew | olivia |
| English (IN) | en-IN | arjun | kiara |
| Spanish (US) | es-US | carlos | lupe |
| Portuguese (BR) | pt-BR | leo | carolina |
| French | fr-FR | florian | ambre |
| German | de-DE | lennart | tina |
| Italian | it-IT | lorenzo | beatrice |
| Hindi | hi-IN | arjun | kiara |

---

## 📱 Mobile Support

**Important:** Microphone access requires HTTPS on mobile devices.

### Option 1: Use ngrok (Recommended)
```bash
# Install ngrok: https://ngrok.com/download

# Expose frontend
ngrok http 9000

# Expose backend
ngrok http 3001

# Update frontend to use ngrok backend URL
```

### Option 2: Local HTTPS
```bash
# Generate self-signed certificate
# Configure Quasar to use HTTPS
# Update backend CORS settings
```

---

## 🎯 Use Cases

1. **Interview Preparation:** Practice before real technical interviews
2. **Language Practice:** Improve technical English for non-native speakers
3. **Skill Assessment:** Identify knowledge gaps in specific tech stacks
4. **Confidence Building:** Reduce interview anxiety through repetition
5. **Team Training:** Standardize interview preparation for engineering teams

---

## 🚧 Known Limitations

- **Microphone required:** Desktop/laptop recommended for best experience
- **HTTPS for mobile:** Mobile devices need HTTPS for microphone access
- **AWS Bedrock access:** Requires AWS account with Bedrock model access
- **Internet connection:** Real-time streaming requires stable connection
- **Browser compatibility:** Chrome, Firefox, Safari (latest versions)

---

## 🔮 Future Enhancements

- [ ] Multi-turn conversation memory
- [ ] Custom question banks
- [ ] Video recording and analysis
- [ ] Team collaboration features
- [ ] Progress tracking dashboard
- [ ] Integration with job platforms
- [ ] Whiteboard/code editor for technical questions
- [ ] Support for more languages and voices

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Amazon Web Services** for Bedrock and Nova models
- **Quasar Framework** for the excellent UI toolkit
- **Vue.js community** for the reactive framework
- **Socket.IO** for real-time communication

---

## 📞 Contact & Support

For questions, issues, or feedback:
- Open an issue on GitHub
- Contact the development team

---

## 🎉 Demo

[Add demo video or screenshots here]

---

**Built with ❤️ for the AWS Hackathon**

*Empowering engineers worldwide to ace their technical interviews*
