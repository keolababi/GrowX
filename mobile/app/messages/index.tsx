import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
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
import { api } from '@/services/api';
import type { ChatUser, Conversation } from '@/types/chat';
import { getApiError } from '@/utils/auth';

const lime = '#8EE817';

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'одоо';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}ц`;
  return `${Math.floor(seconds / 86400)}ө`;
}

function displayName(user: ChatUser | null) {
  return user?.displayName || user?.email.split('@')[0] || 'GrowX хэрэглэгч';
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
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

  useFocusEffect(
    useCallback(() => {
      void loadConversations();
      const timer = setInterval(() => void loadConversations(), 3_000);
      return () => clearInterval(timer);
    }, [loadConversations]),
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
            <Text style={styles.newButtonText}>{newChatOpen ? '×' : '＋'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.search}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          placeholder={newChatOpen ? 'Нэр эсвэл и-мэйлээр хайх' : 'Chat хайх'}
          placeholderTextColor="#718079"
          style={styles.searchInput}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={lime} style={styles.loader} />
      ) : (
        <ScrollView
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
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {displayName(user).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.name}>{displayName(user)}</Text>
                    <Text style={styles.preview}>{user.email}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))
            : filtered.map((conversation) => (
                <Pressable
                  key={conversation.id}
                  onPress={() => router.push(`/messages/${conversation.id}`)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {displayName(conversation.otherUser).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.name}>{displayName(conversation.otherUser)}</Text>
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

      <View style={styles.bottomNav}>
        <Pressable onPress={() => router.replace('/home')} style={styles.navItem}>
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={styles.navText}>Нүүр</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/medlege')} style={styles.navItem}>
          <Text style={styles.navIcon}>⌘</Text>
          <Text style={styles.navText}>Мэдлэг</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/posts/create')} style={styles.addButton}>
          <Text style={styles.addText}>＋</Text>
        </Pressable>
        <View style={styles.navItem}>
          <Text style={[styles.navIcon, styles.active]}>○</Text>
          <Text style={[styles.navText, styles.active]}>Мессеж</Text>
        </View>
        <Pressable onPress={() => router.replace('/profile')} style={styles.navItem}>
          <Text style={styles.navIcon}>♙</Text>
          <Text style={styles.navText}>Профайл</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#031015' },
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
  searchIcon: { color: '#A5B0AB', fontSize: 25, marginRight: 9 },
  searchInput: { flex: 1, color: '#F1F5F3', fontSize: 14 },
  error: { color: '#FF7777', paddingHorizontal: 20, paddingVertical: 7 },
  loader: { marginTop: 60 },
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
  avatar: {
    width: 51,
    height: 51,
    borderRadius: 26,
    backgroundColor: '#173126',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: lime, fontSize: 20, fontWeight: '900' },
  rowCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  name: { color: '#F2F5F4', fontSize: 15, fontWeight: '800' },
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
