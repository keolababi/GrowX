import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { api } from '@/services/api';
import type { AuthResponse } from '@/types/auth';
import { useUser } from '@/providers/UserProvider';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  // The provider validates its config while rendering. Keep the hook stable when
  // OAuth is not configured yet, then block the prompt below with a clear error.
  const safeClientId = clientId ?? 'google-oauth-not-configured.apps.googleusercontent.com';
  const [, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: safeClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? safeClientId,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? safeClientId,
  });
  const { saveSession } = useUser();

  return async () => {
    if (!clientId) throw new Error('Google OAuth Client ID тохируулаагүй байна.');
    const result = await promptAsync();
    if (result.type !== 'success' || !result.params.id_token) {
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      throw new Error('Google нэвтрэлт амжилтгүй боллоо.');
    }
    const { data } = await api.post<AuthResponse>('/auth/google', {
      idToken: result.params.id_token,
    });
    await saveSession(data.token, data.user);
    router.replace('/home');
  };
}
