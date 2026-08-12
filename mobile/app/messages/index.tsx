import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
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
import { Loader } from '@/components/ui/Loader';
import { api } from '@/services/api';
import type { ChatUser, Conversation } from '@/types/chat';
import { getApiError } from '@/utils/auth';
import { relativeTimeCompact as relativeTime } from '@/utils/relativeTime';
import { useColorMode } from '@/providers/ColorModeProvider';
import { useTabPressStore } from '@/store/tabPressStore';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { GrowXMark } from '@/components/GrowXLogo';

const lime = '#9AF000';
const swipeForwardBackground = '#10251E';
const swipeDeleteBackground = '#2A1116';
const swipeDeleteForeground = '#FF6B73';
const SWIPE_ACTIONS_WIDTH = 148;
const GROWX_WELCOME_EMAIL = 'welcome@growx.mn';
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

function isGrowXWelcomeUser(user: ChatUser | null) {
  return user?.email === GROWX_WELCOME_EMAIL;
}

function fullDate(value: string) {
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function messagePreview(message: Conversation['lastMessage']) {
  if (!message) return 'Шинэ chat';
  if (message.content) return message.content;
  if (message.mediaType === 'VIDEO') return '🎬 Видео';
  if (message.mediaType === 'AUDIO') return '🎤 Дуут мессеж';
  return '🖼️ Зураг';
}

function SwipeableRow({
  id,
  openId,
  onOpenChange,
  actions,
  children,
}: {
  id: string;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  const isOpen = openId === id;
  const translateX = useRef(new Animated.Value(0)).current;
  const dragPosition = useRef(0);
  const [showActions, setShowActions] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShowActions(true);
    dragPosition.current = isOpen ? -SWIPE_ACTIONS_WIDTH : 0;
    Animated.timing(translateX, {
      toValue: isOpen ? -SWIPE_ACTIONS_WIDTH : 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isOpen) setShowActions(false);
    });
  }, [isOpen, translateX]);

  const settleSwipe = useCallback(
    (shouldOpen: boolean) => {
      dragPosition.current = shouldOpen ? -SWIPE_ACTIONS_WIDTH : 0;
      Animated.timing(translateX, {
        toValue: shouldOpen ? -SWIPE_ACTIONS_WIDTH : 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !shouldOpen) setShowActions(false);
      });
      onOpenChange(shouldOpen ? id : null);
    },
    [id, onOpenChange, translateX],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onMoveShouldSetPanResponderCapture: (_evt, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderGrant: () => {
          dragPosition.current = isOpen ? -SWIPE_ACTIONS_WIDTH : 0;
          setShowActions(true);
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_evt, gesture) => {
          const base = isOpen ? -SWIPE_ACTIONS_WIDTH : 0;
          const next = Math.min(0, Math.max(-SWIPE_ACTIONS_WIDTH, base + gesture.dx));
          dragPosition.current = next;
          translateX.setValue(next);
        },
        onPanResponderRelease: () => {
          const shouldOpen = isOpen ? dragPosition.current < -28 : dragPosition.current < -10;
          settleSwipe(shouldOpen);
        },
        onPanResponderTerminate: () => {
          const shouldOpen = isOpen ? dragPosition.current < -28 : dragPosition.current < -10;
          settleSwipe(shouldOpen);
        },
      }),
    [isOpen, settleSwipe, translateX],
  );

  return (
    <View style={styles.swipeWrap}>
      {showActions && (
        <View
          style={[styles.swipeActions, isOpen && styles.swipeActionsOpen]}
          pointerEvents="box-none"
        >
          {actions}
        </View>
      )}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.swipeForeground, { transform: [{ translateX }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function UserAvatar({ user }: { user: ChatUser | null }) {
  const { colors } = useColorMode();
  const active = isUserActive(user);
  const isGrowX = isGrowXWelcomeUser(user);
  return (
    <View style={styles.avatarWrap}>
      {isGrowX ? (
        <View
          style={[
            styles.avatar,
            styles.growxAvatar,
            { backgroundColor: colors.surfaceSoft, borderColor: colors.primary },
          ]}
        >
          <GrowXMark size={44} />
        </View>
      ) : user?.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSoft }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {displayName(user).charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {!isGrowX && (
        <View
          style={[
            styles.avatarPresence,
            { borderColor: colors.surface },
            active ? { backgroundColor: colors.primary } : styles.offlineDot,
          ]}
        />
      )}
    </View>
  );
}

export default function MessagesScreen() {
  const { iconAccent, colors } = useColorMode();
  const { confirm } = useAppDialog();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<ChatUser[]>([]);
  const [query, setQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [forwardTarget, setForwardTarget] = useState<Conversation | null>(null);
  const [forwardQuery, setForwardQuery] = useState('');
  const [forwardUsers, setForwardUsers] = useState<ChatUser[]>([]);
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [forwardError, setForwardError] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get<{ conversations: Conversation[] }>('/conversations');
      setConversations((current) =>
        JSON.stringify(current) === JSON.stringify(data.conversations)
          ? current
          : data.conversations,
      );
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
      setPresenceUsers((current) =>
        JSON.stringify(current) === JSON.stringify(data.users) ? current : data.users,
      );
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

  const conversationsScrollRef = useRef<ScrollView>(null);
  const tabPress = useTabPressStore((state) => (state.section === 'messages' ? state.ts : 0));
  const isFirstTabPressRef = useRef(true);
  useEffect(() => {
    if (isFirstTabPressRef.current) {
      isFirstTabPressRef.current = false;
      return;
    }
    conversationsScrollRef.current?.scrollTo({ y: 0, animated: true });
    void loadConversations();
  }, [tabPress, loadConversations]);

  useEffect(() => {
    if (!newChatOpen) return;
    const timer = setTimeout(() => {
      void loadUsers(query).catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers, newChatOpen, query]);

  useEffect(() => {
    if (!forwardTarget) return;
    const timer = setTimeout(() => {
      api
        .get<{ users: ChatUser[] }>('/conversations/users', { params: { q: forwardQuery } })
        .then(({ data }) => setForwardUsers(data.users))
        .catch(() => setForwardUsers([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [forwardTarget, forwardQuery]);

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

  const deleteConversation = async (conversation: Conversation) => {
    const proceed = async () => {
      setOpenRowId(null);
      const previous = conversations;
      setConversations((current) => current.filter((item) => item.id !== conversation.id));
      try {
        await api.delete(`/conversations/${conversation.id}`);
      } catch (value) {
        setConversations(previous);
        setError(getApiError(value, 'Chat устгаж чадсангүй.'));
      }
    };
    const message = `${displayName(conversation.otherUser)}-тэй хийсэн chat-ыг устгах уу?`;
    const accepted = await confirm({
      title: 'Chat устгах',
      message,
      confirmLabel: 'Устгах',
      variant: 'danger',
    });
    if (accepted) await proceed();
  };

  const openForward = (conversation: Conversation) => {
    setOpenRowId(null);
    setForwardError('');
    setForwardQuery('');
    setForwardUsers([]);
    setForwardTarget(conversation);
  };

  const closeForward = () => {
    setForwardTarget(null);
    setForwardQuery('');
    setForwardUsers([]);
    setForwardError('');
  };

  const sendForward = async (recipientId: string) => {
    const message = forwardTarget?.lastMessage;
    if (!message || (!message.content && !message.mediaUrl) || forwardingId) return;
    setForwardingId(recipientId);
    setForwardError('');
    try {
      const { data } = await api.post<{ conversationId: string }>('/conversations', {
        recipientId,
      });
      await api.post(`/conversations/${data.conversationId}/messages`, {
        content: message.content,
        mediaType: message.mediaType ?? undefined,
        mediaUrl: message.mediaUrl ?? undefined,
      });
      closeForward();
      router.push(`/messages/${data.conversationId}`);
    } catch (value) {
      setForwardError(getApiError(value, 'Мессежийг дамжуулж чадсангүй.'));
    } finally {
      setForwardingId(null);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
        Platform.OS === 'web' && webScreenStyle,
      ]}
    >
      <View style={styles.page}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.titleGroup}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>GROWX CONNECT</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {newChatOpen ? 'Шинэ чат' : 'Мессеж'}
            </Text>
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
              style={[styles.newButton, { backgroundColor: colors.primary }]}
            >
              <Icon name={newChatOpen ? 'close' : 'create-outline'} size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <View
          style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Icon name="search-outline" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            placeholder={newChatOpen ? 'Нэр эсвэл и-мэйлээр хайх' : 'Chat хайх'}
            placeholderTextColor={colors.muted}
            cursorColor={colors.primary}
            selectionColor={colors.primary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {!newChatOpen && presenceUsers.length > 0 && (
          <View style={[styles.presenceSection, { borderBottomColor: colors.border }]}>
            <Text style={[styles.presenceHeading, { color: colors.text }]}>Хүмүүс</Text>
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
                    style={styles.presenceCard}
                  >
                    <UserAvatar user={presenceUser} />
                    <Text numberOfLines={1} style={[styles.presenceName, { color: colors.text }]}>
                      {displayName(presenceUser)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
        {loading ? (
          <Loader size={32} style={styles.loader} />
        ) : (
          <ScrollView
            ref={conversationsScrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.list}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor={iconAccent}
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
                    style={styles.row}
                  >
                    <UserAvatar user={user} />
                    <View style={styles.rowCopy}>
                      <View style={styles.nameRow}>
                        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
                          {displayName(user)}
                        </Text>
                      </View>
                      <Text style={[styles.preview, { color: colors.muted }]}>{user.email}</Text>
                    </View>
                    <Icon name="chevron-forward" size={21} color={colors.muted} />
                  </Pressable>
                ))
              : filtered.map((conversation) => {
                  const isOpen = openRowId === conversation.id;
                  return (
                    <SwipeableRow
                      key={conversation.id}
                      id={conversation.id}
                      openId={openRowId}
                      onOpenChange={setOpenRowId}
                      actions={
                        <>
                          <Pressable
                            accessibilityLabel="Дамжуулах"
                            disabled={
                              !conversation.lastMessage?.content &&
                              !conversation.lastMessage?.mediaUrl
                            }
                            onPress={() => openForward(conversation)}
                            style={[
                              styles.swipeAction,
                              styles.forwardAction,
                              !conversation.lastMessage?.content &&
                                !conversation.lastMessage?.mediaUrl &&
                                styles.swipeActionDisabled,
                            ]}
                          >
                            <Icon name="arrow-redo-outline" size={20} color={lime} />
                            <Text style={[styles.swipeActionText, styles.forwardActionText]}>
                              Дамжуулах
                            </Text>
                          </Pressable>
                          <Pressable
                            accessibilityLabel="Устгах"
                            onPress={() => deleteConversation(conversation)}
                            style={[styles.swipeAction, styles.deleteAction]}
                          >
                            <Icon name="trash-outline" size={20} color={swipeDeleteForeground} />
                            <Text style={[styles.swipeActionText, styles.deleteActionText]}>
                              Устгах
                            </Text>
                          </Pressable>
                        </>
                      }
                    >
                      <Pressable
                        onPress={() => {
                          if (openRowId) {
                            setOpenRowId(null);
                            return;
                          }
                          router.push(`/messages/${conversation.id}`);
                        }}
                        style={[styles.row, { backgroundColor: colors.background }]}
                      >
                        <UserAvatar user={conversation.otherUser} />
                        <View style={styles.rowCopy}>
                          <View style={styles.nameRow}>
                            <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
                              {displayName(conversation.otherUser)}
                            </Text>
                          </View>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.preview,
                              { color: colors.muted },
                              conversation.unreadCount > 0 && { color: colors.textSecondary },
                            ]}
                          >
                            {messagePreview(conversation.lastMessage)}
                          </Text>
                        </View>
                        <View style={styles.rowMeta}>
                          <Text
                            style={[
                              styles.time,
                              { color: colors.muted },
                              isOpen && styles.timeOpen,
                            ]}
                          >
                            {isOpen
                              ? fullDate(conversation.updatedAt)
                              : relativeTime(conversation.updatedAt)}
                          </Text>
                          {conversation.unreadCount > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.unreadText, { color: colors.ink }]}>
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    </SwipeableRow>
                  );
                })}

            {((newChatOpen && !users.length) || (!newChatOpen && !filtered.length)) && (
              <View
                style={[
                  styles.empty,
                  { backgroundColor: colors.surface, borderColor: colors.borderStrong },
                ]}
              >
                <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSoft }]}>
                  <Icon
                    name={newChatOpen ? 'person-add-outline' : 'chatbubbles-outline'}
                    size={28}
                    color={iconAccent}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {newChatOpen ? 'Хэрэглэгч олдсонгүй' : 'Одоогоор chat алга'}
                </Text>
                <Text style={[styles.emptyCopy, { color: colors.muted }]}>
                  {newChatOpen
                    ? 'Өөр нэр эсвэл и-мэйл хайгаарай.'
                    : 'Дээрх шинэ чат товчийг дарж эхлүүлээрэй.'}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={Boolean(forwardTarget)}
        transparent
        animationType="fade"
        onRequestClose={closeForward}
      >
        <View style={styles.forwardBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeForward} />
          <View style={[styles.forwardSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.forwardHeader}>
              <Text style={[styles.forwardTitle, { color: colors.text }]}>Дамжуулах</Text>
              <Pressable accessibilityLabel="Хаах" onPress={closeForward} hitSlop={8}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            {!!forwardTarget?.lastMessage && (
              <Text numberOfLines={2} style={[styles.forwardPreview, { color: colors.muted }]}>
                “{messagePreview(forwardTarget.lastMessage)}”
              </Text>
            )}
            <View
              style={[
                styles.search,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  marginHorizontal: 0,
                },
              ]}
            >
              <Icon name="search-outline" size={20} color={colors.muted} />
              <TextInput
                value={forwardQuery}
                onChangeText={setForwardQuery}
                autoCapitalize="none"
                placeholder="Нэр эсвэл и-мэйлээр хайх"
                placeholderTextColor={colors.muted}
                cursorColor={colors.primary}
                selectionColor={colors.primary}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
            {!!forwardError && (
              <Text style={[styles.error, { color: colors.danger }]}>{forwardError}</Text>
            )}
            <ScrollView style={styles.forwardList} keyboardShouldPersistTaps="handled">
              {forwardUsers.map((user) => (
                <Pressable
                  key={user.id}
                  disabled={Boolean(forwardingId)}
                  onPress={() => void sendForward(user.id)}
                  style={styles.row}
                >
                  <UserAvatar user={user} />
                  <View style={styles.rowCopy}>
                    <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
                      {displayName(user)}
                    </Text>
                    <Text style={[styles.preview, { color: colors.muted }]}>{user.email}</Text>
                  </View>
                  {forwardingId === user.id ? (
                    <Loader size={18} />
                  ) : (
                    <Icon name="arrow-redo-outline" size={20} color={colors.muted} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#020B0D' },
  page: { flex: 1, minHeight: 0, width: '100%', maxWidth: 780, alignSelf: 'center' },
  header: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#152D26',
  },
  titleGroup: { flex: 1, minWidth: 0 },
  eyebrow: { color: lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: '#F7FAF8', fontSize: 23, fontWeight: '900', letterSpacing: -0.5, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  newButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
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
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  presenceList: { gap: 8, paddingHorizontal: 16 },
  presenceCard: {
    width: 78,
    minHeight: 80,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  presenceCardPressed: { opacity: 0.65 },
  presenceName: {
    width: 70,
    color: '#E6ECE9',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  error: { color: '#FF7777', paddingHorizontal: 16, paddingVertical: 7 },
  loader: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  list: {
    width: '100%',
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 24,
    gap: 6,
  },
  row: {
    width: '100%',
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: 'transparent',
  },
  rowPressed: { backgroundColor: '#0D251D' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#153126',
    borderWidth: 1,
    borderColor: '#345347',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: lime, fontSize: 18, fontWeight: '900' },
  growxAvatar: { overflow: 'hidden' },
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
  rowCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: 9 },
  name: { color: '#F5F8F6', fontSize: 15, fontWeight: '900', flexShrink: 1 },
  offlineDot: { backgroundColor: '#68756F' },
  preview: { color: '#83908B', fontSize: 13, marginTop: 5 },
  unreadPreview: { color: '#DCE5E1', fontWeight: '700' },
  rowMeta: { flexShrink: 0, alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  time: { color: '#6F7D77', fontSize: 11 },
  timeOpen: { fontSize: 10, fontWeight: '700' },
  swipeWrap: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 19,
    overflow: 'hidden',
  },
  swipeForeground: { position: 'relative', zIndex: 1, width: '100%', alignSelf: 'stretch' },
  swipeActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderRadius: 19,
    overflow: 'hidden',
  },
  swipeActionsOpen: { zIndex: 2 },
  swipeAction: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  forwardAction: { backgroundColor: swipeForwardBackground },
  forwardActionText: { color: lime },
  deleteAction: { backgroundColor: swipeDeleteBackground },
  deleteActionText: { color: swipeDeleteForeground },
  swipeActionDisabled: { opacity: 0.45 },
  swipeActionPressed: { opacity: 0.82 },
  swipeActionText: { fontSize: 10, fontWeight: '800' },
  forwardBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  forwardSheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  forwardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  forwardTitle: { fontSize: 18, fontWeight: '900' },
  forwardPreview: { fontSize: 12, marginBottom: 14 },
  forwardList: { marginTop: 10 },
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
