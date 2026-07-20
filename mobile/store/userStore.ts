import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from '@/types/auth';

type UserState = { user: User | null; setUser: (user: User | null) => void };

export const useUserStore = create<UserState>()(
  persist((set) => ({ user: null, setUser: (user) => set({ user }) }), {
    name: 'user-store',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);
