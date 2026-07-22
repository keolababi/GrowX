import { router, Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';
import '../global.css';
import { UserProvider, useUser } from '@/providers/UserProvider';

export default function RootLayout() {
  return (
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  );
}

function AppNavigator() {
  const { token, loading } = useUser();
  const segments = useSegments();
  useEffect(() => {
    if (loading) return;
    const first = segments[0];
    const publicRoutes = [
      '',
      undefined,
      'login',
      'register',
      'forgot-password',
      'verify-code',
      'new-password',
      'password-success',
      'onboard',
    ];
    const isPublic = publicRoutes.includes(first);
    if (!token && !isPublic) router.replace('/login');
    if (token && ['login', 'register', 'onboard'].includes(first ?? '')) router.replace('/home');
  }, [loading, segments, token]);
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
