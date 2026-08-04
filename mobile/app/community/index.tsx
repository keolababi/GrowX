import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import {
  ActivityIndicator,
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
import { MessageUnreadBadge } from '@/components/MessageUnreadBadge';
import { PostCard } from '@/components/ui/PostCard';
import { Tabs } from '@/components/ui/Tabs';
import type { SocialPost } from '@/types/post';
import { relativeTime } from '@/utils/relativeTime';
import { useUser } from '@/providers/UserProvider';

const lime = '#8EE817';
type Tab = 'discussions' | 'articles' | 'groups';
const tabOrder: Tab[] = ['groups', 'discussions', 'articles'];
const tabLabels = ['Бүлгүүд', 'Хэлэлцүүлэг', 'Нийтлэл'];

export default function CommunityScreen() {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>('groups');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const defaultCommunityId = communities.find((community) => community.joinedByMe)?.id;

  const openComposer = () => {
    if (!defaultCommunityId) {
      setTab('groups');
      setError('Нийтлэл эсвэл хэлэлцүүлэг оруулахын тулд эхлээд бүлэгт нэгдэнэ үү.');
      return;
    }
    router.push({
      pathname: '/posts/create',
      params: {
        type: 'post',
        communityId: defaultCommunityId,
        communityKind: tab,
      },
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [postResponse, communityResponse] = await Promise.all([
        api.get<{ posts: SocialPost[] }>('/posts'),
        api.get<{ communities: Community[] }>('/communities'),
      ]);
      setPosts(postResponse.data.posts);
      setCommunities(communityResponse.data.communities);
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

  const runPrimaryAction = () => {
    if (tab === 'groups') {
      router.push('/community/create-group' as Href);
      return;
    }
    openComposer();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.heading}>Community</Text>
          <View style={styles.headerActions}>
            <NotificationBell />
            <Text style={styles.searchIcon}>⌕</Text>
          </View>
        </View>

        <View style={styles.search}>
          <Text style={styles.searchSmall}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Бодож байгаа зүйл?"
            placeholderTextColor="#697771"
            style={styles.searchInput}
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
            <ActivityIndicator color={lime} size="large" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.feed}
            showsVerticalScrollIndicator={false}
          >
            {!!error && <Text style={styles.error}>{error}</Text>}

            {tab === 'groups' ? (
              <>
                {filteredCommunities.map((community) => (
                  <Pressable
                    key={community.id}
                    onPress={() => router.push(`/community/${community.id}` as Href)}
                    style={({ pressed }) => [styles.groupCard, pressed && styles.groupCardPressed]}
                  >
                    {community.coverUrl ? (
                      <Image
                        resizeMode="cover"
                        source={{ uri: community.coverUrl }}
                        style={styles.groupCover}
                      />
                    ) : (
                      <View style={styles.groupMark}>
                        <Text style={styles.groupMarkText}>
                          {community.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.groupCopy}>
                      <Text style={styles.groupName}>{community.name}</Text>
                      <Text numberOfLines={2} style={styles.groupDescription}>
                        {community.description || 'Бизнесийн мэдлэг, туршлагаа хуваалцах бүлэг'}
                      </Text>
                      <Text style={styles.groupStats}>
                        {community.memberCount} гишүүн · {community.postCount} post
                      </Text>
                    </View>
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        void toggleMembership(community);
                      }}
                      style={[styles.joinButton, community.joinedByMe && styles.joinedButton]}
                    >
                      <Text
                        style={[
                          styles.joinButtonText,
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
                    author={post.author}
                    timestamp={relativeTime(post.createdAt)}
                    content={post.content}
                    media={post.imageUrl ? [{ type: 'image', url: post.imageUrl }] : []}
                    communityName={
                      post.community?.name || (tab === 'articles' ? 'Нийтлэл' : 'Startup')
                    }
                    likeCount={post.likeCount}
                    commentCount={post.commentCount}
                    likedByMe={post.likedByMe}
                    isOwnPost={post.authorId === user?.id}
                    onPressAuthor={() => router.push(`/users/${post.author.id}` as Href)}
                    onPressLike={() => void toggleLike(post)}
                    onPressComment={() => router.push(`/posts/${post.id}`)}
                    onEdit={() => router.push(`/posts/${post.id}/edit`)}
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

        <Pressable
          accessibilityLabel={tab === 'groups' ? 'Шинэ бүлэг үүсгэх' : 'Шинэ community post'}
          onPress={runPrimaryAction}
          style={styles.floatingAdd}
        >
          <Text style={styles.floatingAddText}>＋</Text>
        </Pressable>
      </View>

      <View style={styles.bottomNav}>
        <NavItem icon="⌂" label="Нүүр" active onPress={() => router.replace('/posts')} />
        <NavItem icon="⌘" label="Мэдлэг" onPress={() => router.replace('/medlege')} />
        <Pressable onPress={runPrimaryAction} style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </Pressable>
        <NavItem icon="○" label="Мессеж" onPress={() => router.replace('/messages')} />
        <NavItem icon="♙" label="Профайл" onPress={() => router.replace('/profile')} />
      </View>
    </SafeAreaView>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
      {label === 'Мессеж' && <MessageUnreadBadge />}
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  safeArea: { flex: 1, backgroundColor: '#020D12' },
  page: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingBottom: 94 },
  header: {
    height: 72,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { color: '#F5F7F6', fontSize: 29, fontWeight: '900', letterSpacing: -0.5 },
  searchIcon: { color: '#F1F5F3', fontSize: 39, lineHeight: 42, transform: [{ rotate: '-20deg' }] },
  search: {
    height: 54,
    marginHorizontal: 22,
    marginTop: 15,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: '#08171C',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchSmall: { color: '#8C9994', fontSize: 29, transform: [{ rotate: '-20deg' }] },
  searchInput: { flex: 1, height: '100%', color: '#EFF3F1', fontSize: 14, marginLeft: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
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
  groupCardPressed: { backgroundColor: '#071916' },
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
  floatingAdd: {
    position: 'absolute',
    right: 24,
    bottom: 116,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: lime,
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  floatingAddText: { color: '#142000', fontSize: 39, lineHeight: 41 },
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
  navIcon: { color: '#D8DFDC', fontSize: 29, lineHeight: 31 },
  navLabel: { color: '#C8D0CD', fontSize: 12, fontWeight: '600' },
  navActive: { color: lime },
  addButton: {
    width: 61,
    height: 61,
    borderRadius: 31,
    marginTop: -27,
    backgroundColor: lime,
    borderWidth: 4,
    borderColor: '#061712',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: '#142000', fontSize: 38, lineHeight: 40 },
});
