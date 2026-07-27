import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useSegments } from 'expo-router';
import { api } from '@/services/api';

export function NotificationBell() {
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
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.bell} accessibilityElementsHidden>
        <View style={styles.bellDome} />
        <View style={styles.bellRim} />
        <View style={styles.bellClapper} />
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
    backgroundColor: '#0D1D19',
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
    borderColor: '#F4F8F5',
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
    borderColor: '#F4F8F5',
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
    backgroundColor: '#F4F8F5',
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
