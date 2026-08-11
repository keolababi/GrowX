import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTabPressStore } from '@/store/tabPressStore';
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  type ViewStyle,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NotificationBell } from '@/components/NotificationBell';
import { AppPageHeader } from '@/components/AppPageHeader';
import { GlobalSearchButton } from '@/components/GlobalSearchButton';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { PostCard, type PostCardAuthor } from '@/components/ui/PostCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import { relativeTimeCompact as relativeTime } from '@/utils/relativeTime';
import { useUser } from '@/providers/UserProvider';
import { useEngagementStore } from '@/store/engagementStore';
import type { PostComment, SocialPost } from '@/types/post';
import { useColorMode } from '@/providers/ColorModeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
const tabs = ['Пост', 'Reel'];
const webFeedScrollStyle = {
  height: 'calc(100vh - 229px)',
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 'auto',
  overflowY: 'auto',
} as unknown as ViewStyle;

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase();
}

function AuthorAvatar({ author, size = 46 }: { author: PostCardAuthor; size?: number }) {
  return author.avatarUrl ? (
    <Image
      source={{ uri: author.avatarUrl }}
      style={{ width: size, height: size, borderRadius: 999 }}
    />
  ) : (
    <View
      className="items-center justify-center rounded-avatar border border-border bg-background-paper"
      style={{ width: size, height: size }}
    >
      <Text className="font-extrabold text-brand-primary" style={{ fontSize: size * 0.32 }}>
        {initials(author.displayName, author.email)}
      </Text>
    </View>
  );
}

export default function PostsScreen() {
  const { colors, iconAccent: accent } = useColorMode();
  const { confirm } = useAppDialog();
  const { user } = useUser();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const repostedIds = useEngagementStore((state) => state.repostedIds);
  const savedIds = useEngagementStore((state) => state.savedIds);
  const toggleRepost = useEngagementStore((state) => state.toggleRepost);
  const toggleSave = useEngagementStore((state) => state.toggleSave);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [busyIds, setBusyIds] = useState<string[]>([]);

  const loadPosts = useCallback(
    async (refresh = false, silent = false) => {
      if (!silent) {
        if (refresh) setRefreshing(true);
        else setLoading(true);
      }
      setError('');
      try {
        const postsResponse = await api.get<{ posts: SocialPost[] }>('/posts');
        setPosts(postsResponse.data.posts);
        if (user?.id) {
          try {
            const followingResponse = await api.get<{ users: { id: string }[] }>(
              `/users/${user.id}/following`,
            );
            setFollowingIds(new Set(followingResponse.data.users.map((item) => item.id)));
          } catch {
            // The main feed must remain visible if follow metadata cannot be loaded.
            setFollowingIds(new Set());
          }
        }
      } catch (value) {
        setError(getApiError(value, 'Post-уудыг ачаалж чадсангүй.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const hasFocusedOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return;
      }
      void loadPosts(false, true);
    }, [loadPosts]),
  );

  const scrollRef = useRef<ScrollView>(null);
  const tabPress = useTabPressStore((state) => (state.section === 'home' ? state.ts : 0));
  const isFirstTabPressRef = useRef(true);
  useEffect(() => {
    if (isFirstTabPressRef.current) {
      isFirstTabPressRef.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    void loadPosts(true);
  }, [tabPress, loadPosts]);

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

  const toggleFollowAuthor = async (authorId: string) => {
    const wasFollowing = followingIds.has(authorId);
    setFollowingIds((current) => {
      const next = new Set(current);
      if (wasFollowing) next.delete(authorId);
      else next.add(authorId);
      return next;
    });
    try {
      await api.post(`/users/${authorId}/follow`);
    } catch (value) {
      setFollowingIds((current) => {
        const next = new Set(current);
        if (wasFollowing) next.add(authorId);
        else next.delete(authorId);
        return next;
      });
      setError(getApiError(value, 'Дагах үйлдэл амжилтгүй боллоо.'));
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
    const accepted = await confirm({
      title: 'Post устгах',
      message: 'Энэ post-ийг устгах уу?',
      confirmLabel: 'Устгах',
      variant: 'danger',
    });
    if (accepted) await remove();
  };

  return (
    <SafeAreaView className="min-h-0 flex-1 overflow-hidden bg-background-app">
      <AppPageHeader
        maxWidth={680}
        prominent
        actions={
          <>
            <GlobalSearchButton prominent />
            <NotificationBell />
          </>
        }
      />

      <View className="w-full max-w-[680px] self-center px-l py-s">
        <SegmentedControl
          options={tabs}
          selectedIndex={0}
          onChange={(index) => {
            if (index === 1) {
              router.push('/reels');
              return;
            }
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            void loadPosts(true);
          }}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loader size={44} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          className="min-h-0 w-full max-w-[680px] flex-1 self-center"
          style={Platform.OS === 'web' ? webFeedScrollStyle : undefined}
          scrollEnabled
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadPosts(true)}
              tintColor={accent}
            />
          }
        >
          {!!error && <Text className="px-l py-s text-danger">{error}</Text>}

          {posts.length === 0 && (
            <View className="items-center px-9 pt-24">
              <Text className="text-xl font-bold text-text-primary">Одоогоор post алга</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-text-muted">
                Анхны post-оо оруулаад бусадтай санаагаа хуваалцаарай.
              </Text>
              <Pressable
                onPress={() => router.push('/posts/create')}
                className="mt-l h-12 items-center justify-center rounded-btn bg-brand-primary px-l"
              >
                <Text className="text-sm font-bold text-background-app">Post оруулах</Text>
              </Pressable>
            </View>
          )}

          {posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              author={post.author}
              timestamp={relativeTime(post.createdAt)}
              content={post.content}
              media={post.imageUrl ? [{ type: 'image', url: post.imageUrl }] : []}
              communityName={post.community?.name}
              likeCount={post.likeCount}
              commentCount={post.commentCount}
              shareCount={post.shareCount}
              likedByMe={post.likedByMe}
              isOwnPost={post.authorId === user?.id}
              isFollowing={followingIds.has(post.authorId)}
              reposted={repostedIds.has(post.id)}
              saved={savedIds.has(post.id)}
              onPressAuthor={() => router.push(`/users/${post.author.id}` as Href)}
              onPressLike={() => void toggleLike(post)}
              onPressComment={() => router.push(`/posts/${post.id}?focusComment=1`)}
              onToggleFollow={() => void toggleFollowAuthor(post.authorId)}
              onToggleRepost={() => toggleRepost(post.id)}
              onToggleSave={() => toggleSave(post.id)}
              onPressMore={() => router.push(`/posts/${post.id}`)}
              onEdit={
                post.authorId === user?.id ? () => router.push(`/posts/${post.id}/edit`) : undefined
              }
              onDelete={post.authorId === user?.id ? () => void deletePost(post.id) : undefined}
              footer={
                <View className="mt-m flex-row items-center gap-s">
                  {!!user && <AuthorAvatar author={user} size={34} />}
                  <View
                    className="min-w-0 flex-1 flex-row items-center rounded-avatar border border-border bg-background-paper px-m"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <TextInput
                      value={commentDrafts[post.id] ?? ''}
                      onChangeText={(value) =>
                        setCommentDrafts((drafts) => ({ ...drafts, [post.id]: value }))
                      }
                      onSubmitEditing={() => void addComment(post.id)}
                      placeholder="Сэтгэгдэл бичих..."
                      placeholderTextColor={colors.muted}
                      cursorColor={colors.primary}
                      selectionColor={colors.primary}
                      returnKeyType="send"
                      className="h-11 flex-1 text-sm text-text-primary"
                      style={{ color: colors.text, backgroundColor: colors.surface }}
                    />
                    <Pressable
                      onPress={() => void addComment(post.id)}
                      disabled={!(commentDrafts[post.id] ?? '').trim()}
                      hitSlop={8}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 4,
                        backgroundColor: colors.primary,
                        opacity: (commentDrafts[post.id] ?? '').trim() ? 1 : 0.35,
                      }}
                    >
                      <Icon name="send" size={16} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
