<template>
  <q-page class="flex flex-center">
    <div
      class="column items-center justify-between full-width"
      style="max-height: 90vh; padding: 20px"
    >
      <!-- Top Info -->
      <div class="text-center q-mb-md">
        <div class="text-h5 text-weight-bold">
          {{ config.role || "Technical Interview" }}
        </div>
        <div class="text-subtitle2 text-grey-5">
          {{ config.techStack?.join(", ") || "General Tech" }}
        </div>
        <q-badge color="red" class="q-mt-sm" v-if="isRecording">
          <q-icon name="fiber_manual_record" size="xs" class="q-mr-xs" />
          LIVE
        </q-badge>
      </div>

      <!-- The AI Visualizer (Nova Sonic) -->
      <div class="sonic-orb-container q-my-lg">
        <!-- User Mic Rings (Ripple when user speaks) -->
        <div
          class="mic-rings"
          :class="{ 'mic-active': isUserSpeaking && !isMuted }"
        >
          <div class="mic-ring"></div>
          <div class="mic-ring"></div>
          <div class="mic-ring"></div>
        </div>

        <!-- AI Core (Pulses when AI speaks) -->
        <div
          class="sonic-orb shadow-24"
          :class="{
            'orb-speaking': isAiSpeaking,
            'orb-idle': !isAiSpeaking && !isUserSpeaking,
          }"
        >
          <q-icon
            name="graphic_eq"
            color="white"
            size="80px"
            style="opacity: 0.9"
          />
        </div>
      </div>

      <!-- Status Text with Transcript -->
      <div
        class="status-container q-my-md text-center"
        style="min-height: 120px; max-width: 600px"
      >
        <div class="text-h6 q-mb-sm">
          <span v-if="isAiSpeaking" class="text-purple-300 animated-text">
            <q-icon name="record_voice_over" size="sm" class="q-mr-xs" />
            AI is speaking...
          </span>
          <span
            v-else-if="isUserSpeaking && !isMuted"
            class="text-green-400 animated-text"
          >
            <q-icon name="mic" size="sm" class="q-mr-xs" />
            Listening to you...
          </span>
          <span v-else-if="isMuted" class="text-red-400">
            <q-icon name="mic_off" size="sm" class="q-mr-xs" />
            Microphone muted
          </span>
          <span v-else class="text-grey-5">
            <q-icon name="hearing" size="sm" class="q-mr-xs" />
            Ready to listen...
          </span>
        </div>

        <!-- Last Transcript -->
        <div
          v-if="lastTranscript"
          class="glass-card q-pa-md rounded-borders text-body2 text-grey-3"
        >
          <div class="text-weight-bold text-purple-300 q-mb-xs">
            {{ lastTranscript.role === "USER" ? "You" : "AI" }}:
          </div>
          {{ lastTranscript.content }}
        </div>
      </div>

      <!-- Controls -->
      <div
        class="row q-gutter-lg items-center q-mt-auto glass-card q-pa-lg rounded-borders"
      >
        <q-btn
          round
          size="xl"
          :color="isMuted ? 'red-7' : 'grey-8'"
          :icon="isMuted ? 'mic_off' : 'mic'"
          @click="toggleMute"
          class="shadow-5"
        >
          <q-tooltip>{{ isMuted ? "Unmute" : "Mute" }} Microphone</q-tooltip>
        </q-btn>

        <q-btn
          color="red-6"
          label="End Interview"
          icon="stop"
          rounded
          size="lg"
          padding="12px 40px"
          @click="endInterview"
          class="shadow-5"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAudioRecorder } from "../../src/composables/useAudioRecorder";
import { useNovaSocket } from "../../src/composables/useNovaSocket";
import { useSession } from "../../src/composables/useSession";

const router = useRouter();
const $q = useQuasar();
const { isRecording, startRecording, stopRecording } = useAudioRecorder();
const {
  connect,
  initSession,
  sendAudio,
  endSession,
  onAudioOutput,
  onTextOutput,
  disconnect,
  sessionId: socketSessionId,
} = useNovaSocket();
const { getFullConfig } = useSession();

const config = getFullConfig();
const isMuted = ref(false);
const isAiSpeaking = ref(false);
const isUserSpeaking = ref(false);
const lastTranscript = ref<{ role: string; content: string } | null>(null);
const audioContext = ref<AudioContext | null>(null);
const conversationHistory = ref<any[]>([]);
const isSessionReady = ref(false);
let scheduledEndTime = 0;

const toggleMute = () => {
  isMuted.value = !isMuted.value;
};

const playAudioResponse = async (audioData: any) => {
  try {
    if (!audioContext.value) {
      audioContext.value = new AudioContext({ sampleRate: 16000 });
    }

    const binaryString = atob(audioData.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 0x7fff;
    }

    const audioBuffer = audioContext.value.createBuffer(
      1,
      float32Array.length,
      16000,
    );
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioContext.value.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.value.destination);

    // Schedule playback
    const now = audioContext.value.currentTime;
    const startTime = Math.max(scheduledEndTime, now);
    source.start(startTime);
    scheduledEndTime = startTime + audioBuffer.duration;

    isAiSpeaking.value = true;
    source.onended = () => {
      if (
        audioContext.value &&
        audioContext.value.currentTime >= scheduledEndTime - 0.01
      ) {
        isAiSpeaking.value = false;
      }
    };
  } catch (error) {
    console.error("Error playing audio:", error);
  }
};

const endInterview = async () => {
  stopRecording();
  endSession();

  // Save final transcript
  localStorage.setItem(
    "interviewTranscript",
    JSON.stringify(conversationHistory.value),
  );
  localStorage.setItem("interviewConfig", JSON.stringify(config));

  $q.notify({
    type: "info",
    position: "top",
    message: "Interview ended. Analyzing with Nova 2 Lite...",
    icon: "analytics",
  });

  setTimeout(() => {
    router.push("/feedback");
  }, 1500);
};

onMounted(async () => {
  $q.loading.show({ message: "Connecting to Nova Sonic..." });

  try {
    // Connect to Socket.IO
    await connect();

    // Initialize session with config
    const config = getFullConfig();
    await initSession(config);

    console.log("Session initialized, ID:", socketSessionId.value);
    isSessionReady.value = true;

    // Setup event listeners
    onAudioOutput((audioData) => {
      playAudioResponse(audioData);
    });

    onTextOutput((textData) => {
      console.log("Received text:", textData.content);
      lastTranscript.value = { role: textData.role, content: textData.content };
      conversationHistory.value.push({
        role: textData.role,
        type: "text",
        content: textData.content,
      });

      // Save to localStorage for analysis
      localStorage.setItem(
        "interviewTranscript",
        JSON.stringify(conversationHistory.value),
      );
    });

    // Start recording with callback
    const success = await startRecording((pcmBase64) => {
      if (!isMuted.value && isSessionReady.value) {
        sendAudio(pcmBase64);
        isUserSpeaking.value = true;
        setTimeout(() => {
          isUserSpeaking.value = false;
        }, 300);
      }
    });

    if (!success) {
      throw new Error("Failed to start recording");
    }

    $q.loading.hide();
  } catch (error: any) {
    $q.loading.hide();
    $q.notify({
      type: "negative",
      message: error.message || "Failed to connect to Nova Sonic",
      icon: "error",
    });
    router.push("/");
  }
});

onUnmounted(() => {
  stopRecording();
  disconnect();
  if (audioContext.value) {
    audioContext.value.close();
  }
});
</script>

<style scoped lang="scss">
.sonic-orb-container {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-rings {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.mic-ring {
  position: absolute;
  width: 200px;
  height: 200px;
  border: 3px solid rgba(76, 175, 80, 0.3);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.8);
}

.mic-active .mic-ring {
  animation: ripple 1.5s ease-out infinite;
}

.mic-active .mic-ring:nth-child(2) {
  animation-delay: 0.3s;
}

.mic-active .mic-ring:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.sonic-orb {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
  transition: all 0.3s ease;
}

.orb-idle {
  animation: breathe 3s ease-in-out infinite;
}

.orb-speaking {
  animation: pulse 0.8s ease-in-out infinite;
  box-shadow:
    0 0 40px rgba(118, 75, 162, 0.8),
    0 0 80px rgba(102, 126, 234, 0.6);
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(118, 75, 162, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(118, 75, 162, 0.6);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.animated-text {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-container {
  width: 100%;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
