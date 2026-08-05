import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { NotificationBell } from '@/components/NotificationBell';
import { AppBottomNav } from '@/components/AppBottomNav';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { ChatUser, Conversation } from '@/types/chat';
import { getApiError } from '@/utils/auth';
import { relativeTimeCompact as relativeTime } from '@/utils/relativeTime';

const lime = '#9AF000';
const webScreenStyle = {
  height: '100vh',
  minHeight: '100vh',
  maxHeight: '100vh',
} as unknown as ViewStyle;

function displayName(user: ChatUser | null) {
  return user?.displayName || user?.email.split('@')[0] || 'GrowX хэрэглэгч';
}

function isUserActive(user: ChatUser | null) {
  return Boolean(user?.lastSeenAt && Date.now() - new Date(user.lastSeenAt).getTime() < 60_000);
}

function UserAvatar({ user }: { user: ChatUser | null }) {
  const active = isUserActive(user);
  return (
    <View style={styles.avatarWrap}>
      {user?.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName(user).charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={[styles.avatarPresence, !active && styles.offlineDot]} />
    </View>
  );
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<ChatUser[]>([]);
  const [query, setQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get<{ conversations: Conversation[] }>('/conversations');
      setConversations(data.conversations);
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Chat жагсаалтыг авч чадсангүй.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadUsers = useCallback(async (search = '') => {
    const { data } = await api.get<{ users: ChatUser[] }>('/conversations/users', {
      params: { q: search },
    });
    setUsers(data.users);
  }, []);

  const loadPresenceUsers = useCallback(async () => {
    try {
      const { data } = await api.get<{ users: ChatUser[] }>('/conversations/users');
      setPresenceUsers(data.users);
    } catch {
      // Conversation list errors are displayed separately; presence is supplemental.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadConversations();
      void loadPresenceUsers();
      const timer = setInterval(() => {
        void loadConversations();
        void loadPresenceUsers();
      }, 5_000);
      return () => clearInterval(timer);
    }, [loadConversations, loadPresenceUsers]),
  );

  useEffect(() => {
    if (!newChatOpen) return;
    const timer = setTimeout(() => {
      void loadUsers(query).catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers, newChatOpen, query]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized || newChatOpen) return conversations;
    return conversations.filter((conversation) => {
      const user = conversation.otherUser;
      return (
        displayName(user).toLocaleLowerCase().includes(normalized) ||
        user?.email.toLocaleLowerCase().includes(normalized)
      );
    });
  }, [conversations, newChatOpen, query]);

  const startChat = async (recipientId: string) => {
    try {
      const { data } = await api.post<{ conversationId: string }>('/conversations', {
        recipientId,
      });
      setNewChatOpen(false);
      setQuery('');
      router.push(`/messages/${data.conversationId}`);
    } catch (value) {
      setError(getApiError(value, 'Chat эхлүүлж чадсангүй.'));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, Platform.OS === 'web' && webScreenStyle]}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.eyebrow}>GROWX CONNECT</Text>
            <Text style={styles.title}>{newChatOpen ? 'Шинэ чат' : 'Мессеж'}</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell />
            <Pressable
              accessibilityLabel={newChatOpen ? 'Буцах' : 'Шинэ чат'}
              onPress={() => {
                setNewChatOpen((open) => !open);
                setQuery('');
                setError('');
              }}
              style={styles.newButton}
            >
              <Icon name={newChatOpen ? 'close' : 'create-outline'} size={22} color="#142000" />
            </Pressable>
          </View>
        </View>

        <View style={styles.search}>
          <Icon name="search-outline" size={20} color="#A5B0AB" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            placeholder={newChatOpen ? 'Нэр эсвэл и-мэйлээр хайх' : 'Chat хайх'}
            placeholderTextColor="#718079"
            style={styles.searchInput}
          />
        </View>

        {!newChatOpen && presenceUsers.length > 0 && (
          <View style={styles.presenceSection}>
            <Text style={styles.presenceHeading}>Хүмүүс</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presenceList}
            >
              {presenceUsers.map((presenceUser) => {
                const active = isUserActive(presenceUser);
                return (
                  <Pressable
                    key={presenceUser.id}
                    accessibilityLabel={`${displayName(presenceUser)}, ${active ? 'Идэвхтэй' : 'Идэвхгүй'}`}
                    onPress={() => void startChat(presenceUser.id)}
                    style={({ pressed }) => [
                      styles.presenceCard,
                      pressed && styles.presenceCardPressed,
                    ]}
                  >
                    <UserAvatar user={presenceUser} />
                    <Text numberOfLines={1} style={styles.presenceName}>
                      {displayName(presenceUser)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <ActivityIndicator color={lime} style={styles.loader} />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor={lime}
                onRefresh={() => {
                  setRefreshing(true);
                  void loadConversations();
                }}
              />
            }
          >
            {newChatOpen
              ? users.map((user) => (
                  <Pressable
                    key={user.id}
                    onPress={() => void startChat(user.id)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <UserAvatar user={user} />
                    <View style={styles.rowCopy}>
                      <View style={styles.nameRow}>
                        <Text numberOfLines={1} style={styles.name}>
                          {displayName(user)}
                        </Text>
                      </View>
                      <Text style={styles.preview}>{user.email}</Text>
                    </View>
                    <Icon name="chevron-forward" size={21} color="#89968F" />
                  </Pressable>
                ))
              : filtered.map((conversation) => (
                  <Pressable
                    key={conversation.id}
                    onPress={() => router.push(`/messages/${conversation.id}`)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <UserAvatar user={conversation.otherUser} />
                    <View style={styles.rowCopy}>
                      <View style={styles.nameRow}>
                        <Text numberOfLines={1} style={styles.name}>
                          {displayName(conversation.otherUser)}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.preview,
                          conversation.unreadCount > 0 && styles.unreadPreview,
                        ]}
                      >
                        {conversation.lastMessage?.content || 'Шинэ chat'}
                      </Text>
                    </View>
                    <View style={styles.rowMeta}>
                      <Text style={styles.time}>{relativeTime(conversation.updatedAt)}</Text>
                      {conversation.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}

            {((newChatOpen && !users.length) || (!newChatOpen && !filtered.length)) && (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Icon
                    name={newChatOpen ? 'person-add-outline' : 'chatbubbles-outline'}
                    size={28}
                    color={lime}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {newChatOpen ? 'Хэрэглэгч олдсонгүй' : 'Одоогоор chat алга'}
                </Text>
                <Text style={styles.emptyCopy}>
                  {newChatOpen
                    ? 'Өөр нэр эсвэл и-мэйл хайгаарай.'
                    : '＋ дарж шинэ chat эхлүүлээрэй.'}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#020B0D' },
  page: { flex: 1, minHeight: 0, width: '100%', maxWidth: 780, alignSelf: 'center' },
  header: {
    minHeight: 82,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#152D26',
  },
  titleGroup: { flex: 1, minWidth: 0 },
  eyebrow: { color: lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: '#F7FAF8', fontSize: 27, fontWeight: '900', letterSpacing: -0.7, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  newButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: lime,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  newButtonText: { color: '#142000', fontSize: 26, lineHeight: 28, fontWeight: '800' },
  search: {
    height: 48,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 14,
    borderRadius: 24,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#081915',
    borderWidth: 1,
    borderColor: '#28453A',
  },
  searchInput: { flex: 1, marginLeft: 9, color: '#F1F5F3', fontSize: 14 },
  presenceSection: {
    paddingTop: 2,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#152D26',
  },
  presenceHeading: {
    color: '#DCE4E0',
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  presenceList: { gap: 10, paddingHorizontal: 20 },
  presenceCard: {
    width: 86,
    minHeight: 88,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  presenceCardPressed: { opacity: 0.65 },
  presenceName: {
    width: 76,
    color: '#E6ECE9',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  error: { color: '#FF7777', paddingHorizontal: 20, paddingVertical: 7 },
  loader: { marginTop: 60 },
  scroll: { flex: 1, minHeight: 0 },
  list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28, gap: 9 },
  row: {
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: 'transparent',
  },
  rowPressed: { backgroundColor: '#0D251D' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 51,
    height: 51,
    borderRadius: 26,
    backgroundColor: '#153126',
    borderWidth: 1,
    borderColor: '#345347',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: lime, fontSize: 20, fontWeight: '900' },
  avatarPresence: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#071713',
    backgroundColor: lime,
  },
  rowCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  nameRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: 9 },
  name: { color: '#F5F8F6', fontSize: 15, fontWeight: '900', flexShrink: 1 },
  offlineDot: { backgroundColor: '#68756F' },
  preview: { color: '#83908B', fontSize: 13, marginTop: 5 },
  unreadPreview: { color: '#DCE5E1', fontWeight: '700' },
  rowMeta: { alignItems: 'flex-end', gap: 7, marginLeft: 8 },
  time: { color: '#6F7D77', fontSize: 11 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#142000', fontSize: 10, fontWeight: '900' },
  chevron: { color: '#89968F', fontSize: 30 },
  empty: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 42,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#29483C',
    borderRadius: 22,
    backgroundColor: '#061511',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#112D22',
  },
  emptyTitle: { color: '#EDF3F0', fontSize: 17, fontWeight: '900', marginTop: 14 },
  emptyCopy: { color: '#7C8983', fontSize: 13, marginTop: 7 },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 94,
    paddingBottom: 9,
    backgroundColor: '#061712',
    borderTopWidth: 1,
    borderTopColor: '#132822',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { width: 69, alignItems: 'center', gap: 4 },
  navIcon: { color: '#D9DDDF', fontSize: 28, lineHeight: 31 },
  navText: { color: '#D0D3D5', fontSize: 12, fontWeight: '600' },
  active: { color: lime },
  addButton: {
    width: 61,
    height: 61,
    borderRadius: 31,
    marginTop: -28,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#173000', fontSize: 39, lineHeight: 42, fontWeight: '300' },
});
