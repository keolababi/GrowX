import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import type { User } from '@/types/auth';

type UserContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  saveSession: (token: string, user: User) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const hydrateToken = useAuthStore((state) => state.hydrate);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const user = useUserStore((state) => state.user);
  const hydrateUser = useUserStore((state) => state.hydrate);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    void Promise.all([hydrateToken(), hydrateUser()]);
  }, [hydrateToken, hydrateUser]);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, [setUser, signOut]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch {
      await logout();
    }
  }, [logout, setUser, token]);

  useEffect(() => {
    if (!isHydrating && token) void refreshUser();
  }, [isHydrating, refreshUser, token]);

  const saveSession = useCallback(
    async (nextToken: string, nextUser: User) => {
      await signIn(nextToken);
      setUser(nextUser);
    },
    [setUser, signIn],
  );

  return (
    <UserContext.Provider
      value={{ user, token, loading: isHydrating, saveSession, refreshUser, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used inside UserProvider.');
  return context;
}
