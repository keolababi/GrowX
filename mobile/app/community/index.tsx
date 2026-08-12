import { useCallback, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import {
  Image,
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
import type { Community } from '@/types/community';
import { NotificationBell } from '@/components/NotificationBell';
import { AppBottomNav } from '@/components/AppBottomNav';
import { AppPageHeader } from '@/components/AppPageHeader';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { PostCard } from '@/components/ui/PostCard';
import { Tabs } from '@/components/ui/Tabs';
import type { SocialPost } from '@/types/post';
import { relativeTime } from '@/utils/relativeTime';
import { useUser } from '@/providers/UserProvider';
import { useColorMode } from '@/providers/ColorModeProvider';

const lime = '#9AF000';
type Tab = 'discussions' | 'articles' | 'groups';
const tabOrder: Tab[] = ['groups', 'discussions', 'articles'];
const tabLabels = ['Бүлгүүд', 'Хэлэлцүүлэг', 'Нийтлэл'];

export default function CommunityScreen() {
  const { colors } = useColorMode();
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>('groups');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const defaultCommunityId = communities.find((community) => community.joinedByMe)?.id;

  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    setError('');
    try {
      const [postResponse, communityResponse] = await Promise.all([
        api.get<{ posts: SocialPost[] }>('/posts'),
        api.get<{ communities: Community[] }>('/communities'),
      ]);
      setPosts(postResponse.data.posts);
      setCommunities(communityResponse.data.communities);
      hasLoadedRef.current = true;
    } catch (value) {
      setError(getApiError(value, 'Community мэдээллийг ачаалж чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const joinedCommunityIds = new Set(
      communities.filter((community) => community.joinedByMe).map((community) => community.id),
    );
    return posts.filter((post) => {
      const belongsToJoinedGroup =
        Boolean(post.community) && joinedCommunityIds.has(post.community!.id);
      const postType = post.communityPostType ?? (post.imageUrl ? 'ARTICLE' : 'DISCUSSION');
      const matchesTab = tab === 'articles' ? postType === 'ARTICLE' : postType === 'DISCUSSION';
      const matchesQuery =
        !normalized ||
        post.content.toLocaleLowerCase().includes(normalized) ||
        (post.author.displayName || post.author.email).toLocaleLowerCase().includes(normalized) ||
        post.community?.name.toLocaleLowerCase().includes(normalized);
      return belongsToJoinedGroup && matchesTab && matchesQuery;
    });
  }, [communities, posts, query, tab]);

  const filteredCommunities = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return communities.filter(
      (community) =>
        !normalized ||
        community.name.toLocaleLowerCase().includes(normalized) ||
        community.description?.toLocaleLowerCase().includes(normalized),
    );
  }, [communities, query]);

  const toggleLike = async (post: SocialPost) => {
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
    }
  };

  const toggleMembership = async (community: Community) => {
    try {
      await api.post<{ joined: boolean }>(`/communities/${community.id}/membership`);
      await load();
    } catch (value) {
      setError(getApiError(value, 'Community тохиргоог өөрчилж чадсангүй.'));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.page}>
        <AppPageHeader
          title="Community"
          maxWidth={900}
          back
          backFallback="/medlege"
          actions={<NotificationBell />}
        />

        <View
          style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Icon name="search-outline" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Бодож байгаа зүйл?"
            placeholderTextColor={colors.muted}
            cursorColor={colors.primary}
            selectionColor={colors.primary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <View className="px-6">
          <Tabs
            tabs={tabLabels}
            activeIndex={tabOrder.indexOf(tab)}
            onChange={(index) => setTab(tabOrder[index])}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <Loader size={44} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.feed}
            showsVerticalScrollIndicator={false}
          >
            {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

            {tab === 'groups' ? (
              <>
                {filteredCommunities.map((community) => (
                  <Pressable
                    key={community.id}
                    onPress={() => router.push(`/community/${community.id}` as Href)}
                    style={[
                      styles.groupCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    {community.coverUrl ? (
                      <Image
                        resizeMode="cover"
                        source={{ uri: community.coverUrl }}
                        style={styles.groupCover}
                      />
                    ) : (
                      <View style={[styles.groupMark, { backgroundColor: colors.surfaceSoft }]}>
                        <Text style={[styles.groupMarkText, { color: colors.primary }]}>
                          {community.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.groupCopy}>
                      <Text style={[styles.groupName, { color: colors.text }]}>
                        {community.name}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[styles.groupDescription, { color: colors.muted }]}
                      >
                        {community.description || 'Бизнесийн мэдлэг, туршлагаа хуваалцах бүлэг'}
                      </Text>
                      <Text style={[styles.groupStats, { color: colors.muted }]}>
                        {community.memberCount} гишүүн · {community.postCount} post
                      </Text>
                    </View>
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        void toggleMembership(community);
                      }}
                      style={[
                        styles.joinButton,
                        community.joinedByMe
                          ? [styles.joinedButton, { borderColor: colors.primary }]
                          : { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.joinButtonText,
                          { color: community.joinedByMe ? colors.primary : colors.ink },
                          community.joinedByMe && styles.joinedButtonText,
                        ]}
                      >
                        {community.joinedByMe ? 'Гишүүн' : 'Нэгдэх'}
                      </Text>
                    </Pressable>
                  </Pressable>
                ))}
                {!filteredCommunities.length && (
                  <EmptyState
                    title="Бүлэг олдсонгүй"
                    copy="Хайлтаа өөрчлөх эсвэл шинэ бүлэг үүсгээрэй."
                  />
                )}
              </>
            ) : (
              <>
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    postId={post.id}
                    author={post.author}
                    timestamp={relativeTime(post.createdAt)}
                    content={post.content}
                    media={post.imageUrl ? [{ type: 'image', url: post.imageUrl }] : []}
                    communityName={
                      post.community?.name || (tab === 'articles' ? 'Нийтлэл' : 'Startup')
                    }
                    likeCount={post.likeCount}
                    commentCount={post.commentCount}
                    shareCount={post.shareCount}
                    likedByMe={post.likedByMe}
                    isOwnPost={post.authorId === user?.id}
                    onPressAuthor={() => router.push(`/users/${post.author.id}` as Href)}
                    onPressLike={() => void toggleLike(post)}
                    onPressComment={() => router.push(`/posts/${post.id}`)}
                    onEdit={
                      post.authorId === user?.id
                        ? () => router.push(`/posts/${post.id}/edit`)
                        : undefined
                    }
                  />
                ))}
                {!filteredPosts.length && (
                  <EmptyState
                    title="Контент олдсонгүй"
                    copy={
                      defaultCommunityId
                        ? 'Хайлтаа өөрчлөх эсвэл шинэ контент оруулаарай.'
                        : 'Эхлээд Бүлгүүд хэсгээс бүлэгт нэгдэнэ үү.'
                    }
                  />
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>
      <AppBottomNav />
    </SafeAreaView>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  const { colors } = useColorMode();
  return (
    <View style={[styles.empty, { backgroundColor: colors.surface }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyCopy, { color: colors.muted }]}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#020B0D' },
  page: { flex: 1, minHeight: 0, width: '100%', maxWidth: 900, alignSelf: 'center' },
  search: {
    height: 54,
    marginHorizontal: 22,
    marginTop: 16,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#233D34',
    backgroundColor: '#081713',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, height: '100%', color: '#EFF3F1', fontSize: 14, marginLeft: 10 },
  center: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, minHeight: 0 },
  feed: { paddingHorizontal: 22, paddingBottom: 120 },
  error: { color: '#FF817B', fontSize: 13, paddingVertical: 12 },
  groupCard: {
    minHeight: 108,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#16272C',
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMark: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#173329',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupMarkText: { color: lime, fontSize: 13, fontWeight: '900' },
  groupCover: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#173329',
  },
  groupCopy: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 },
  groupName: { color: '#F0F4F2', fontSize: 15, fontWeight: '900' },
  groupDescription: { color: '#8C9893', fontSize: 12, lineHeight: 17, marginTop: 4 },
  groupStats: { color: '#65736D', fontSize: 10, marginTop: 5 },
  joinButton: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: lime,
    justifyContent: 'center',
  },
  joinButtonText: { color: '#142000', fontSize: 11, fontWeight: '900' },
  joinedButton: {
    borderWidth: 1,
    borderColor: lime,
    backgroundColor: 'transparent',
  },
  joinedButtonText: { color: lime, fontSize: 11, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 },
  emptyTitle: { color: '#EFF3F1', fontSize: 18, fontWeight: '900' },
  emptyCopy: { color: '#7B8983', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
});
