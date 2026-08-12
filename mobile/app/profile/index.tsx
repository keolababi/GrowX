import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useTabPressStore } from '@/store/tabPressStore';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppBottomNav } from '@/components/AppBottomNav';
import { NotificationBell } from '@/components/NotificationBell';
import { AppPageHeader } from '@/components/AppPageHeader';
import { GlobalSearchButton } from '@/components/GlobalSearchButton';
import { Icon } from '@/components/ui/Icon';
import { PostCard } from '@/components/ui/PostCard';
import { Tabs } from '@/components/ui/Tabs';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { EmptyState, ProfileSkeleton } from '@/components/ui/ContentState';
import { design } from '@/constants/design';
import { useUser } from '@/providers/UserProvider';
import { useEngagementStore } from '@/store/engagementStore';
import { api } from '@/services/api';
import type { SocialPost } from '@/types/post';
import type { Reel } from '@/types/reel';
import type { SocialProfile } from '@/types/social';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';
import { useColorMode } from '@/providers/ColorModeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';

const profileTabs = ['Пост', 'Reel', 'Дахин', 'Хадгалсан'];

const lime = '#9AF000';

export default function ProfileScreen() {
  const { iconAccent, colors } = useColorMode();
  const { confirm } = useAppDialog();
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const { user } = useUser();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [allPosts, setAllPosts] = useState<SocialPost[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const repostedIds = useEngagementStore((state) => state.repostedIds);
  const savedIds = useEngagementStore((state) => state.savedIds);
  const toggleRepost = useEngagementStore((state) => state.toggleRepost);
  const toggleSave = useEngagementStore((state) => state.toggleSave);

  useEffect(() => {
    if (saved === '1') setTabIndex(3);
  }, [saved]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [{ data }, { data: postsData }, { data: allPostsData }, { data: reelsData }] =
        await Promise.all([
          api.get<SocialProfile>(`/users/${user.id}`),
          api.get<{ posts: SocialPost[] }>(`/posts/user/${user.id}`),
          api.get<{ posts: SocialPost[] }>('/posts'),
          api.get<{ reels: Reel[] }>('/media/reels/mine'),
        ]);
      setProfile(data);
      setPosts(postsData.posts);
      setAllPosts(allPostsData.posts);
      setReels(reelsData.reels);
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

  const scrollRef = useRef<ScrollView>(null);
  const tabPress = useTabPressStore((state) => (state.section === 'profile' ? state.ts : 0));
  const isFirstTabPressRef = useRef(true);
  useEffect(() => {
    if (isFirstTabPressRef.current) {
      isFirstTabPressRef.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    void load();
  }, [tabPress, load]);

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
    const accepted = await confirm({
      title: 'Post устгах',
      message: 'Энэ post-ийг устгах уу?',
      confirmLabel: 'Устгах',
      variant: 'danger',
    });
    if (accepted) await remove();
  };

  const deleteReel = async (reelId: string) => {
    const accepted = await confirm({
      title: 'Reel устгах',
      message: 'Энэ Reel-ийг устгах уу? Буцаан сэргээх боломжгүй.',
      confirmLabel: 'Устгах',
      variant: 'danger',
    });
    if (!accepted) return;
    try {
      await api.delete(`/media/reels/${reelId}`);
      setReels((items) => items.filter((item) => item.id !== reelId));
    } catch (value) {
      setError(getApiError(value, 'Reel устгаж чадсангүй.'));
    }
  };

  const tabPosts =
    tabIndex === 0
      ? posts
      : tabIndex === 2
        ? allPosts.filter((post) => repostedIds.has(post.id))
        : tabIndex === 3
          ? allPosts.filter((post) => savedIds.has(post.id))
          : [];

  const emptyTab = [
    {
      icon: 'create-outline' as const,
      title: 'Таны эхний post энд харагдана',
      description: 'Санаа, сурсан зүйл эсвэл асуултаа GrowX community-той хуваалцаарай.',
      action: 'Post үүсгэх',
      route: '/posts/create' as Href,
    },
    {
      icon: 'videocam-outline' as const,
      title: 'Таны эхний Reel энд харагдана',
      description: 'Босоо видеогоо оруулаад GrowX community-той хуваалцаарай.',
      action: 'Reel оруулах',
      route: { pathname: '/posts/create', params: { type: 'reel' } } as Href,
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <AppPageHeader
        title="Профайл"
        actions={
          <>
            <GlobalSearchButton />
            <NotificationBell />
            <Pressable
              accessibilityLabel="Тохиргоо"
              onPress={() => router.push('/profile/settings' as Href)}
              style={[
                styles.settingsButton,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
              ]}
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
          ref={scrollRef}
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
          {!!error && !!profile && (
            <Text
              style={[
                styles.error,
                {
                  color: colors.danger,
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              {error}
            </Text>
          )}
          {profile && (
            <>
              <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
                {profile.user.accountType === 'BUSINESS' && (
                  <View style={[styles.cover, { backgroundColor: colors.surfaceSoft }]}>
                    {profile.user.coverUrl && (
                      <Image source={{ uri: profile.user.coverUrl }} style={styles.coverImage} />
                    )}
                    {!profile.user.coverUrl && (
                      <View
                        style={[styles.coverPattern, { backgroundColor: colors.surfaceRaised }]}
                      />
                    )}
                  </View>
                )}

                {profile.user.avatarUrl ? (
                  <Image
                    source={{ uri: profile.user.avatarUrl }}
                    style={[
                      styles.avatar,
                      { borderColor: colors.primary },
                      profile.user.accountType === 'BUSINESS' && styles.avatarOverCover,
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      { backgroundColor: colors.surfaceSoft, borderColor: colors.primary },
                      profile.user.accountType === 'BUSINESS' && styles.avatarOverCover,
                    ]}
                  >
                    <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                      {(profile.user.displayName || profile.user.email).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.name, { color: colors.text }]}>
                  {profile.user.accountType === 'BUSINESS' && profile.user.company
                    ? profile.user.company
                    : profile.user.displayName || profile.user.email.split('@')[0]}
                </Text>
                <Text style={[styles.username, { color: colors.muted }]}>
                  @{profile.user.email.split('@')[0]}
                </Text>
                <View style={styles.badges}>
                  <View style={[styles.accountBadge, { backgroundColor: colors.surfaceSoft }]}>
                    <Icon
                      name={
                        profile.user.accountType === 'BUSINESS'
                          ? 'business-outline'
                          : 'person-outline'
                      }
                      size={13}
                      color={iconAccent}
                    />
                    <Text style={[styles.accountBadgeText, { color: colors.textSecondary }]}>
                      {profile.user.accountType === 'BUSINESS'
                        ? 'Бизнес профайл'
                        : 'Хувийн профайл'}
                    </Text>
                  </View>
                  {profile.user.isMentor && (
                    <View style={[styles.accountBadge, { backgroundColor: colors.surfaceSoft }]}>
                      <Icon name="school-outline" size={13} color={iconAccent} />
                      <Text style={[styles.accountBadgeText, { color: colors.textSecondary }]}>
                        Ментор
                      </Text>
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
                    <Text style={[styles.bio, { color: colors.muted }]}>
                      {profile.user.bio || 'GrowX бизнес хэрэглэгч'}
                    </Text>
                    {!!profile.user.services && (
                      <Text className="mt-2 max-w-[430px] text-center text-sm leading-5 text-text-secondary">
                        {profile.user.services}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={[styles.bio, { color: colors.muted }]}>
                      {profile.user.bio || 'GrowX хэрэглэгч'}
                    </Text>
                    {!!profile.user.company && (
                      <Text style={[styles.company, { color: colors.primary }]}>
                        {profile.user.company}
                      </Text>
                    )}
                  </>
                )}

                <Pressable
                  onPress={() => router.push('/profile/personal' as Href)}
                  style={({ pressed }) => [
                    styles.editProfile,
                    { backgroundColor: colors.primary },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Icon name="pencil-outline" size={16} color={colors.ink} />
                  <Text style={[styles.editProfileText, { color: colors.ink }]}>Профайл засах</Text>
                </Pressable>

                <View style={[styles.stats, { backgroundColor: colors.surfaceRaised }]}>
                  <Stat value={profile.counts.posts} label="Posts" />
                  <Pressable onPress={() => setTabIndex(1)}>
                    <Stat value={reels.length} label="Reels" />
                  </Pressable>
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
                  <Text style={[styles.postsTitle, { color: colors.text }]}>Контент</Text>
                </View>
                <View className="mb-3 px-6">
                  <Tabs tabs={profileTabs} activeIndex={tabIndex} onChange={setTabIndex} />
                </View>
                {tabIndex === 1 ? (
                  reels.length ? (
                    <>
                      <View style={styles.reelSectionHeader}>
                        <Text style={[styles.reelCount, { color: colors.muted }]}>
                          {reels.length} Reel
                        </Text>
                        <Pressable
                          onPress={() => router.push('/reels/mine')}
                          style={styles.viewAllReels}
                        >
                          <Text style={[styles.viewAllReelsText, { color: colors.primary }]}>
                            Бүгдийг үзэх
                          </Text>
                          <Icon name="chevron-forward" size={16} color={iconAccent} />
                        </Pressable>
                      </View>
                      <View style={styles.reelGrid}>
                        {reels.slice(0, 6).map((reel) => (
                          <ProfileReelCard
                            key={reel.id}
                            reel={reel}
                            onDelete={() => void deleteReel(reel.id)}
                          />
                        ))}
                      </View>
                    </>
                  ) : (
                    <EmptyState
                      icon={emptyTab.icon}
                      title={emptyTab.title}
                      description={emptyTab.description}
                      actionLabel={emptyTab.action}
                      onAction={() => router.push(emptyTab.route)}
                    />
                  )
                ) : (
                  <>
                    {tabPosts.map((post) => (
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
                        reposted={repostedIds.has(post.id)}
                        saved={savedIds.has(post.id)}
                        onPressLike={() => void toggleLike(post)}
                        onPressComment={() => router.push(`/posts/${post.id}`)}
                        onToggleRepost={() => toggleRepost(post.id)}
                        onToggleSave={() => toggleSave(post.id)}
                        onEdit={
                          post.authorId === user?.id
                            ? () => router.push(`/posts/${post.id}/edit`)
                            : undefined
                        }
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
                  </>
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
  const { colors } = useColorMode();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function ProfileReelCard({ reel, onDelete }: { reel: Reel; onDelete: () => void }) {
  const { colors } = useColorMode();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <View
      style={[styles.reelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.reelVideoWrap}>
        <VideoPlayer source={reel.videoUrl} aspectRatio={9 / 16} loop />
        <Pressable
          accessibilityLabel="Reel-ийн үйлдлүүд"
          onPress={() => setMenuOpen((open) => !open)}
          style={[styles.reelMenuButton, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
        >
          <Icon name="ellipsis-horizontal" size={18} color="#FFFFFF" />
        </Pressable>
        {menuOpen && (
          <View
            style={[
              styles.reelMenu,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                router.push(`/reels/${reel.id}/edit` as Href);
              }}
              style={[styles.reelMenuItem, { borderBottomColor: colors.border }]}
            >
              <Icon name="create-outline" size={16} color={colors.text} />
              <Text style={[styles.reelMenuText, { color: colors.text }]}>Засах</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={styles.reelMenuItem}>
              <Icon name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.reelMenuText, { color: colors.danger }]}>Устгах</Text>
            </Pressable>
          </View>
        )}
      </View>
      <View style={styles.reelMeta}>
        <Text numberOfLines={2} style={[styles.reelCaption, { color: colors.text }]}>
          {reel.caption || 'Тайлбаргүй Reel'}
        </Text>
        <View style={styles.reelStats}>
          <View style={styles.reelStat}>
            <Icon name="heart-outline" size={14} color={colors.muted} />
            <Text style={[styles.reelStatText, { color: colors.muted }]}>{reel.likeCount}</Text>
          </View>
          <View style={styles.reelStat}>
            <Icon name="chatbubble-outline" size={14} color={colors.muted} />
            <Text style={[styles.reelStatText, { color: colors.muted }]}>{reel.commentCount}</Text>
          </View>
        </View>
      </View>
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
    borderWidth: 1,
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
    marginBottom: 13,
    paddingHorizontal: 24,
  },
  postsTitle: { color: '#F4F7F6', fontSize: 20, fontWeight: '900' },
  reelSectionHeader: {
    minHeight: 38,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reelCount: { fontSize: 12, fontWeight: '700' },
  viewAllReels: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 8 },
  viewAllReelsText: { fontSize: 12, fontWeight: '900' },
  reelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reelCard: {
    width: '48.5%',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
  },
  reelVideoWrap: { position: 'relative', overflow: 'hidden' },
  reelMenuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  reelMenu: {
    position: 'absolute',
    top: 42,
    right: 8,
    zIndex: 4,
    minWidth: 116,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 12,
  },
  reelMenuItem: {
    minHeight: 39,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderBottomWidth: 1,
  },
  reelMenuText: { fontSize: 12, fontWeight: '800' },
  reelMeta: { paddingHorizontal: 10, paddingVertical: 10 },
  reelCaption: { minHeight: 36, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  reelStats: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  reelStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reelStatText: { fontSize: 10, fontWeight: '700' },
});
