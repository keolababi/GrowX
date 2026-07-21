import { useEffect } from 'react';
import { Stack } from 'expo-router';
import '../global.css';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#020B0D' },
      }}
    />
  );
}
