import { ref, watch } from 'vue';

const userName = ref<string>(localStorage.getItem('nova-user-name') || '');
const apiKey = ref<string>('');

// Interview configuration
const interviewConfig = ref({
  role: '',
  techStack: [] as string[],
  tone: '',
  language: ''
});

// Watch para guardar en localStorage
watch(userName, (newName) => {
  if (newName) {
    localStorage.setItem('nova-user-name', newName);
  } else {
    localStorage.removeItem('nova-user-name');
  }
});

export function useSession() {
  const setInterviewConfig = (config: any) => {
    interviewConfig.value = { ...config };
  };

  const getFullConfig = () => {
    return {
      userName: userName.value,
      ...interviewConfig.value
    };
  };

  return {
    userName,
    apiKey,
    interviewConfig,
    setInterviewConfig,
    getFullConfig
  };
}
