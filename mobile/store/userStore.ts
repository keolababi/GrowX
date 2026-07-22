import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types/auth';

const USER_KEY = 'current_user';

type UserState = {
  user: User | null;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isHydrated: false,
  setUser: (user) => {
    set({ user });
    if (user) void AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    else void AsyncStorage.removeItem(USER_KEY);
  },
  hydrate: async () => {
    try {
      const value = await AsyncStorage.getItem(USER_KEY);
      set({ user: value ? (JSON.parse(value) as User) : null, isHydrated: true });
    } catch {
      await AsyncStorage.removeItem(USER_KEY);
      set({ user: null, isHydrated: true });
    }
  },
}));
