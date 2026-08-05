import { router, Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import '../global.css';
import { UserProvider, useUser } from '@/providers/UserProvider';
import { PresenceHeartbeat } from '@/components/PresenceHeartbeat';
import { AppBottomNav } from '@/components/AppBottomNav';
import { ColorModeProvider } from '@/providers/ColorModeProvider';
import { useColorMode } from '@/providers/ColorModeProvider';

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
  'community',
  'discover',
  'mentor',
  'medlege',
  'messages',
  'profile',
  'podcast',
]);

export default function RootLayout() {
  return (
    <ColorModeProvider>
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </ColorModeProvider>
  );
}

function AppNavigator() {
  const { isDark } = useColorMode();
  const { token, loading } = useUser();
  const segments = useSegments();
  const first = segments[0];
  const isPublic = publicRoutes.includes(first);
  const indexRouteHasOwnNav = segments.length === 1 && routesWithOwnBottomNav.has(first ?? '');
  const showSharedBottomNav = Boolean(token && !loading && !isPublic && !indexRouteHasOwnNav);

  useEffect(() => {
    if (loading) return;
    if (!token && !isPublic) router.replace('/login');
    if (token && ['login', 'register', 'onboard'].includes(first ?? '')) router.replace('/posts');
  }, [first, isPublic, loading, token]);

  return (
    <View style={[styles.shell, { backgroundColor: isDark ? '#020B0D' : '#F7F9F8' }]}>
      <View style={styles.stack}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: isDark ? '#020B0D' : '#F7F9F8' },
          }}
        >
          <Stack.Screen name="feedback/index" />
          <Stack.Screen name="feedback/create" />
          <Stack.Screen name="feedback/[formId]" />
          <Stack.Screen name="feedback/[formId]/responses" />
        </Stack>
      </View>
      {showSharedBottomNav && <AppBottomNav />}
      {!!token && <PresenceHeartbeat />}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: 0, overflow: 'hidden' },
  stack: { flex: 1, minHeight: 0, overflow: 'hidden' },
});
