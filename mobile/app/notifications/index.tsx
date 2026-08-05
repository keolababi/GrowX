import { useCallback, useState } from 'react';
import { useFocusEffect, router, type Href } from 'expo-router';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '@/services/api';
import type { AppNotification } from '@/types/notification';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';
import { AppPageHeader } from '@/components/AppPageHeader';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, LoadingState } from '@/components/ui/ContentState';
import { design } from '@/constants/design';

function notificationIcon(
  type: AppNotification['type'],
): React.ComponentProps<typeof Icon>['name'] {
  if (type === 'LIKE') return 'heart';
  if (type === 'COMMENT') return 'chatbubble-ellipses';
  if (type === 'FOLLOW') return 'person-add';
  if (type === 'COLLABORATION_REQUEST') return 'people';
  return 'information-circle';
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
    if (notification.postId) router.push(`/posts/${notification.postId}`);
    else if (notification.type === 'FOLLOW' && notification.actor) {
      router.push(`/users/${notification.actor.id}` as Href);
    } else if (notification.type === 'COLLABORATION_REQUEST') {
      router.push('/mentor');
    }
  };

  const markAllRead = async () => {
    const readAt = new Date().toISOString();
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
    await api.patch('/notifications/read-all').catch(() => void load());
  };

  const hasUnread = notifications.some((notification) => !notification.readAt);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppPageHeader
        title="Мэдэгдэл"
        back
        actions={
          <Pressable
            disabled={!hasUnread}
            onPress={() => void markAllRead()}
            style={({ pressed }) => [
              styles.readAllButton,
              !hasUnread && styles.readAllDisabled,
              pressed && hasUnread && styles.readAllPressed,
            ]}
          >
            <Icon
              name="checkmark-done"
              size={16}
              color={hasUnread ? design.colors.ink : design.colors.muted}
            />
            <Text style={[styles.readAll, !hasUnread && styles.readAllDisabled]}>
              Уншсан болгох
            </Text>
          </Pressable>
        }
      />

      <View style={styles.filterShell}>
        <View style={styles.filterInner}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryEyebrow}>ТАНЫ МЭДЭГДЭЛ</Text>
              <Text style={styles.summaryTitle}>
                {unreadCount > 0 ? `${unreadCount} шинэ мэдэгдэл` : 'Бүх мэдэгдлээ уншсан'}
              </Text>
            </View>
            <View style={[styles.summaryIcon, unreadCount > 0 && styles.summaryIconActive]}>
              <Icon
                name={unreadCount > 0 ? 'notifications' : 'checkmark-circle'}
                size={22}
                color={design.colors.primary}
              />
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Мэдэгдлүүдийг уншиж байна..." />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!notifications.length && !error && (
            <EmptyState
              icon="notifications-outline"
              title="Одоогоор мэдэгдэл алга"
              description="Like, comment, дагагч болон хамтрах хүсэлт ирэхэд энд харагдана."
            />
          )}
          {notifications.map((notification) => {
            const actorName =
              notification.actor?.displayName || notification.actor?.email.split('@')[0] || 'GrowX';
            return (
              <Pressable
                key={notification.id}
                onPress={() => void openNotification(notification)}
                style={({ pressed }) => [
                  styles.item,
                  !notification.readAt && styles.unreadItem,
                  pressed && styles.itemPressed,
                ]}
              >
                {notification.actor?.avatarUrl ? (
                  <Image source={{ uri: notification.actor.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    {notification.actor ? (
                      <Text style={styles.avatarText}>{actorName.charAt(0).toUpperCase()}</Text>
                    ) : (
                      <Icon name={notificationIcon(notification.type)} size={21} color="#9AF000" />
                    )}
                  </View>
                )}
                <View style={styles.itemCopy}>
                  <View style={styles.metaRow}>
                    <Text style={styles.typeLabel}>
                      {notification.type === 'LIKE'
                        ? 'LIKE'
                        : notification.type === 'COMMENT'
                          ? 'COMMENT'
                          : notification.type === 'FOLLOW'
                            ? 'ШИНЭ ДАГАГЧ'
                            : notification.type === 'COLLABORATION_REQUEST'
                              ? 'ХАМТРАХ ХҮСЭЛТ'
                              : 'СИСТЕМ'}
                    </Text>
                    <Text style={styles.time}>{relativeTime(notification.createdAt)}</Text>
                  </View>
                  <Text style={styles.message}>{notification.message}</Text>
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
  safeArea: { flex: 1, backgroundColor: design.colors.background },
  readAllButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: design.colors.primary,
  },
  readAll: { color: design.colors.ink, fontSize: 11, fontWeight: '900' },
  readAllDisabled: { opacity: 0.45 },
  readAllPressed: { backgroundColor: design.colors.primaryPressed },
  filterShell: { borderBottomWidth: 1, borderBottomColor: design.colors.border },
  filterInner: {
    width: '100%',
    maxWidth: design.layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: design.layout.pagePadding,
    paddingTop: 16,
    paddingBottom: 12,
  },
  summaryRow: {
    minHeight: 64,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: design.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryEyebrow: {
    color: design.colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  summaryTitle: { color: design.colors.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: design.colors.surfaceRaised,
  },
  summaryIconActive: { backgroundColor: design.colors.surfaceSoft },
  scroll: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: design.layout.maxWidth,
    alignSelf: 'center',
    padding: design.layout.pagePadding,
    paddingBottom: 40,
    gap: 8,
  },
  error: { color: '#ff7777', padding: 14 },
  item: {
    minHeight: 70,
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: design.colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadItem: {
    backgroundColor: design.colors.surfaceSoft,
    borderColor: design.colors.borderStrong,
  },
  itemPressed: { opacity: 0.76, transform: [{ scale: 0.995 }] },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: design.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: design.colors.primary, fontSize: 17, fontWeight: '900' },
  itemCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  typeLabel: {
    flexShrink: 1,
    color: design.colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  message: { color: design.colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  time: { flexShrink: 0, color: design.colors.muted, fontSize: 10 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: design.colors.primary },
});
