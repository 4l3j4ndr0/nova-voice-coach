<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="glass-header text-white">
      <q-toolbar>
        <img src="~assets/nova-logo.svg" style="width: 40px; height: 40px;" alt="Nova Logo" />
        <q-toolbar-title class="q-ml-sm" style="white-space: nowrap; overflow: visible;">
          Nova <span class="text-weight-bold">Voice Coach</span>
        </q-toolbar-title>

        <q-space />

        <!-- Welcome Message (hide on mobile) -->
        <div v-if="userName" class="text-subtitle2 text-grey-4 gt-sm" style="white-space: nowrap;">
          Welcome, <span class="text-white text-weight-medium">{{ userName }}</span>
        </div>

        <!-- Configure Credentials Button -->
        <q-btn
          flat
          dense
          icon="vpn_key"
          :label="$q.screen.gt.xs ? 'Configure Credentials' : undefined"
          :color="areCredentialsConfigured ? 'positive' : 'grey-5'"
          class="q-ml-sm"
          @click="showCredentialsDialog = true"
        >
          <q-badge v-if="areCredentialsConfigured" color="positive" floating rounded>
            <q-icon name="check" size="10px" />
          </q-badge>
          <q-tooltip>{{ areCredentialsConfigured ? 'Credentials Configured ✓' : 'Configure AWS Credentials' }}</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Credentials Dialog -->
    <q-dialog v-model="showCredentialsDialog">
      <q-card :style="$q.screen.lt.sm ? 'width: 90vw' : 'min-width: 400px'" class="glass-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">AWS Credentials</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-input
            dark
            outlined
            dense
            v-model="credentials.accessKeyId"
            label="Access Key ID *"
            type="text"
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="key" />
            </template>
          </q-input>

          <q-input
            dark
            outlined
            dense
            v-model="credentials.secretAccessKey"
            label="Secret Access Key *"
            type="password"
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-input
            dark
            outlined
            dense
            v-model="credentials.sessionToken"
            label="Session Token (Optional)"
            type="password"
          >
            <template v-slot:prepend>
              <q-icon name="token" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn 
            flat 
            color="negative" 
            label="Clear" 
            icon="delete" 
            @click="clearCredentials" 
          />
          <q-btn color="primary" label="Save" @click="saveCredentials" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useSession } from "../../src/composables/useSession";
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { userName } = useSession();

const showCredentialsDialog = ref(false);
const credentialsVersion = ref(0); // Force reactivity
const credentials = ref({
  accessKeyId: localStorage.getItem('aws_access_key_id') || '',
  secretAccessKey: localStorage.getItem('aws_secret_access_key') || '',
  sessionToken: localStorage.getItem('aws_session_token') || ''
});

const areCredentialsConfigured = computed(() => {
  credentialsVersion.value; // Trigger reactivity
  const accessKey = localStorage.getItem('aws_access_key_id');
  const secretKey = localStorage.getItem('aws_secret_access_key');
  return !!(accessKey && secretKey);
});

// Check for credentials in query params on mount
onMounted(() => {
  const accessKeyId = route.query.accessKeyId as string;
  const secretAccessKey = route.query.secretAccessKey as string;
  const sessionToken = route.query.sessionToken as string;

  if (accessKeyId && secretAccessKey) {
    localStorage.setItem('aws_access_key_id', accessKeyId);
    localStorage.setItem('aws_secret_access_key', secretAccessKey);
    if (sessionToken) {
      localStorage.setItem('aws_session_token', sessionToken);
    }
    
    credentials.value.accessKeyId = accessKeyId;
    credentials.value.secretAccessKey = secretAccessKey;
    credentials.value.sessionToken = sessionToken || '';
    
    credentialsVersion.value++;
    
    // Remove credentials from URL using router
    router.replace({ query: {} });
    
    $q.notify({
      type: 'positive',
      message: 'AWS Credentials loaded from URL',
      icon: 'check_circle'
    });
  }
});

const saveCredentials = () => {
  if (!credentials.value.accessKeyId || !credentials.value.secretAccessKey) {
    $q.notify({
      type: 'warning',
      message: 'Access Key ID and Secret Access Key are required',
      icon: 'warning'
    });
    return;
  }

  // Save to localStorage
  localStorage.setItem('aws_access_key_id', credentials.value.accessKeyId);
  localStorage.setItem('aws_secret_access_key', credentials.value.secretAccessKey);
  localStorage.setItem('aws_session_token', credentials.value.sessionToken || '');

  credentialsVersion.value++; // Trigger reactivity

  $q.notify({
    type: 'positive',
    message: 'AWS Credentials saved successfully',
    icon: 'check_circle'
  });

  showCredentialsDialog.value = false;
};

const clearCredentials = () => {
  credentials.value.accessKeyId = '';
  credentials.value.secretAccessKey = '';
  credentials.value.sessionToken = '';
  
  localStorage.removeItem('aws_access_key_id');
  localStorage.removeItem('aws_secret_access_key');
  localStorage.removeItem('aws_session_token');
  
  credentialsVersion.value++; // Trigger reactivity
  
  $q.notify({
    type: 'info',
    message: 'Credentials cleared',
    icon: 'delete'
  });
};
</script>

<style scoped lang="scss">
.glass-header {
  background: rgba(18, 18, 18, 0.8) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: fixed;
  top: 0;
  z-index: 2000;
}
</style>
