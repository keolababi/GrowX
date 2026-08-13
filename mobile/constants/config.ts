import Constants from 'expo-constants';
import { Platform } from 'react-native';

const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
const localApiHost = Platform.OS === 'web' || !metroHost ? 'localhost' : metroHost;

function resolveApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:4000/api`;
    }
  }

  return process.env.EXPO_PUBLIC_API_URL ?? `http://${localApiHost}:4000/api`;
}

export const API_URL = resolveApiUrl();
