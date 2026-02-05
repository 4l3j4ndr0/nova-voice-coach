<template>
  <q-page class="flex flex-center q-pa-md">
    <div class="column items-center" style="max-width: 800px; width: 100%;">
      
      <!-- Header -->
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-weight-bold">Interview Analysis</div>
        <div class="text-subtitle1 text-grey-5">Powered by Nova 2 Lite</div>
      </div>

      <!-- Score Card -->
      <q-card class="glass-card q-pa-xl text-center q-mb-lg full-width" style="border-radius: 20px;">
        <div class="text-h6 text-grey-4 q-mb-md">Overall Score</div>
        <q-knob
          v-model="score"
          readonly
          show-value
          size="150px"
          :thickness="0.15"
          color="primary"
          track-color="grey-8"
          class="q-mb-md"
        >
          <template v-slot:default>
            <div class="text-h3 text-weight-bold">{{ score }}</div>
          </template>
        </q-knob>
        <div class="text-body1 text-grey-5">{{ summary }}</div>
      </q-card>

      <!-- Strengths & Weaknesses -->
      <div class="row q-col-gutter-md full-width q-mb-lg">
        <div class="col-12 col-md-6">
          <q-card class="glass-card q-pa-md" style="border-radius: 15px;">
            <div class="text-h6 text-green-4 q-mb-md">
              <q-icon name="check_circle" /> Strengths
            </div>
            <q-list>
              <q-item v-for="(item, idx) in strengths" :key="idx">
                <q-item-section>
                  <q-item-label class="text-grey-3">{{ item }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card class="glass-card q-pa-md" style="border-radius: 15px;">
            <div class="text-h6 text-orange-4 q-mb-md">
              <q-icon name="warning" /> Areas to Improve
            </div>
            <q-list>
              <q-item v-for="(item, idx) in weaknesses" :key="idx">
                <q-item-section>
                  <q-item-label class="text-grey-3">{{ item }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>

      <!-- Study Recommendations -->
      <q-card class="glass-card q-pa-md full-width" style="border-radius: 15px;">
        <div class="text-h6 text-purple-4 q-mb-md">
          <q-icon name="school" /> Study Recommendations
        </div>
        <q-list>
          <q-item v-for="(item, idx) in recommendations" :key="idx">
            <q-item-section avatar>
              <q-icon name="arrow_right" color="purple-4" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-grey-3">{{ item }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Actions -->
      <div class="row q-gutter-md q-mt-xl">
        <q-btn 
          color="primary" 
          label="Try Again" 
          icon="refresh" 
          rounded
          @click="$router.push('/')"
        />
        <q-btn 
          outline 
          color="grey-5" 
          label="Download Report" 
          icon="download" 
          rounded
          @click="downloadReport"
        />
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const router = useRouter();
const $q = useQuasar();

const score = ref(0);
const summary = ref('');
const strengths = ref<string[]>([]);
const weaknesses = ref<string[]>([]);
const recommendations = ref<string[]>([]);
const isAnalyzing = ref(true);

const downloadReport = () => {
  window.print();
};

onMounted(async () => {
  // Get transcript from localStorage
  const transcriptStr = localStorage.getItem('interviewTranscript');
  const configStr = localStorage.getItem('interviewConfig');
  
  if (!transcriptStr) {
    $q.notify({
      type: 'warning',
      message: 'No interview found. Please complete an interview first.',
      icon: 'warning'
    });
    router.push('/');
    return;
  }

  $q.loading.show({ message: 'Analyzing interview with Nova 2 Lite...' });

  try {
    const transcript = JSON.parse(transcriptStr);
    const config = configStr ? JSON.parse(configStr) : {};

    console.log('Sending to analysis:', { transcript: transcript.length, config });

    // Get AWS credentials from localStorage
    const accessKeyId = localStorage.getItem('aws_access_key_id');
    const secretAccessKey = localStorage.getItem('aws_secret_access_key');
    const sessionToken = localStorage.getItem('aws_session_token');

    const awsCredentials: any = {
      accessKeyId,
      secretAccessKey
    };

    // Only add sessionToken if it exists, is not empty, and is not a placeholder
    if (sessionToken && sessionToken.trim() !== '' && sessionToken !== 'optional-token') {
      awsCredentials.sessionToken = sessionToken;
    }

    // Call backend to analyze with Nova 2 Lite
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, config, awsCredentials })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Analysis failed');
    }

    const analysis = await response.json();
    console.log('Analysis received:', analysis);
    
    // Update UI with analysis
    score.value = analysis.score || 0;
    summary.value = analysis.summary || 'No summary available';
    strengths.value = analysis.strengths || [];
    weaknesses.value = analysis.weaknesses || [];
    recommendations.value = analysis.study_recommendations || [];

    $q.loading.hide();
    isAnalyzing.value = false;

  } catch (error: any) {
    console.error('Analysis error:', error);
    $q.loading.hide();
    
    $q.notify({
      type: 'negative',
      message: 'Failed to analyze interview. Showing sample feedback.',
      caption: error.message,
      icon: 'error',
      timeout: 3000
    });
    
    // Fallback data
    score.value = 75;
    summary.value = 'Analysis service temporarily unavailable.';
    strengths.value = [
      'Demonstrated technical knowledge during the interview',
      'Maintained clear communication throughout'
    ];
    weaknesses.value = [
      'Analysis could not be completed - please try again'
    ];
    recommendations.value = [
      'Complete another interview for detailed feedback',
      'Ensure backend service is running on port 3001'
    ];
    isAnalyzing.value = false;
  }
});
</script>
