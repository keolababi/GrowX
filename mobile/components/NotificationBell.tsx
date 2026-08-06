import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useSegments } from 'expo-router';
import { api } from '@/services/api';
import { design } from '@/constants/design';
import { useColorMode } from '@/providers/ColorModeProvider';

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
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isDark ? colors.surfaceRaised : 'transparent' },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.bell} accessibilityElementsHidden>
        <View style={[styles.bellDome, { borderColor: colors.text }]} />
        <View style={[styles.bellRim, { borderColor: colors.text }]} />
        <View style={[styles.bellClapper, { backgroundColor: colors.text }]} />
      </View>
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: design.colors.surfaceRaised,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  bell: { width: 23, height: 25, alignItems: 'center' },
  bellDome: {
    position: 'absolute',
    top: 2,
    width: 17,
    height: 17,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: design.colors.text,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },
  bellRim: {
    position: 'absolute',
    top: 17,
    width: 22,
    height: 5,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: design.colors.text,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  bellClapper: {
    position: 'absolute',
    top: 22,
    width: 5,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: design.colors.text,
  },
  badge: {
    position: 'absolute',
    right: -3,
    top: -3,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#FF4D4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
});
