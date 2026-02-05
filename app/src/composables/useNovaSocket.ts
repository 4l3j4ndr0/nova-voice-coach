import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';

const socket = ref<Socket | null>(null);
const isConnected = ref(false);
const sessionId = ref<string | null>(null);

export function useNovaSocket() {
  const getBackendUrl = () => {
    // Local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    
    // Production
    return 'https://api.nova.awslearn.cloud';
  };

  const connect = (url?: string) => {
    const backendUrl = url || getBackendUrl();
    console.log('Connecting to:', backendUrl);
    
    return new Promise((resolve, reject) => {
      socket.value = io(backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        withCredentials: false
      });

      socket.value.on('connect', () => {
        isConnected.value = true;
        console.log('Socket.IO connected');
        resolve(true);
      });

      socket.value.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        reject(error);
      });

      socket.value.on('disconnect', () => {
        isConnected.value = false;
        sessionId.value = null;
        console.log('Socket.IO disconnected');
      });
    });
  };

  const initSession = async (config: any) => {
    if (!socket.value || !isConnected.value) {
      throw new Error('Socket.IO not connected');
    }

    // Add AWS credentials from localStorage
    const accessKeyId = localStorage.getItem('aws_access_key_id');
    const secretAccessKey = localStorage.getItem('aws_secret_access_key');
    const sessionToken = localStorage.getItem('aws_session_token');

    const credentials: any = {
      accessKeyId,
      secretAccessKey
    };

    // Only add sessionToken if it exists, is not empty, and is not a placeholder
    if (sessionToken && sessionToken.trim() !== '' && sessionToken !== 'optional-token') {
      credentials.sessionToken = sessionToken;
    }

    const configWithCredentials = {
      ...config,
      awsCredentials: credentials
    };

    return new Promise((resolve, reject) => {
      socket.value?.once('sessionReady', (data: any) => {
        sessionId.value = data.sessionId;
        resolve(data.sessionId);
      });

      socket.value?.once('error', (error: any) => {
        reject(new Error(error.message));
      });

      socket.value?.emit('initSession', configWithCredentials);
    });
  };

  const sendAudio = (audioBase64: string) => {
    if (!socket.value || !isConnected.value || !sessionId.value) {
      console.warn('Cannot send audio: session not ready');
      return;
    }

    socket.value.emit('audioInput', audioBase64);
  };

  const endSession = () => {
    if (socket.value && isConnected.value) {
      socket.value.emit('endSession');
    }
  };

  const onAudioOutput = (callback: (audioData: any) => void) => {
    if (!socket.value) return;
    socket.value.on('audioOutput', callback);
    return () => socket.value?.off('audioOutput', callback);
  };

  const onTextOutput = (callback: (textData: any) => void) => {
    if (!socket.value) return;
    socket.value.on('textOutput', callback);
    return () => socket.value?.off('textOutput', callback);
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
      sessionId.value = null;
    }
  };

  return {
    socket,
    isConnected,
    sessionId,
    connect,
    initSession,
    sendAudio,
    endSession,
    onAudioOutput,
    onTextOutput,
    disconnect
  };
}
