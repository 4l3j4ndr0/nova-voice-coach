import { ref } from 'vue';

export function useAudioRecorder() {
  const isRecording = ref(false);
  const audioStream = ref<MediaStream | null>(null);
  const audioContext = ref<AudioContext | null>(null);
  const processor = ref<ScriptProcessorNode | null>(null);
  const source = ref<MediaStreamAudioSourceNode | null>(null);

  const startRecording = async (onAudioData: (pcmBase64: string) => void) => {
    try {
      console.log('Requesting microphone access...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support microphone access. Please use Chrome, Firefox, or Safari on HTTPS.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      console.log('Microphone access granted');
      
      audioStream.value = stream;
      audioContext.value = new AudioContext({ sampleRate: 16000 });
      source.value = audioContext.value.createMediaStreamSource(stream);
      
      // Use ScriptProcessorNode to get raw PCM data
      processor.value = audioContext.value.createScriptProcessor(4096, 1, 1);
      
      processor.value.onaudioprocess = (e) => {
        if (isRecording.value) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32 to Int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          
          // Convert to base64
          const base64 = arrayBufferToBase64(pcmData.buffer);
          onAudioData(base64);
        }
      };

      source.value.connect(processor.value);
      processor.value.connect(audioContext.value.destination);
      
      isRecording.value = true;
      console.log('Recording started successfully');
      return true;
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Microphone is being used by another application.');
      } else {
        throw new Error(error.message || 'Failed to access microphone. Please check your browser settings.');
      }
    }
  };

  const stopRecording = () => {
    isRecording.value = false;
    
    if (processor.value) {
      processor.value.disconnect();
      processor.value = null;
    }
    
    if (source.value) {
      source.value.disconnect();
      source.value = null;
    }
    
    if (audioStream.value) {
      audioStream.value.getTracks().forEach(track => track.stop());
      audioStream.value = null;
    }
    
    if (audioContext.value) {
      audioContext.value.close();
      audioContext.value = null;
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
