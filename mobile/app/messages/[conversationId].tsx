import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { api } from '@/services/api';
import type { ChatMessage, ChatUser } from '@/types/chat';
import { getApiError } from '@/utils/auth';
import { useUser } from '@/providers/UserProvider';

const lime = '#8EE817';
const MESSAGE_ACTION_WINDOW_MS = 10 * 60 * 1000;

function displayName(user: ChatUser | null) {
  return user?.displayName || user?.email.split('@')[0] || 'GrowX хэрэглэгч';
}

function messageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function canModifyMessage(message: ChatMessage) {
  return Date.now() - new Date(message.createdAt).getTime() <= MESSAGE_ACTION_WINDOW_MS;
}

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useUser();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [unsendingId, setUnsendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const isActive = Boolean(
    otherUser?.lastSeenAt && Date.now() - new Date(otherUser.lastSeenAt).getTime() < 60_000,
  );
  const lastSeenMessageId = useMemo(() => {
    if (!otherLastReadAt || !user?.id) return null;
    const readAt = new Date(otherLastReadAt).getTime();
    return (
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.senderId === user.id && new Date(message.createdAt).getTime() <= readAt,
        )?.id ?? null
    );
  }, [messages, otherLastReadAt, user?.id]);

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!conversationId) return;
      try {
        const { data } = await api.get<{
          otherUser: ChatUser | null;
          otherLastReadAt: string | null;
          messages: ChatMessage[];
        }>(`/conversations/${conversationId}/messages`);
        setOtherUser(data.otherUser);
        setOtherLastReadAt(data.otherLastReadAt);
        setMessages(data.messages);
        setError('');
        void api.patch(`/conversations/${conversationId}/read`).catch(() => undefined);
      } catch (value) {
        if (!silent) setError(getApiError(value, 'Мессежүүдийг авч чадсангүй.'));
      } finally {
        setLoading(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    void loadMessages();
    const timer = setInterval(() => void loadMessages(true), 3_000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    if (!messages.length) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages.length]);

  useEffect(() => {
    if (!editingMessage) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [editingMessage]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending || !conversationId) return;
    setDraft('');
    setSending(true);
    try {
      const { data } = await api.post<{ message: ChatMessage }>(
        `/conversations/${conversationId}/messages`,
        { content },
      );
      setMessages((items) => [...items, data.message]);
      setError('');
    } catch (value) {
      setDraft(content);
      setError(getApiError(value, 'Мессеж илгээж чадсангүй.'));
    } finally {
      setSending(false);
    }
  };

  const unsend = async (messageId: string) => {
    if (!conversationId || unsendingId) return;
    setUnsendingId(messageId);
    setSelectedMessage(null);
    setMessages((items) => items.filter((message) => message.id !== messageId));
    setError('');
    try {
      await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
    } catch (value) {
      setError(getApiError(value, 'Мессежийг буцааж чадсангүй.'));
      await loadMessages(true);
    } finally {
      setUnsendingId(null);
    }
  };

  const confirmUnsend = (messageId: string) => {
    const message = 'Энэ мессежийг хүн бүрийн чатаас устгах уу?';
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) void unsend(messageId);
      return;
    }
    Alert.alert('Илгээснийг буцаах', message, [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Илгээснийг буцаах',
        style: 'destructive',
        onPress: () => void unsend(messageId),
      },
    ]);
  };

  const beginEdit = (message: ChatMessage) => {
    if (!canModifyMessage(message)) return;
    setSelectedMessage(null);
    setEditingMessage(message);
    setEditDraft(message.content);
  };

  const openMessageMenu = (
    message: ChatMessage,
    event: { nativeEvent: { pageX: number; pageY: number } },
  ) => {
    const menuWidth = 154;
    const menuHeight = 130;
    setMenuAnchor({
      x: Math.max(12, Math.min(event.nativeEvent.pageX - menuWidth, windowWidth - menuWidth - 12)),
      y: Math.max(
        12,
        Math.min(event.nativeEvent.pageY - menuHeight, windowHeight - menuHeight - 12),
      ),
    });
    setSelectedMessage(message);
  };

  const saveEdit = async () => {
    const content = editDraft.trim();
    if (!conversationId || !editingMessage || !content || savingEdit) return;
    setSavingEdit(true);
    setError('');
    try {
      const { data } = await api.patch<{ message: ChatMessage }>(
        `/conversations/${conversationId}/messages/${editingMessage.id}`,
        { content },
      );
      setMessages((items) =>
        items.map((message) => (message.id === data.message.id ? data.message : message)),
      );
      setEditingMessage(null);
      setEditDraft('');
    } catch (value) {
      setError(getApiError(value, 'Мессежийг засаж чадсангүй.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelEdit = () => {
    if (savingEdit) return;
    setEditingMessage(null);
    setEditDraft('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Pressable
            disabled={!otherUser}
            onPress={() => otherUser && router.push(`/users/${otherUser.id}` as Href)}
            style={styles.profileLink}
          >
            {otherUser?.avatarUrl ? (
              <Image source={{ uri: otherUser.avatarUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {displayName(otherUser).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.name}>
                {displayName(otherUser)}
              </Text>
              <View style={styles.presenceRow}>
                <View style={[styles.presenceDot, !isActive && styles.offlineDot]} />
                <Text style={[styles.status, isActive && styles.activeStatus]}>
                  {isActive ? 'Идэвхтэй' : 'Офлайн'}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={lime} style={styles.loader} />
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            onScrollBeginDrag={() => setSelectedMessage(null)}
          >
            {!messages.length && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Шинэ яриа</Text>
                <Text style={styles.emptyCopy}>Эхний мессежээ илгээгээрэй.</Text>
              </View>
            )}
            {messages.map((message) => {
              const mine = message.senderId === user?.id;
              const actionAvailable = mine && canModifyMessage(message);
              const selected = selectedMessage?.id === message.id;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageLine,
                    mine && styles.mineLine,
                    selected && styles.selectedMessageLine,
                  ]}
                >
                  <View style={[styles.messageCluster, mine && styles.mineMessageCluster]}>
                    {actionAvailable && (
                      <View style={styles.moreWrap}>
                        <Pressable
                          accessibilityLabel="Message options"
                          disabled={Boolean(unsendingId)}
                          onPress={(event) =>
                            selected ? setSelectedMessage(null) : openMessageMenu(message, event)
                          }
                          style={({ pressed }) => [
                            styles.moreButton,
                            selected && styles.moreButtonActive,
                            pressed && styles.moreButtonPressed,
                          ]}
                        >
                          <Text
                            style={[styles.moreButtonText, selected && styles.moreButtonTextActive]}
                          >
                            •••
                          </Text>
                        </Pressable>
                      </View>
                    )}
                    <Pressable
                      disabled={!actionAvailable || Boolean(unsendingId)}
                      delayLongPress={350}
                      onLongPress={(event) => actionAvailable && openMessageMenu(message, event)}
                      style={[styles.bubble, mine ? styles.mineBubble : styles.theirBubble]}
                    >
                      <Text style={[styles.messageText, mine && styles.mineText]}>
                        {message.content}
                      </Text>
                      <Text style={[styles.messageTime, mine && styles.mineTime]}>
                        {message.editedAt ? 'зассан · ' : ''}
                        {messageTime(message.createdAt)}
                      </Text>
                    </Pressable>
                  </View>
                  {mine && message.id === lastSeenMessageId && (
                    <Text style={styles.seenText}>Seen</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.composerShell}>
          {editingMessage && (
            <View style={styles.editingHeader}>
              <View style={styles.editingCopy}>
                <Text style={styles.editingLabel}>Editing message</Text>
                <Text numberOfLines={1} style={styles.editingPreview}>
                  {editingMessage.content}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Cancel editing"
                disabled={savingEdit}
                onPress={cancelEdit}
                style={styles.cancelEditingButton}
              >
                <Text style={styles.cancelEditingText}>×</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.composer}>
            <TextInput
              ref={inputRef}
              value={editingMessage ? editDraft : draft}
              onChangeText={editingMessage ? setEditDraft : setDraft}
              placeholder="Мессеж бичих..."
              placeholderTextColor="#718079"
              multiline
              maxLength={4000}
              scrollEnabled
              style={[
                styles.input,
                Platform.OS === 'web' &&
                  ({
                    outlineStyle: 'none',
                    outlineWidth: 0,
                    resize: 'none',
                  } as never),
              ]}
            />
            <Pressable
              disabled={editingMessage ? !editDraft.trim() || savingEdit : !draft.trim() || sending}
              onPress={() => void (editingMessage ? saveEdit() : send())}
              style={[
                styles.sendButton,
                (editingMessage ? !editDraft.trim() || savingEdit : !draft.trim() || sending) &&
                  styles.sendDisabled,
              ]}
            >
              {savingEdit ? (
                <ActivityIndicator color="#142000" size="small" />
              ) : (
                <Text style={styles.sendIcon}>↑</Text>
              )}
            </Pressable>
          </View>
        </View>

        <Modal
          animationType="fade"
          onRequestClose={() => setSelectedMessage(null)}
          transparent
          visible={Boolean(selectedMessage)}
        >
          <View style={styles.menuModalRoot}>
            <Pressable
              accessibilityLabel="Close message options"
              onPress={() => setSelectedMessage(null)}
              style={styles.menuBackdrop}
            />
            {selectedMessage && (
              <View style={[styles.messagePopover, { left: menuAnchor.x, top: menuAnchor.y }]}>
                <Text style={styles.popoverTime}>{messageTime(selectedMessage.createdAt)}</Text>
                <View style={styles.popoverDivider} />
                <Pressable
                  onPress={() => beginEdit(selectedMessage)}
                  style={({ pressed }) => [
                    styles.popoverItem,
                    pressed && styles.popoverItemPressed,
                  ]}
                >
                  <Text style={styles.popoverIcon}>✎</Text>
                  <Text style={styles.popoverItemText}>Edit</Text>
                </Pressable>
                <Pressable
                  disabled={Boolean(unsendingId)}
                  onPress={() => confirmUnsend(selectedMessage.id)}
                  style={({ pressed }) => [
                    styles.popoverItem,
                    pressed && styles.popoverItemPressed,
                  ]}
                >
                  <Text style={styles.popoverDeleteIcon}>⌫</Text>
                  <Text style={styles.popoverDeleteText}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#031015' },
  keyboard: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  back: { color: '#F2F6F4', fontSize: 38, lineHeight: 40 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#173126',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: lime, fontSize: 17, fontWeight: '900' },
  headerCopy: { flex: 1, marginLeft: 11 },
  profileLink: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  name: { color: '#F2F6F4', fontSize: 16, fontWeight: '800' },
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  presenceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: lime },
  offlineDot: { backgroundColor: '#68756F' },
  status: { color: '#73827B', fontSize: 11 },
  activeStatus: { color: lime },
  loader: { flex: 1 },
  messages: { flexGrow: 1, padding: 14, justifyContent: 'flex-end', gap: 7 },
  empty: { alignItems: 'center', marginBottom: 60 },
  emptyTitle: { color: '#EAF0ED', fontSize: 17, fontWeight: '800' },
  emptyCopy: { color: '#77857F', fontSize: 13, marginTop: 7 },
  messageLine: { alignItems: 'flex-start' },
  mineLine: { alignItems: 'flex-end' },
  selectedMessageLine: { zIndex: 30 },
  messageCluster: { maxWidth: '84%', flexDirection: 'row', alignItems: 'center', gap: 3 },
  mineMessageCluster: { flexDirection: 'row' },
  moreWrap: {
    width: 30,
    height: 30,
  },
  moreButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonActive: { opacity: 0.72 },
  moreButtonPressed: { opacity: 0.72 },
  moreButtonText: {
    color: '#8D9B95',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  moreButtonTextActive: { color: lime },
  menuModalRoot: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  messagePopover: {
    position: 'absolute',
    width: 154,
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#315447',
    backgroundColor: '#0A1B17',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
    zIndex: 50,
  },
  popoverTime: {
    color: '#819089',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  popoverDivider: { height: 1, backgroundColor: '#20372F' },
  popoverItem: {
    height: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  popoverItemPressed: { backgroundColor: '#132A23' },
  popoverIcon: { width: 20, color: lime, fontSize: 16, textAlign: 'center' },
  popoverItemText: { color: '#EEF4F1', fontSize: 13, fontWeight: '700' },
  popoverDeleteIcon: { width: 20, color: '#E64C55', fontSize: 17, textAlign: 'center' },
  popoverDeleteText: { color: '#E64C55', fontSize: 13, fontWeight: '700' },
  bubble: { flexShrink: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  theirBubble: { backgroundColor: '#12241F', borderBottomLeftRadius: 5 },
  mineBubble: { backgroundColor: lime, borderBottomRightRadius: 5 },
  messageText: { color: '#EAF0ED', fontSize: 14, lineHeight: 20 },
  mineText: { color: '#142000' },
  messageTime: { color: '#77877F', fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  mineTime: { color: '#446016' },
  seenText: {
    color: '#79A84A',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    marginRight: 4,
  },
  error: { color: '#FF7777', fontSize: 12, paddingHorizontal: 17, paddingVertical: 5 },
  composerShell: {
    borderTopWidth: 1,
    borderTopColor: '#173029',
    backgroundColor: '#061411',
  },
  editingHeader: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  editingCopy: { flex: 1, minWidth: 0 },
  editingLabel: { color: lime, fontSize: 12, fontWeight: '900' },
  editingPreview: { color: '#7D8B85', fontSize: 10, marginTop: 3 },
  cancelEditingButton: {
    width: 34,
    height: 34,
    marginLeft: 12,
    borderRadius: 17,
    backgroundColor: '#10251F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditingText: { color: '#E8EEEB', fontSize: 26, lineHeight: 28, fontWeight: '400' },
  composer: {
    height: 66,
    minHeight: 66,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  input: {
    flex: 1,
    height: 46,
    minHeight: 46,
    maxHeight: 46,
    paddingHorizontal: 15,
    paddingTop: 11,
    paddingBottom: 10,
    borderRadius: 23,
    color: '#F0F5F2',
    fontSize: 14,
    backgroundColor: '#10211D',
    borderWidth: 1,
    borderColor: '#25443A',
    overflow: 'hidden',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lime,
  },
  sendDisabled: { opacity: 0.35 },
  sendIcon: { color: '#142000', fontSize: 25, fontWeight: '900', lineHeight: 27 },
});
