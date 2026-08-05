import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import {
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
import { AppPageHeader } from '@/components/AppPageHeader';
import { GlobalSearchButton } from '@/components/GlobalSearchButton';
import { Icon } from '@/components/ui/Icon';
import { PostCard } from '@/components/ui/PostCard';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState, ProfileSkeleton } from '@/components/ui/ContentState';
import { design } from '@/constants/design';
import { useUser } from '@/providers/UserProvider';
import { useEngagementStore } from '@/store/engagementStore';
import { api } from '@/services/api';
import type { SocialPost } from '@/types/post';
import type { SocialProfile } from '@/types/social';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';
import { useColorMode } from '@/providers/ColorModeProvider';

const profileTabs = ['Пост', 'Дахин нийтэлсэн', 'Хадгалсан'];

const lime = '#9AF000';

export default function ProfileScreen() {
  const { iconAccent } = useColorMode();
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

  const emptyTab = [
    {
      icon: 'create-outline' as const,
      title: 'Таны эхний post энд харагдана',
      description: 'Санаа, сурсан зүйл эсвэл асуултаа GrowX community-той хуваалцаарай.',
      action: 'Post үүсгэх',
      route: '/posts/create' as Href,
    },
    {
      icon: 'repeat-outline' as const,
      title: 'Дахин нийтэлсэн зүйл алга',
      description: 'Таалагдсан post-оо дахин нийтлэхэд энэ хэсэгт хадгалагдана.',
      action: 'Post үзэх',
      route: '/posts' as Href,
    },
    {
      icon: 'bookmark-outline' as const,
      title: 'Хадгалсан зүйл алга',
      description: 'Дараа унших контентоо bookmark хийвэл эндээс хурдан олно.',
      action: 'Контент хайх',
      route: '/discover' as Href,
    },
  ][tabIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppPageHeader
        title="Профайл"
        actions={
          <>
            <GlobalSearchButton />
            <NotificationBell />
            <Pressable
              accessibilityLabel="Тохиргоо"
              onPress={() => router.push('/profile/settings' as Href)}
              style={styles.settingsButton}
            >
              <Icon name="settings-outline" size={20} color={iconAccent} />
            </Pressable>
          </>
        }
      />

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!!error && !profile && (
            <EmptyState
              icon="cloud-offline-outline"
              title="Профайлыг нээж чадсангүй"
              description={error}
              actionLabel="Дахин оролдох"
              onAction={() => void load()}
            />
          )}
          {!!error && !!profile && <Text style={styles.error}>{error}</Text>}
          {profile && (
            <>
              <View style={styles.profileCard}>
                {profile.user.accountType === 'BUSINESS' && (
                  <View style={styles.cover}>
                    {profile.user.coverUrl && (
                      <Image source={{ uri: profile.user.coverUrl }} style={styles.coverImage} />
                    )}
                    {!profile.user.coverUrl && <View style={styles.coverPattern} />}
                  </View>
                )}

                {profile.user.avatarUrl ? (
                  <Image
                    source={{ uri: profile.user.avatarUrl }}
                    style={[
                      styles.avatar,
                      profile.user.accountType === 'BUSINESS' && styles.avatarOverCover,
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      profile.user.accountType === 'BUSINESS' && styles.avatarOverCover,
                    ]}
                  >
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
                <Text style={styles.username}>@{profile.user.email.split('@')[0]}</Text>
                <View style={styles.badges}>
                  <View style={styles.accountBadge}>
                    <Icon
                      name={
                        profile.user.accountType === 'BUSINESS'
                          ? 'business-outline'
                          : 'person-outline'
                      }
                      size={13}
                      color={iconAccent}
                    />
                    <Text style={styles.accountBadgeText}>
                      {profile.user.accountType === 'BUSINESS'
                        ? 'Бизнес профайл'
                        : 'Хувийн профайл'}
                    </Text>
                  </View>
                  {profile.user.isMentor && (
                    <View style={styles.accountBadge}>
                      <Icon name="people-outline" size={13} color={iconAccent} />
                      <Text style={styles.accountBadgeText}>Ментор</Text>
                    </View>
                  )}
                </View>
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

                <Pressable
                  onPress={() => router.push('/profile/personal' as Href)}
                  style={({ pressed }) => [styles.editProfile, pressed && styles.buttonPressed]}
                >
                  <Icon name="pencil-outline" size={16} color={design.colors.ink} />
                  <Text style={styles.editProfileText}>Профайл засах</Text>
                </Pressable>

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
                {!tabPosts.length && (
                  <EmptyState
                    icon={emptyTab.icon}
                    title={emptyTab.title}
                    description={emptyTab.description}
                    actionLabel={emptyTab.action}
                    onAction={() => router.push(emptyTab.route)}
                  />
                )}
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
  safeArea: { flex: 1, backgroundColor: design.colors.background },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#233D34',
    backgroundColor: '#0D1D19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: design.layout.feedWidth,
    alignSelf: 'center',
    alignItems: 'center',
    padding: design.layout.pagePadding,
    paddingBottom: 24,
  },
  error: {
    width: '100%',
    color: '#FF7777',
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#2A1215',
  },
  profileCard: {
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 24,
    borderRadius: design.radius.hero,
    backgroundColor: design.colors.surface,
  },
  cover: {
    width: '100%',
    height: 126,
    marginTop: -24,
    marginHorizontal: -24,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: design.colors.surfaceSoft,
  },
  coverImage: { width: '100%', height: '100%' },
  coverPattern: {
    width: '55%',
    height: '100%',
    alignSelf: 'center',
    borderRadius: 90,
    backgroundColor: '#16402E',
  },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: lime },
  avatarOverCover: { marginTop: -60 },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173126',
    borderWidth: 3,
    borderColor: lime,
  },
  avatarInitial: { color: lime, fontSize: 34, fontWeight: '900' },
  name: { color: '#F4F7F6', fontSize: 24, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  username: { color: design.colors.muted, fontSize: 12, marginTop: 3 },
  badges: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
  },
  accountBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: design.colors.surfaceSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  accountBadgeText: { color: design.colors.textSecondary, fontSize: 10, fontWeight: '800' },
  bio: { color: '#9BA7A2', fontSize: 14, marginTop: 7 },
  company: { color: lime, fontSize: 12, fontWeight: '700', marginTop: 6 },
  editProfile: {
    minHeight: 40,
    marginTop: 18,
    paddingHorizontal: 17,
    borderRadius: 20,
    backgroundColor: lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  editProfileText: { color: design.colors.ink, fontSize: 12, fontWeight: '900' },
  buttonPressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  stats: {
    width: '100%',
    maxWidth: 430,
    marginTop: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 18,
    backgroundColor: design.colors.surfaceRaised,
  },
  stat: { minWidth: 75, alignItems: 'center' },
  statValue: { color: '#F3F6F5', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#8F9C96', fontSize: 12, fontWeight: '600', marginTop: 5 },
  postsSection: { width: '100%', maxWidth: 680, marginTop: 24 },
  postsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
    paddingHorizontal: 24,
  },
  postsTitle: { color: '#F4F7F6', fontSize: 20, fontWeight: '900' },
  createPost: { color: lime, fontSize: 12, fontWeight: '900' },
});
