import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
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
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';

const lime = '#9AF000';

export default function PostCommentsScreen() {
  const { colors } = useColorMode();
  const { user } = useUser();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
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
    setActiveCommentMenuId(null);
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

  const deletePost = async () => {
    if (!postId) return;
    setPostMenuOpen(false);
    const remove = async () => {
      setError('');
      try {
        await api.delete(`/posts/${postId}`);
        router.replace('/posts');
      } catch (value) {
        setError(getApiError(value, 'Post-ийг устгаж чадсангүй.'));
      }
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm('Post-оо устгах уу?')) await remove();
      return;
    }
    Alert.alert('Post устгах', 'Post-оо устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  const startEditingComment = (comment: PostComment) => {
    setActiveCommentMenuId(null);
    setEditingCommentId(comment.id);
    setEditDraft(comment.content);
    setError('');
  };

  const cancelEditingComment = () => {
    if (savingEdit) return;
    setEditingCommentId(null);
    setEditDraft('');
  };

  const saveCommentEdit = async () => {
    const content = editDraft.trim();
    if (!postId || !editingCommentId || !content || savingEdit) return;
    setSavingEdit(true);
    setError('');
    try {
      const { data } = await api.patch<{ comment: PostComment }>(
        `/posts/${postId}/comments/${editingCommentId}`,
        { content },
      );
      setComments((current) =>
        current.map((comment) => (comment.id === editingCommentId ? data.comment : comment)),
      );
      setEditingCommentId(null);
      setEditDraft('');
    } catch (value) {
      setError(getApiError(value, 'Сэтгэгдлийг засаж чадсангүй.'));
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/posts'))}
            style={styles.backButton}
          >
            <Icon name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.heading, { color: colors.text }]}>Сэтгэгдэл</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <Loader size={44} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {!!post && (
              <View
                style={[
                  styles.post,
                  postMenuOpen && styles.postActive,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.postAuthor}>
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceSoft }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {(post.author.displayName || post.author.email).slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.postAuthorCopy}>
                    <Text style={[styles.postAuthorName, { color: colors.text }]}>
                      {post.author.displayName || post.author.email.split('@')[0]}
                    </Text>
                    <Text style={[styles.time, { color: colors.muted }]}>
                      {relativeTime(post.createdAt)}
                    </Text>
                  </View>
                  {post.authorId === user?.id && (
                    <>
                      <Pressable
                        accessibilityLabel="Post-ын үйлдлүүд"
                        hitSlop={10}
                        onPress={() => {
                          setActiveCommentMenuId(null);
                          setPostMenuOpen((open) => !open);
                        }}
                        style={styles.postMenuButton}
                      >
                        <Icon name="ellipsis-horizontal" size={21} color={colors.textSecondary} />
                      </Pressable>
                      {postMenuOpen && (
                        <View
                          style={[
                            styles.postActionMenu,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                          ]}
                        >
                          <Pressable
                            onPress={() => {
                              setPostMenuOpen(false);
                              router.push(`/posts/${post.id}/edit`);
                            }}
                            style={[
                              styles.postActionButton,
                              styles.postActionDivider,
                              { borderBottomColor: colors.border },
                            ]}
                          >
                            <Icon name="create-outline" size={18} color={colors.text} />
                            <Text style={[styles.postActionLabel, { color: colors.text }]}>
                              Засах
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => void deletePost()}
                            style={styles.postActionButton}
                          >
                            <Icon name="trash-outline" size={18} color={colors.danger} />
                            <Text style={[styles.postActionLabel, { color: colors.danger }]}>
                              Устгах
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </>
                  )}
                </View>
                <Text style={[styles.postText, { color: colors.text }]}>{post.content}</Text>
                {!!post.imageUrl && (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                )}
                <Text style={[styles.commentTotal, { color: colors.muted }]}>
                  {comments.length} сэтгэгдэл
                </Text>
              </View>
            )}

            {comments.map((comment) => (
              <View
                key={comment.id}
                style={[styles.comment, activeCommentMenuId === comment.id && styles.commentActive]}
              >
                <View
                  style={[
                    styles.commentAvatar,
                    { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.commentAvatarText, { color: colors.primary }]}>
                    {(comment.author.displayName || comment.author.email).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.commentBubble,
                    { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.commentHeader}>
                    <Text numberOfLines={1} style={[styles.commentAuthor, { color: colors.text }]}>
                      {comment.author.displayName || comment.author.email.split('@')[0]}
                    </Text>
                    <Text style={[styles.commentTime, { color: colors.muted }]}>
                      · {relativeTime(comment.createdAt)}
                    </Text>
                  </View>
                  {editingCommentId === comment.id ? (
                    <View style={styles.commentEditor}>
                      <TextInput
                        autoFocus
                        multiline
                        maxLength={1000}
                        value={editDraft}
                        onChangeText={setEditDraft}
                        cursorColor={colors.primary}
                        selectionColor={colors.primary}
                        style={[
                          styles.commentEditInput,
                          {
                            color: colors.text,
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      />
                      <View style={styles.commentEditActions}>
                        <Pressable disabled={savingEdit} onPress={cancelEditingComment} hitSlop={8}>
                          <Text style={[styles.cancelCommentEdit, { color: colors.muted }]}>
                            Цуцлах
                          </Text>
                        </Pressable>
                        <Pressable
                          disabled={!editDraft.trim() || savingEdit}
                          onPress={() => void saveCommentEdit()}
                          hitSlop={8}
                        >
                          <Text
                            style={[
                              styles.saveCommentEdit,
                              { color: colors.primary },
                              (!editDraft.trim() || savingEdit) && { color: colors.muted },
                            ]}
                          >
                            {savingEdit ? 'Хадгалж байна...' : 'Хадгалах'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                      {comment.content}
                    </Text>
                  )}
                  {comment.author.id === user?.id && editingCommentId !== comment.id && (
                    <Pressable
                      accessibilityLabel="Сэтгэгдлийн үйлдлүүд"
                      hitSlop={10}
                      onPress={() => {
                        setPostMenuOpen(false);
                        setActiveCommentMenuId((current) =>
                          current === comment.id ? null : comment.id,
                        );
                      }}
                      style={styles.commentMenuButton}
                    >
                      <Icon name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
                    </Pressable>
                  )}
                  {activeCommentMenuId === comment.id && (
                    <View
                      style={[
                        styles.commentActionMenu,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Pressable
                        onPress={() => startEditingComment(comment)}
                        style={[
                          styles.commentActionButton,
                          styles.commentActionDivider,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <Icon name="create-outline" size={17} color={colors.text} />
                        <Text style={[styles.commentActionLabel, { color: colors.text }]}>
                          Засах
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void deleteComment(comment.id)}
                        style={styles.commentActionButton}
                      >
                        <Icon name="trash-outline" size={17} color={colors.danger} />
                        <Text style={[styles.commentActionLabel, { color: colors.danger }]}>
                          Устгах
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {!comments.length && (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Одоогоор сэтгэгдэл алга
                </Text>
                <Text style={[styles.emptyCopy, { color: colors.muted }]}>
                  Хамгийн эхний сэтгэгдлийг бичээрэй.
                </Text>
              </View>
            )}
            {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          </ScrollView>
        )}

        <View
          style={[
            styles.composer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void send()}
            placeholder="Сэтгэгдэл бичих..."
            placeholderTextColor={colors.muted}
            cursorColor={colors.primary}
            selectionColor={colors.primary}
            returnKeyType="send"
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable disabled={!draft.trim() || sending} onPress={() => void send()}>
            <Text
              style={[
                styles.send,
                { color: colors.primary },
                (!draft.trim() || sending) && [styles.sendDisabled, { color: colors.muted }],
              ]}
            >
              {sending ? '...' : 'Илгээх'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020B0D' },
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
  heading: { color: '#F4F7F6', fontSize: 20, fontWeight: '900' },
  headerSpacer: { width: 44 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingBottom: 35 },
  post: {
    position: 'relative',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#17272C',
  },
  postActive: { zIndex: 50 },
  postAuthor: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 11 },
  postAuthorCopy: { minWidth: 0, flex: 1 },
  postMenuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postActionMenu: {
    position: 'absolute',
    right: 0,
    top: 44,
    zIndex: 60,
    elevation: 12,
    minWidth: 150,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  postActionButton: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postActionDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  postActionLabel: { fontSize: 13, fontWeight: '800' },
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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  commentActive: { zIndex: 40 },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#173027',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: lime, fontSize: 10, fontWeight: '900' },
  commentBubble: {
    flex: 1,
    position: 'relative',
    marginLeft: 10,
    minHeight: 76,
    paddingLeft: 14,
    paddingRight: 52,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: '#08191A',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  commentAuthor: {
    maxWidth: '58%',
    color: '#F0F4F2',
    fontSize: 13,
    fontWeight: '900',
  },
  commentText: { color: '#CBD4D0', fontSize: 14, lineHeight: 21, marginTop: 7 },
  commentEditor: { marginTop: 8 },
  commentEditInput: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  commentEditActions: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 18,
  },
  cancelCommentEdit: { fontSize: 11, fontWeight: '800' },
  saveCommentEdit: { fontSize: 11, fontWeight: '900' },
  commentTime: { flexShrink: 1, color: '#71807A', fontSize: 10, marginLeft: 7 },
  commentMenuButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    width: 30,
    height: 28,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentActionMenu: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: 18,
    zIndex: 30,
    elevation: 10,
    minWidth: 132,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  commentActionButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  commentActionDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  commentActionLabel: { fontSize: 12, fontWeight: '800' },
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
    borderWidth: 1,
    color: '#EDF2F0',
    backgroundColor: '#0A1B1C',
    fontSize: 14,
  },
  send: { color: lime, fontSize: 13, fontWeight: '900', marginLeft: 12 },
  sendDisabled: { color: '#45633C' },
});
