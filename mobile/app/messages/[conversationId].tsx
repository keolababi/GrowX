import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '@/services/api';
import type { ChatMessage, ChatUser } from '@/types/chat';
import { getApiError } from '@/utils/auth';
import { useUser } from '@/providers/UserProvider';

const lime = '#8EE817';

function displayName(user: ChatUser | null) {
  return user?.displayName || user?.email.split('@')[0] || 'GrowX хэрэглэгч';
}

function messageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useUser();
  const scrollRef = useRef<ScrollView>(null);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const isActive = Boolean(
    otherUser?.lastSeenAt && Date.now() - new Date(otherUser.lastSeenAt).getTime() < 60_000,
  );

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!conversationId) return;
      try {
        const { data } = await api.get<{ otherUser: ChatUser | null; messages: ChatMessage[] }>(
          `/conversations/${conversationId}/messages`,
        );
        setOtherUser(data.otherUser);
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
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {displayName(otherUser).charAt(0).toUpperCase()}
            </Text>
          </View>
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
        </View>

        {loading ? (
          <ActivityIndicator color={lime} style={styles.loader} />
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {!messages.length && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Шинэ яриа</Text>
                <Text style={styles.emptyCopy}>Эхний мессежээ илгээгээрэй.</Text>
              </View>
            )}
            {messages.map((message) => {
              const mine = message.senderId === user?.id;
              return (
                <View key={message.id} style={[styles.messageLine, mine && styles.mineLine]}>
                  <View style={[styles.bubble, mine ? styles.mineBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, mine && styles.mineText]}>
                      {message.content}
                    </Text>
                    <Text style={[styles.messageTime, mine && styles.mineTime]}>
                      {messageTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Мессеж бичих..."
            placeholderTextColor="#718079"
            multiline
            maxLength={4000}
            style={styles.input}
          />
          <Pressable
            disabled={!draft.trim() || sending}
            onPress={() => void send()}
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
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
  messageLine: { flexDirection: 'row', justifyContent: 'flex-start' },
  mineLine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  theirBubble: { backgroundColor: '#12241F', borderBottomLeftRadius: 5 },
  mineBubble: { backgroundColor: lime, borderBottomRightRadius: 5 },
  messageText: { color: '#EAF0ED', fontSize: 14, lineHeight: 20 },
  mineText: { color: '#142000' },
  messageTime: { color: '#77877F', fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  mineTime: { color: '#446016' },
  error: { color: '#FF7777', fontSize: 12, paddingHorizontal: 17, paddingVertical: 5 },
  composer: {
    minHeight: 70,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: '#173029',
    backgroundColor: '#061411',
  },
  input: {
    flex: 1,
    minHeight: 47,
    maxHeight: 120,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 11,
    borderRadius: 23,
    color: '#F0F5F2',
    fontSize: 14,
    backgroundColor: '#10211D',
  },
  sendButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lime,
  },
  sendDisabled: { opacity: 0.35 },
  sendIcon: { color: '#142000', fontSize: 25, fontWeight: '900', lineHeight: 27 },
});
