import { create } from 'zustand';
import { tokenStorage } from '@/services/token';
import type { User } from '@/types/auth';

type AuthState = {
  token: string | null;
  isHydrating: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isHydrating: true,
  signIn: async (token) => {
    await tokenStorage.set(token);
    set({ token });
  },
  signOut: async () => {
    await tokenStorage.remove();
    set({ token: null });
  },
  hydrate: async () => {
    const token = await tokenStorage.get();
    set({ token, isHydrating: false });
  },
}));

export type { User };
