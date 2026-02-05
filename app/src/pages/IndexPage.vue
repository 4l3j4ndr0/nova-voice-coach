<template>
  <q-page class="flex flex-center q-pa-md">
    <div class="row justify-center full-width" style="max-width: 1000px">
      <!-- Left Column: Title & Info -->
      <div
        class="col-12 col-md-5 q-pa-md column justify-center"
        :class="$q.screen.lt.md ? 'text-center' : 'text-left'"
      >
        <div
          class="text-weight-bolder q-mb-md"
          :class="$q.screen.lt.md ? 'text-h4' : 'text-h3'"
        >
          Master Your Next <br />
          <span class="text-gradient">Tech Interview</span>
        </div>
        <p
          class="text-grey-4"
          :class="$q.screen.lt.md ? 'text-body2' : 'text-body1'"
        >
          Simulate a real interview with low-latency AI. Choose your stack,
          define the difficulty, and get instant feedback.
        </p>
        <div
          class="q-mt-lg row q-gutter-sm"
          :class="$q.screen.lt.md ? 'justify-center' : ''"
        >
          <q-chip
            icon="speed"
            color="dark"
            text-color="green-4"
            :size="$q.screen.lt.md ? 'sm' : 'md'"
          >
            Nova 2 Sonic
          </q-chip>
          <q-chip
            icon="psychology"
            color="dark"
            text-color="purple-4"
            :size="$q.screen.lt.md ? 'sm' : 'md'"
          >
            Nova 2 Lite
          </q-chip>
        </div>
      </div>

      <!-- Right Column: Configuration Form -->
      <div class="col-12 col-md-7 q-pa-md">
        <q-card
          class="glass-card shadow-10"
          :class="$q.screen.lt.md ? 'q-pa-md' : 'q-pa-lg'"
          style="border-radius: 20px"
        >
          <q-form @submit.prevent="startInterview">
            <!-- User Name -->
            <div class="q-mb-md">
              <div class="text-subtitle2 text-grey-5 q-mb-xs">YOUR NAME</div>
              <q-input
                dark
                outlined
                dense
                v-model="userName"
                label="Ex: John Doe"
                color="primary"
              >
                <template v-slot:prepend><q-icon name="person" /></template>
              </q-input>
            </div>

            <!-- Role Selection -->
            <div class="q-mb-md">
              <div class="text-subtitle2 text-grey-5 q-mb-xs">TARGET ROLE</div>
              <q-select
                dark
                outlined
                dense
                v-model="config.role"
                :options="filteredRoleOptions"
                use-input
                @filter="filterRoles"
                @input-value="setRole"
                label="Ex: Senior DevOps Engineer"
                color="primary"
                behavior="menu"
              >
                <template v-slot:prepend><q-icon name="work" /></template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey"
                      >Type your custom role</q-item-section
                    >
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Tech Stack -->
            <div class="q-mb-md">
              <div class="text-subtitle2 text-grey-5 q-mb-xs">TECH STACK</div>
              <q-select
                dark
                outlined
                dense
                v-model="config.techStack"
                use-input
                use-chips
                multiple
                hide-dropdown-icon
                input-debounce="0"
                @new-value="createValue"
                label="Type & Press Enter"
                color="secondary"
              >
                <template v-slot:prepend><q-icon name="code" /></template>
              </q-select>
            </div>

            <!-- Language -->
            <div class="q-mb-md">
              <div class="text-subtitle2 text-grey-5 q-mb-xs">LANGUAGE</div>
              <q-select
                dark
                outlined
                dense
                v-model="config.language"
                :options="languageOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                color="primary"
                behavior="menu"
              >
                <template v-slot:prepend><q-icon name="language" /></template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <div style="font-size: 1.5em">{{ scope.opt.flag }}</div>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Tone -->
            <div class="q-mb-md">
              <div class="text-subtitle2 text-grey-5 q-mb-sm">PERSONALITY</div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="tone in toneOptions"
                  :key="tone.value"
                  class="col-4"
                >
                  <q-card
                    class="personality-card text-center cursor-pointer"
                    :class="
                      config.tone === tone.value ? 'selected' : 'bg-grey-9'
                    "
                    @click="config.tone = tone.value"
                    v-ripple
                    style="padding: 12px 4px;"
                  >
                    <q-icon
                      :name="tone.icon"
                      :size="$q.screen.lt.sm ? '24px' : 'md'"
                    />
                    <div
                      class="text-weight-bold text-uppercase q-mt-xs"
                      :style="$q.screen.lt.sm ? 'font-size: 0.6rem; line-height: 1.2;' : 'font-size: 0.75rem;'"
                    >
                      {{ tone.label }}
                    </div>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- Voice -->
            <div class="q-mb-lg">
              <div class="text-subtitle2 text-grey-5 q-mb-sm">VOICE</div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="voice in voiceOptions"
                  :key="voice.value"
                  class="col-6"
                >
                  <q-card
                    class="personality-card text-center cursor-pointer"
                    :class="
                      config.voiceGender === voice.value
                        ? 'selected'
                        : 'bg-grey-9'
                    "
                    @click="config.voiceGender = voice.value"
                    v-ripple
                    :style="
                      $q.screen.lt.md ? 'padding: 8px;' : 'padding: 16px;'
                    "
                  >
                    <q-icon
                      :name="voice.icon"
                      :size="$q.screen.lt.md ? 'sm' : 'md'"
                    />
                    <div
                      class="text-caption text-weight-bold text-uppercase"
                      :style="$q.screen.lt.md ? 'font-size: 0.65rem;' : ''"
                    >
                      {{ voice.label }}
                    </div>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <q-btn
              type="submit"
              color="primary"
              class="full-width shadow-10"
              :size="$q.screen.lt.md ? 'md' : 'lg'"
              rounded
              label="Start Interview"
              icon-right="mic"
            />
          </q-form>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useSession } from "../../src/composables/useSession";

const router = useRouter();
const $q = useQuasar();
const { userName, setInterviewConfig } = useSession();

const config = ref({
  role: "Senior Cloud Architect",
  techStack: ["AWS General", "Network"],
  tone: "strict",
  language: "en-US",
  voiceGender: "male",
});

const roleOptions = [
  "Senior Cloud Architect",
  "DevOps Engineer",
  "Full Stack Developer",
  "Backend Developer",
  "Frontend Developer",
  "Data Scientist",
  "Data Engineer",
];

const filteredRoleOptions = ref(roleOptions);

const filterRoles = (val: string, update: any) => {
  update(() => {
    const needle = val.toLowerCase();
    filteredRoleOptions.value = roleOptions.filter((v) =>
      v.toLowerCase().includes(needle),
    );
  });
};

const setRole = (val: string) => {
  config.value.role = val;
};

const createValue = (val: string, done: any) => {
  if (val.length > 0) {
    done(val, "add-unique");
  }
};

const languageOptions = [
  { label: "English (US)", value: "en-US", flag: "🇺🇸" },
  { label: "English (UK)", value: "en-GB", flag: "🇬🇧" },
  { label: "English (AU)", value: "en-AU", flag: "🇦🇺" },
  { label: "English (IN)", value: "en-IN", flag: "🇮🇳" },
  { label: "Spanish (US)", value: "es-US", flag: "🇪🇸" },
  { label: "Portuguese (BR)", value: "pt-BR", flag: "🇧🇷" },
  { label: "French", value: "fr-FR", flag: "🇫🇷" },
  { label: "German", value: "de-DE", flag: "🇩🇪" },
  { label: "Italian", value: "it-IT", flag: "🇮🇹" },
  { label: "Hindi", value: "hi-IN", flag: "🇮🇳" },
];

const toneOptions = [
  { label: "Friendly", value: "friendly", icon: "sentiment_satisfied" },
  { label: "Professional", value: "professional", icon: "business_center" },
  { label: "Strict", value: "strict", icon: "gavel" },
];

const voiceOptions = [
  { label: "Male", value: "male", icon: "face" },
  { label: "Female", value: "female", icon: "face_3" },
];

const startInterview = async () => {
  if (!userName.value || userName.value.trim() === '') {
    $q.notify({
      type: "warning",
      message: "Please enter your name",
      icon: "warning",
    });
    return;
  }

  // Validate AWS credentials
  const accessKeyId = localStorage.getItem('aws_access_key_id');
  const secretAccessKey = localStorage.getItem('aws_secret_access_key');
  
  if (!accessKeyId || !secretAccessKey) {
    $q.notify({
      type: "negative",
      message: "Please configure your AWS credentials first",
      icon: "vpn_key",
      caption: "Click 'Configure Credentials' in the header",
      timeout: 3000
    });
    return;
  }

  // Request microphone permissions before starting
  $q.loading.show({ message: 'Requesting microphone access...' });
  
  try {
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support microphone access. Please use Chrome, Firefox, or Safari.');
    }

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Stop the stream immediately (we just needed permission)
    stream.getTracks().forEach(track => track.stop());
    
    $q.loading.hide();
    
    // Permissions granted, proceed to interview
    setInterviewConfig(config.value);
    router.push("/interview");
    
  } catch (error: any) {
    $q.loading.hide();
    
    console.error('Microphone permission error:', error);
    
    let errorMessage = 'Failed to access microphone';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found. Please connect a microphone and try again.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Microphone is being used by another application.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    $q.notify({
      type: "negative",
      message: errorMessage,
      icon: "mic_off",
      timeout: 5000
    });
  }
};
</script>

<style scoped lang="scss">
.text-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.personality-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(102, 126, 234, 0.3);
  }

  &.selected {
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.2) 0%,
      rgba(118, 75, 162, 0.2) 100%
    );
    border-color: #667eea;
  }
}
</style>
