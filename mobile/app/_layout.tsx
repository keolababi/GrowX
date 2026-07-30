import { router, Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import '../global.css';
import { UserProvider, useUser } from '@/providers/UserProvider';
import { PresenceHeartbeat } from '@/components/PresenceHeartbeat';
import { AppBottomNav } from '@/components/AppBottomNav';

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

const routesWithOwnBottomNav = new Set([
  'home',
  'community',
  'mentor',
  'medlege',
  'messages',
  'profile',
  'podcast',
]);

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
  const first = segments[0];
  const isPublic = publicRoutes.includes(first);
  const indexRouteHasOwnNav = segments.length === 1 && routesWithOwnBottomNav.has(first ?? '');
  const showSharedBottomNav = Boolean(token && !loading && !isPublic && !indexRouteHasOwnNav);

  useEffect(() => {
    if (loading) return;
    if (!token && !isPublic) router.replace('/login');
    if (token && ['login', 'register', 'onboard'].includes(first ?? '')) router.replace('/home');
  }, [first, isPublic, loading, token]);

  return (
    <View style={styles.shell}>
      <View style={styles.stack}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#020B0D' },
          }}
        />
      </View>
      {showSharedBottomNav && <AppBottomNav />}
      {!!token && <PresenceHeartbeat />}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#020B0D' },
  stack: { flex: 1 },
});
