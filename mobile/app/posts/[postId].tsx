import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Alert,
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
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';
import type { PostComment, SocialPost } from '@/types/post';
import { useUser } from '@/providers/UserProvider';

const lime = '#8EE817';

export default function PostCommentsScreen() {
  const { user } = useUser();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError('');
    try {
      const [postResponse, commentsResponse] = await Promise.all([
        api.get<{ post: SocialPost }>(`/posts/${postId}`),
        api.get<{ comments: PostComment[] }>(`/posts/${postId}/comments`),
      ]);
      setPost(postResponse.data.post);
      setComments(commentsResponse.data.comments);
    } catch (value) {
      setError(getApiError(value, 'Сэтгэгдлүүдийг ачаалж чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    const content = draft.trim();
    if (!content || !postId || sending) return;
    setSending(true);
    setError('');
    try {
      const { data } = await api.post<{ comment: PostComment }>(`/posts/${postId}/comments`, {
        content,
      });
      setComments((current) => [...current, data.comment]);
      setDraft('');
      setPost((current) =>
        current ? { ...current, commentCount: current.commentCount + 1 } : current,
      );
    } catch (value) {
      setError(getApiError(value, 'Сэтгэгдэл илгээж чадсангүй.'));
    } finally {
      setSending(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!postId) return;
    const remove = async () => {
      try {
        await api.delete(`/posts/${postId}/comments/${commentId}`);
        setComments((current) => current.filter((comment) => comment.id !== commentId));
        setPost((current) =>
          current ? { ...current, commentCount: Math.max(0, current.commentCount - 1) } : current,
        );
      } catch (value) {
        setError(getApiError(value, 'Сэтгэгдэл устгаж чадсангүй.'));
      }
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Сэтгэгдлээ устгах уу?')) await remove();
      return;
    }
    Alert.alert('Сэтгэгдэл устгах', 'Сэтгэгдлээ устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/posts'))}
            style={styles.backButton}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.heading}>Сэтгэгдэл</Text>
          {post && post.authorId === user?.id ? (
            <Pressable
              onPress={() => router.push(`/posts/${post.id}/edit`)}
              style={styles.editButton}
            >
              <Text style={styles.editText}>Засах</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={lime} size="large" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {!!post && (
              <View style={styles.post}>
                <View style={styles.postAuthor}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(post.author.displayName || post.author.email).slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.postAuthorName}>
                      {post.author.displayName || post.author.email.split('@')[0]}
                    </Text>
                    <Text style={styles.time}>{relativeTime(post.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.postText}>{post.content}</Text>
                {!!post.imageUrl && (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                )}
                <Text style={styles.commentTotal}>{comments.length} сэтгэгдэл</Text>
              </View>
            )}

            {comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {(comment.author.displayName || comment.author.email).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>
                    {comment.author.displayName || comment.author.email.split('@')[0]}
                  </Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentTime}>{relativeTime(comment.createdAt)}</Text>
                    {comment.author.id === user?.id && (
                      <Pressable onPress={() => void deleteComment(comment.id)} hitSlop={10}>
                        <Text style={styles.deleteComment}>Устгах</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {!comments.length && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Одоогоор сэтгэгдэл алга</Text>
                <Text style={styles.emptyCopy}>Хамгийн эхний сэтгэгдлийг бичээрэй.</Text>
              </View>
            )}
            {!!error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
        )}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void send()}
            placeholder="Сэтгэгдэл бичих..."
            placeholderTextColor="#71807A"
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable disabled={!draft.trim() || sending} onPress={() => void send()}>
            <Text style={[styles.send, (!draft.trim() || sending) && styles.sendDisabled]}>
              {sending ? '...' : 'Илгээх'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020D12' },
  keyboard: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: {
    height: 70,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#17272C',
  },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  back: { color: '#F1F5F3', fontSize: 43, lineHeight: 44 },
  heading: { color: '#F4F7F6', fontSize: 20, fontWeight: '900' },
  headerSpacer: { width: 44 },
  editButton: { width: 52, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  editText: { color: lime, fontSize: 13, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingBottom: 35 },
  post: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#17272C' },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#193329',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: lime, fontSize: 12, fontWeight: '900' },
  postAuthorName: { color: '#F0F4F2', fontSize: 14, fontWeight: '900' },
  time: { color: '#788680', fontSize: 11, marginTop: 3 },
  postText: { color: '#E8EDEA', fontSize: 15, lineHeight: 23, marginTop: 14 },
  postImage: { width: '100%', aspectRatio: 1.6, borderRadius: 12, marginTop: 13 },
  commentTotal: { color: '#8B9893', fontSize: 12, marginTop: 14 },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 17,
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#173027',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: lime, fontSize: 10, fontWeight: '900' },
  commentBubble: {
    flex: 1,
    marginLeft: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#08191A',
  },
  commentAuthor: { color: '#F0F4F2', fontSize: 13, fontWeight: '900' },
  commentText: { color: '#CBD4D0', fontSize: 14, lineHeight: 20, marginTop: 5 },
  commentTime: { color: '#71807A', fontSize: 10, marginTop: 7 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  deleteComment: { color: '#FF817B', fontSize: 10, fontWeight: '800', marginTop: 7 },
  empty: { alignItems: 'center', paddingTop: 55 },
  emptyTitle: { color: '#EAF0ED', fontSize: 16, fontWeight: '800' },
  emptyCopy: { color: '#77847F', fontSize: 12, marginTop: 7 },
  error: { color: '#FF817B', fontSize: 13, margin: 20 },
  composer: {
    minHeight: 68,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#17272C',
    backgroundColor: '#041216',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 15,
    borderRadius: 23,
    color: '#EDF2F0',
    backgroundColor: '#0A1B1C',
    fontSize: 14,
  },
  send: { color: lime, fontSize: 13, fontWeight: '900', marginLeft: 12 },
  sendDisabled: { color: '#45633C' },
});
