import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/services/api';
import type { AppNotification } from '@/types/notification';
import { getApiError } from '@/utils/auth';

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'саяхан';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} цаг`;
  return `${Math.floor(seconds / 86400)} өдөр`;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications');
      setNotifications(data.notifications);
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Notification-уудыг авч чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openNotification = async (notification: AppNotification) => {
    if (!notification.readAt) {
      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      await api.patch(`/notifications/${notification.id}/read`).catch(() => undefined);
    }
    if (notification.postId) router.push('/posts');
  };

  const markAllRead = async () => {
    const readAt = new Date().toISOString();
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
    await api.patch('/notifications/read-all').catch(() => void load());
  };

  const hasUnread = notifications.some((notification) => !notification.readAt);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Мэдэгдэл</Text>
        <Pressable disabled={!hasUnread} onPress={() => void markAllRead()}>
          <Text style={[styles.readAll, !hasUnread && styles.readAllDisabled]}>Бүгдийг унших</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#8ee817" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!notifications.length && !error && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>♧</Text>
              <Text style={styles.emptyTitle}>Одоогоор мэдэгдэл алга</Text>
              <Text style={styles.emptyCopy}>Like, comment ирэхэд энд харагдана.</Text>
            </View>
          )}
          {notifications.map((notification) => {
            const actorName =
              notification.actor?.displayName || notification.actor?.email.split('@')[0] || 'GrowX';
            return (
              <Pressable
                key={notification.id}
                onPress={() => void openNotification(notification)}
                style={[styles.item, !notification.readAt && styles.unreadItem]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{actorName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.itemCopy}>
                  <Text style={styles.message}>{notification.message}</Text>
                  <Text style={styles.time}>{relativeTime(notification.createdAt)}</Text>
                </View>
                {!notification.readAt && <View style={styles.unreadDot} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#031015' },
  header: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#F4F8F5', fontSize: 38, lineHeight: 40 },
  title: { color: '#F4F8F5', fontSize: 22, fontWeight: '900' },
  readAll: { color: '#8ee817', fontSize: 12, fontWeight: '800' },
  readAllDisabled: { opacity: 0.35 },
  loader: { marginTop: 60 },
  content: { padding: 16, paddingBottom: 40, gap: 8 },
  error: { color: '#ff7777', padding: 14 },
  empty: { alignItems: 'center', paddingTop: 90 },
  emptyIcon: { color: '#8ee817', fontSize: 42 },
  emptyTitle: { color: '#F4F8F5', fontSize: 18, fontWeight: '800', marginTop: 16 },
  emptyCopy: { color: '#8F9B97', fontSize: 13, marginTop: 8 },
  item: {
    minHeight: 78,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09171A',
    borderWidth: 1,
    borderColor: '#14272A',
  },
  unreadItem: { backgroundColor: '#10251D', borderColor: '#285137' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#20382C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#8ee817', fontSize: 18, fontWeight: '900' },
  itemCopy: { flex: 1, marginHorizontal: 12 },
  message: { color: '#EDF3F0', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  time: { color: '#84918C', fontSize: 12, marginTop: 4 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#8ee817' },
});
