import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { api } from '@/services/api';

export function PresenceHeartbeat() {
  const heartbeat = useCallback(async () => {
    await api.post('/auth/heartbeat').catch(() => undefined);
  }, []);

  useEffect(() => {
    void heartbeat();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void heartbeat();
    }, 25_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void heartbeat();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [heartbeat]);

  return null;
}
