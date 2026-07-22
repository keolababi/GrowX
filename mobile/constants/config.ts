import Constants from 'expo-constants';
import { Platform } from 'react-native';

const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
const localApiHost = Platform.OS === 'web' || !metroHost ? 'localhost' : metroHost;

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${localApiHost}:4000/api`;
