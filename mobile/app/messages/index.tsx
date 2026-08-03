import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NotificationBell } from '@/components/NotificationBell';
import { AppBottomNav } from '@/components/AppBottomNav';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { ChatUser, Conversation } from '@/types/chat';
import { getApiError } from '@/utils/auth';
import { relativeTimeCompact as relativeTime } from '@/utils/relativeTime';

const lime = '#8EE817';

function displayName(user: ChatUser | null) {
  return user?.displayName || user?.email.split('@')[0] || 'GrowX хэрэглэгч';
}

function isUserActive(user: ChatUser | null) {
  return Boolean(user?.lastSeenAt && Date.now() - new Date(user.lastSeenAt).getTime() < 60_000);
}

function Presence({ user }: { user: ChatUser | null }) {
  const active = isUserActive(user);
  return (
    <Text style={[styles.presenceText, active && styles.activeText]}>
      {active ? 'Идэвхтэй' : 'Офлайн'}
    </Text>
  );
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{newChatOpen ? 'Шинэ чат' : 'Мессеж'}</Text>
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
                  <Text style={[styles.presenceStatus, active && styles.presenceStatusActive]}>
                    {active ? 'Идэвхтэй' : 'Идэвхгүй'}
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
                      <Presence user={user} />
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
                      <Presence user={conversation.otherUser} />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[styles.preview, conversation.unreadCount > 0 && styles.unreadPreview]}
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
              <Text style={styles.emptyTitle}>
                {newChatOpen ? 'Хэрэглэгч олдсонгүй' : 'Одоогоор chat алга'}
              </Text>
              <Text style={styles.emptyCopy}>
                {newChatOpen ? 'Өөр нэр эсвэл и-мэйл хайгаарай.' : '＋ дарж шинэ chat эхлүүлээрэй.'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#031015' },
  header: {
    height: 66,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#F4F8F5', fontSize: 29, fontWeight: '900' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  newButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButtonText: { color: '#142000', fontSize: 26, lineHeight: 28, fontWeight: '800' },
  search: {
    height: 48,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A191A',
    borderWidth: 1,
    borderColor: '#19302B',
  },
  searchInput: { flex: 1, marginLeft: 9, color: '#F1F5F3', fontSize: 14 },
  presenceSection: {
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#142824',
  },
  presenceHeading: {
    color: '#DCE4E0',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  presenceList: { gap: 13, paddingHorizontal: 20 },
  presenceCard: { width: 70, alignItems: 'center' },
  presenceCardPressed: { opacity: 0.65 },
  presenceName: {
    width: 70,
    color: '#E6ECE9',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  presenceStatus: { color: '#75837D', fontSize: 9, fontWeight: '600', marginTop: 2 },
  presenceStatusActive: { color: lime },
  error: { color: '#FF7777', paddingHorizontal: 20, paddingVertical: 7 },
  loader: { marginTop: 60 },
  scroll: { flex: 1, minHeight: 0 },
  list: { paddingHorizontal: 14, paddingBottom: 116 },
  row: {
    minHeight: 78,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#142824',
  },
  rowPressed: { backgroundColor: '#0B1E1A' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 51,
    height: 51,
    borderRadius: 26,
    backgroundColor: '#173126',
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
    borderColor: '#031015',
    backgroundColor: lime,
  },
  rowCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  nameRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: 9 },
  name: { color: '#F2F5F4', fontSize: 15, fontWeight: '800', flexShrink: 1 },
  offlineDot: { backgroundColor: '#68756F' },
  presenceText: { color: '#75837D', fontSize: 10, fontWeight: '600' },
  activeText: { color: lime },
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
  empty: { alignItems: 'center', paddingTop: 85 },
  emptyTitle: { color: '#EDF3F0', fontSize: 17, fontWeight: '800' },
  emptyCopy: { color: '#7C8983', fontSize: 13, marginTop: 8 },
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
