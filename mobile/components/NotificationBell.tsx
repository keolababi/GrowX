import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useSegments } from 'expo-router';
import { api } from '@/services/api';
import { design } from '@/constants/design';
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from './ui/Icon';

export function NotificationBell() {
  const { colors, isDark } = useColorMode();
  const segments = useSegments();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ unreadCount: number }>('/notifications/unread-count');
      setUnreadCount(data.unreadCount);
    } catch {
      // Authentication errors are handled by the root navigator.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh, segments]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Мэдэгдэл${unreadCount ? `, ${unreadCount} уншаагүй` : ''}`}
      onPress={() => router.push('/notifications')}
      style={[styles.button, { backgroundColor: isDark ? colors.surfaceRaised : 'transparent' }]}
    >
      <Icon
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={21}
        color={colors.text}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: design.colors.surfaceRaised,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  badge: {
    position: 'absolute',
    right: -3,
    top: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#FF4D4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
});
