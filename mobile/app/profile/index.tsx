import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppBottomNav } from '@/components/AppBottomNav';
import { NotificationBell } from '@/components/NotificationBell';
import { PostCard } from '@/components/ui/PostCard';
import { Tabs } from '@/components/ui/Tabs';
import { useUser } from '@/providers/UserProvider';
import { useEngagementStore } from '@/store/engagementStore';
import { api } from '@/services/api';
import type { SocialPost } from '@/types/post';
import type { SocialProfile } from '@/types/social';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';

const profileTabs = ['Пост', 'Дахин нийтэлсэн', 'Хадгалсан'];

const lime = '#8EE817';

export default function ProfileScreen() {
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const { user } = useUser();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [allPosts, setAllPosts] = useState<SocialPost[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const repostedIds = useEngagementStore((state) => state.repostedIds);
  const savedIds = useEngagementStore((state) => state.savedIds);
  const toggleRepost = useEngagementStore((state) => state.toggleRepost);
  const toggleSave = useEngagementStore((state) => state.toggleSave);

  useEffect(() => {
    if (saved === '1') setTabIndex(2);
  }, [saved]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [{ data }, { data: postsData }, { data: allPostsData }] = await Promise.all([
        api.get<SocialProfile>(`/users/${user.id}`),
        api.get<{ posts: SocialPost[] }>(`/posts/user/${user.id}`),
        api.get<{ posts: SocialPost[] }>('/posts'),
      ]);
      setProfile(data);
      setPosts(postsData.posts);
      setAllPosts(allPostsData.posts);
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Профайлыг авч чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const applyLike = (items: SocialPost[], postId: string, patch: Partial<SocialPost>) =>
    items.map((item) => (item.id === postId ? { ...item, ...patch } : item));

  const toggleLike = async (post: SocialPost) => {
    const optimistic = {
      likedByMe: !post.likedByMe,
      likeCount: Math.max(0, post.likeCount + (post.likedByMe ? -1 : 1)),
    };
    setPosts((items) => applyLike(items, post.id, optimistic));
    setAllPosts((items) => applyLike(items, post.id, optimistic));
    try {
      const { data } = await api.post<{ liked: boolean; likeCount: number }>(
        `/posts/${post.id}/like`,
      );
      const confirmed = { likedByMe: data.liked, likeCount: data.likeCount };
      setPosts((items) => applyLike(items, post.id, confirmed));
      setAllPosts((items) => applyLike(items, post.id, confirmed));
    } catch {
      void load();
    }
  };

  const deletePost = async (postId: string) => {
    const remove = async () => {
      try {
        await api.delete(`/posts/${postId}`);
        setPosts((items) => items.filter((item) => item.id !== postId));
        setAllPosts((items) => items.filter((item) => item.id !== postId));
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

  const tabPosts =
    tabIndex === 0
      ? posts
      : tabIndex === 1
        ? allPosts.filter((post) => repostedIds.has(post.id))
        : allPosts.filter((post) => savedIds.has(post.id));

  const emptyTabMessage = [
    'Одоогоор post оруулаагүй байна.',
    'Дахин нийтэлсэн зүйл алга.',
    'Хадгалсан зүйл алга.',
  ][tabIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профайл</Text>
        <View style={styles.headerActions}>
          <NotificationBell />
          <Pressable
            onPress={() => router.push('/profile/settings' as Href)}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={lime} style={styles.loader} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!!error && <Text style={styles.error}>{error}</Text>}
          {profile && (
            <>
              {profile.user.accountType === 'BUSINESS' && (
                <View className="-mt-6 mb-3 h-32 w-full overflow-hidden rounded-card bg-background-paper">
                  {profile.user.coverUrl && (
                    <Image source={{ uri: profile.user.coverUrl }} className="h-full w-full" />
                  )}
                </View>
              )}

              {profile.user.avatarUrl ? (
                <Image source={{ uri: profile.user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {(profile.user.displayName || profile.user.email).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.name}>
                {profile.user.accountType === 'BUSINESS' && profile.user.company
                  ? profile.user.company
                  : profile.user.displayName || profile.user.email.split('@')[0]}
              </Text>
              {profile.user.accountType === 'BUSINESS' ? (
                <>
                  {!!(profile.user.industry || profile.user.location) && (
                    <Text className="mt-1 text-xs font-bold text-brand-primary">
                      {[profile.user.industry, profile.user.location].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                  <Text style={styles.bio}>{profile.user.bio || 'GrowX бизнес хэрэглэгч'}</Text>
                  {!!profile.user.services && (
                    <Text className="mt-2 max-w-[430px] text-center text-sm leading-5 text-text-secondary">
                      {profile.user.services}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.bio}>{profile.user.bio || 'GrowX хэрэглэгч'}</Text>
                  {!!profile.user.company && (
                    <Text style={styles.company}>{profile.user.company}</Text>
                  )}
                </>
              )}

              <View style={styles.stats}>
                <Stat value={profile.counts.posts} label="Posts" />
                <Pressable
                  onPress={() =>
                    router.push(
                      `/profile/connections?userId=${profile.user.id}&tab=followers` as Href,
                    )
                  }
                >
                  <Stat value={profile.counts.followers} label="Дагагч" />
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push(
                      `/profile/connections?userId=${profile.user.id}&tab=following` as Href,
                    )
                  }
                >
                  <Stat value={profile.counts.following} label="Дагадаг" />
                </Pressable>
              </View>

              <View style={styles.postsSection}>
                <View style={styles.postsHeading}>
                  <Text style={styles.postsTitle}>Контент</Text>
                  <Pressable onPress={() => router.push('/posts/create')}>
                    <Text style={styles.createPost}>＋ Post</Text>
                  </Pressable>
                </View>
                <View className="mb-3 px-6">
                  <Tabs tabs={profileTabs} activeIndex={tabIndex} onChange={setTabIndex} />
                </View>
                {tabPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    author={post.author}
                    timestamp={relativeTime(post.createdAt)}
                    content={post.content}
                    media={post.imageUrl ? [{ type: 'image', url: post.imageUrl }] : []}
                    communityName={post.community?.name}
                    likeCount={post.likeCount}
                    commentCount={post.commentCount}
                    likedByMe={post.likedByMe}
                    isOwnPost={post.authorId === user?.id}
                    reposted={repostedIds.has(post.id)}
                    saved={savedIds.has(post.id)}
                    onPressLike={() => void toggleLike(post)}
                    onPressComment={() => router.push(`/posts/${post.id}`)}
                    onToggleRepost={() => toggleRepost(post.id)}
                    onToggleSave={() => toggleSave(post.id)}
                    onEdit={() => router.push(`/posts/${post.id}/edit`)}
                    onDelete={
                      post.authorId === user?.id ? () => void deletePost(post.id) : undefined
                    }
                  />
                ))}
                {!tabPosts.length && <Text style={styles.noPosts}>{emptyTabMessage}</Text>}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <AppBottomNav />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#031015' },
  loader: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  headerTitle: { color: '#F4F7F6', fontSize: 23, fontWeight: '900' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#315345',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { color: lime, fontSize: 19 },
  scroll: { flex: 1 },
  content: { alignItems: 'center', padding: 24, paddingBottom: 24 },
  error: { color: '#FF7777', marginBottom: 14 },
  avatar: { width: 116, height: 116, borderRadius: 58, borderWidth: 3, borderColor: lime },
  avatarFallback: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173126',
    borderWidth: 3,
    borderColor: lime,
  },
  avatarInitial: { color: lime, fontSize: 39, fontWeight: '900' },
  name: { color: '#F4F7F6', fontSize: 25, fontWeight: '900', marginTop: 17 },
  bio: { color: '#9BA7A2', fontSize: 14, marginTop: 7 },
  company: { color: lime, fontSize: 12, fontWeight: '700', marginTop: 6 },
  stats: {
    width: '100%',
    maxWidth: 430,
    marginTop: 31,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#173029',
  },
  stat: { minWidth: 75, alignItems: 'center' },
  statValue: { color: '#F3F6F5', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#8F9C96', fontSize: 12, fontWeight: '600', marginTop: 5 },
  postsSection: { width: '100%', maxWidth: 520, marginTop: 34, marginHorizontal: -24 },
  postsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
    paddingHorizontal: 24,
  },
  postsTitle: { color: '#F4F7F6', fontSize: 20, fontWeight: '900' },
  createPost: { color: lime, fontSize: 12, fontWeight: '900' },
  noPosts: {
    color: '#78867F',
    textAlign: 'center',
    paddingVertical: 35,
    borderRadius: 15,
    backgroundColor: '#081512',
  },
});
