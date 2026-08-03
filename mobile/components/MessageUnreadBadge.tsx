import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSegments } from 'expo-router';
import { api } from '@/services/api';

export function MessageUnreadBadge() {
  const segments = useSegments();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ unreadCount: number }>('/conversations/unread-count');
      setUnreadCount(data.unreadCount);
    } catch {
      // The root navigator handles authentication failures.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 5_000);
    return () => clearInterval(timer);
  }, [refresh, segments]);

  if (!unreadCount) return null;

  return (
    <View pointerEvents="none" style={styles.badge}>
      <Text style={styles.text}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#FF3B3B',
    borderWidth: 1.5,
    borderColor: '#061712',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#FFFFFF', fontSize: 9, lineHeight: 11, fontWeight: '900' },
});
