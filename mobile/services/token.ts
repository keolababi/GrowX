import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'access_token';

export const tokenStorage = {
  get: () =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.getItem(TOKEN_KEY) ?? null)
      : SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  remove: () => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
