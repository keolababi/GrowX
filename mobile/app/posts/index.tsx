import { useCallback, useEffect, useState } from 'react';
import { router, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
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
} from 'react-native';
import { NotificationBell } from '@/components/NotificationBell';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import { useUser } from '@/providers/UserProvider';
import type { PostComment, SocialPost } from '@/types/post';

const lime = '#8EE817';

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds} сек`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} цаг`;
  return `${Math.floor(hours / 24)} өдөр`;
}

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase();
}

function CommentRow({ comment }: { comment: PostComment }) {
  return (
    <View style={styles.commentRow}>
      <Pressable
        onPress={() => router.push(`/users/${comment.author.id}` as Href)}
        style={styles.commentProfile}
      >
        {comment.author.avatarUrl ? (
          <Image source={{ uri: comment.author.avatarUrl }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentAvatarFallback}>
            <Text style={styles.commentAvatarText}>
              {initials(comment.author.displayName, comment.author.email)}
            </Text>
          </View>
        )}
      </Pressable>
      <View style={styles.commentBubble}>
        <Pressable onPress={() => router.push(`/users/${comment.author.id}` as Href)}>
          <Text style={styles.commentAuthor}>
            {comment.author.displayName || comment.author.email.split('@')[0]}
          </Text>
        </Pressable>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  );
}

export default function PostsScreen() {
  const { user } = useUser();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [busyIds, setBusyIds] = useState<string[]>([]);

  const loadPosts = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const { data } = await api.get<{ posts: SocialPost[] }>('/posts');
      setPosts(data.posts);
    } catch (value) {
      setError(getApiError(value, 'Post-уудыг ачаалж чадсангүй.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const toggleLike = async (post: SocialPost) => {
    if (busyIds.includes(post.id)) return;
    setBusyIds((ids) => [...ids, post.id]);
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likeCount: Math.max(0, item.likeCount + (item.likedByMe ? -1 : 1)),
            }
          : item,
      ),
    );
    try {
      const { data } = await api.post<{ liked: boolean; likeCount: number }>(
        `/posts/${post.id}/like`,
      );
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, likedByMe: data.liked, likeCount: data.likeCount }
            : item,
        ),
      );
    } catch {
      setPosts((current) => current.map((item) => (item.id === post.id ? post : item)));
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== post.id));
    }
  };

  const addComment = async (postId: string) => {
    const content = commentDrafts[postId]?.trim();
    if (!content || busyIds.includes(postId)) return;
    setBusyIds((ids) => [...ids, postId]);
    try {
      const { data } = await api.post<{ comment: PostComment }>(`/posts/${postId}/comments`, {
        content,
      });
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [...post.comments, data.comment],
                commentCount: post.commentCount + 1,
              }
            : post,
        ),
      );
      setCommentDrafts((drafts) => ({ ...drafts, [postId]: '' }));
    } catch (value) {
      setError(getApiError(value, 'Сэтгэгдэл илгээж чадсангүй.'));
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== postId));
    }
  };

  const deletePost = async (postId: string) => {
    const remove = async () => {
      try {
        await api.delete(`/posts/${postId}`);
        setPosts((current) => current.filter((post) => post.id !== postId));
      } catch (value) {
        setError(getApiError(value, 'Post устгаж чадсангүй.'));
      }
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Энэ post-ийг устгах уу?')) await remove();
      return;
    }
    Alert.alert('Post устгах', 'Энэ post-ийг устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Post</Text>
        <View style={styles.headerActions}>
          <NotificationBell />
          <Pressable onPress={() => router.push('/reels')} style={styles.reelsButton}>
            <Text style={styles.reelsButtonText}>Reels</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/posts/create')} style={styles.createButton}>
            <Text style={styles.createButtonText}>＋</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={lime} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadPosts(true)}
              tintColor={lime}
            />
          }
        >
          {!!error && <Text style={styles.error}>{error}</Text>}
          {posts.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Одоогоор post алга</Text>
              <Text style={styles.emptyCopy}>
                Анхны post-оо оруулаад бусадтай санаагаа хуваалцаарай.
              </Text>
              <Pressable onPress={() => router.push('/posts/create')} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Post оруулах</Text>
              </Pressable>
            </View>
          )}
          {posts.map((post) => (
            <View key={post.id} style={styles.card}>
              <View style={styles.authorRow}>
                <Pressable
                  onPress={() => router.push(`/users/${post.author.id}` as Href)}
                  style={styles.profileLink}
                >
                  {post.author.avatarUrl ? (
                    <Image source={{ uri: post.author.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>
                        {initials(post.author.displayName, post.author.email)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.authorCopy}>
                    <Text style={styles.authorName}>
                      {post.author.displayName || post.author.email.split('@')[0]}
                    </Text>
                    <Text style={styles.postMeta}>
                      {relativeTime(post.createdAt)}
                      {post.community ? ` · ${post.community.name}` : ''}
                    </Text>
                  </View>
                </Pressable>
                {post.authorId === user?.id && (
                  <Pressable
                    accessibilityLabel="Post устгах"
                    hitSlop={10}
                    onPress={() => void deletePost(post.id)}
                  >
                    <Text style={styles.delete}>•••</Text>
                  </Pressable>
                )}
              </View>

              <Text style={styles.content}>{post.content}</Text>
              {!!post.imageUrl && (
                <Image
                  source={{ uri: post.imageUrl }}
                  resizeMode="cover"
                  style={styles.postImage}
                />
              )}

              <View style={styles.actions}>
                <Pressable onPress={() => void toggleLike(post)} style={styles.action}>
                  <Text style={[styles.actionIcon, post.likedByMe && styles.liked]}>
                    {post.likedByMe ? '♥' : '♡'}
                  </Text>
                  <Text style={[styles.actionText, post.likedByMe && styles.liked]}>
                    {post.likeCount}
                  </Text>
                </Pressable>
                <View style={styles.action}>
                  <Text style={styles.actionIcon}>○</Text>
                  <Text style={styles.actionText}>{post.commentCount}</Text>
                </View>
                <Pressable style={[styles.action, styles.shareAction]}>
                  <Text style={styles.share}>↗</Text>
                </Pressable>
              </View>

              {post.comments.map((comment) => (
                <CommentRow key={comment.id} comment={comment} />
              ))}

              <View style={styles.commentComposer}>
                <TextInput
                  value={commentDrafts[post.id] ?? ''}
                  onChangeText={(value) =>
                    setCommentDrafts((drafts) => ({ ...drafts, [post.id]: value }))
                  }
                  onSubmitEditing={() => void addComment(post.id)}
                  placeholder="Сэтгэгдэл бичих..."
                  placeholderTextColor="#71807A"
                  returnKeyType="send"
                  style={styles.commentInput}
                />
                <Pressable onPress={() => void addComment(post.id)} hitSlop={8}>
                  <Text style={styles.send}>Илгээх</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020D12' },
  header: {
    height: 76,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#13242A',
  },
  headerButton: { width: 42, height: 42, justifyContent: 'center' },
  back: { color: '#F4F7F6', fontSize: 44, lineHeight: 44, fontWeight: '300' },
  title: { color: '#F5F7F6', fontSize: 28, fontWeight: '900' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reelsButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#315345',
    justifyContent: 'center',
  },
  reelsButtonText: { color: lime, fontSize: 12, fontWeight: '800' },
  createButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: { color: '#122000', fontSize: 29, lineHeight: 31 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  feed: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingBottom: 40 },
  error: { color: '#FF817B', paddingHorizontal: 22, paddingVertical: 12 },
  empty: { alignItems: 'center', paddingHorizontal: 35, paddingTop: 90 },
  emptyTitle: { color: '#F5F7F6', fontSize: 23, fontWeight: '800' },
  emptyCopy: { color: '#8D9A95', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  emptyButton: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: lime,
    justifyContent: 'center',
  },
  emptyButtonText: { color: '#132000', fontSize: 15, fontWeight: '800' },
  card: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#15272C',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  profileLink: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#13251D' },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#183127',
    borderWidth: 1,
    borderColor: '#2B4D3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: lime, fontSize: 14, fontWeight: '900' },
  authorCopy: { flex: 1, marginLeft: 12 },
  authorName: { color: '#F2F5F4', fontSize: 16, fontWeight: '800' },
  postMeta: { color: '#86938F', fontSize: 12, marginTop: 3 },
  delete: { color: '#93A09B', fontSize: 18, letterSpacing: 2 },
  content: { color: '#E9EEEC', fontSize: 16, lineHeight: 24, marginTop: 16 },
  postImage: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: 17,
    marginTop: 15,
    backgroundColor: '#0A171D',
  },
  actions: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#122329',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { color: '#DDE4E1', fontSize: 26, lineHeight: 28 },
  actionText: { color: '#AAB4B0', fontSize: 13, fontWeight: '700' },
  liked: { color: lime },
  shareAction: { marginLeft: 'auto' },
  share: { color: '#DDE4E1', fontSize: 24 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingTop: 10 },
  commentProfile: { marginTop: 1 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#13251D' },
  commentAvatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#183127',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: lime, fontSize: 9, fontWeight: '900' },
  commentBubble: { flex: 1, minWidth: 0 },
  commentAuthor: { color: '#F1F4F3', fontSize: 13, fontWeight: '800' },
  commentText: { color: '#BBC4C0', fontSize: 13, lineHeight: 18, flexShrink: 1 },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 43,
    marginTop: 9,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: '#08191A',
  },
  commentInput: { flex: 1, color: '#F2F5F4', fontSize: 13, paddingVertical: 10 },
  send: { color: lime, fontSize: 13, fontWeight: '800', marginLeft: 10 },
});
