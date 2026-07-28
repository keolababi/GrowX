import { useCallback, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MessageUnreadBadge } from '@/components/MessageUnreadBadge';
import { NotificationBell } from '@/components/NotificationBell';
import { useUser } from '@/providers/UserProvider';
import { api } from '@/services/api';
import type { SocialPost } from '@/types/post';
import type { SocialProfile } from '@/types/social';
import { getApiError } from '@/utils/auth';

const lime = '#8EE817';

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'саяхан';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} минутын өмнө`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} цагийн өмнө`;
  return `${Math.floor(seconds / 86400)} өдрийн өмнө`;
}

export default function ProfileScreen() {
  const { user } = useUser();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [{ data }, { data: postsData }] = await Promise.all([
        api.get<SocialProfile>(`/users/${user.id}`),
        api.get<{ posts: SocialPost[] }>(`/posts/user/${user.id}`),
      ]);
      setProfile(data);
      setPosts(postsData.posts);
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

  const toggleLike = async (post: SocialPost) => {
    setPosts((items) =>
      items.map((item) =>
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
      setPosts((items) =>
        items.map((item) =>
          item.id === post.id
            ? { ...item, likedByMe: data.liked, likeCount: data.likeCount }
            : item,
        ),
      );
    } catch {
      void load();
    }
  };

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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {profile && (
            <>
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
                {profile.user.displayName || profile.user.email.split('@')[0]}
              </Text>
              <Text style={styles.bio}>{profile.user.bio || 'GrowX хэрэглэгч'}</Text>
              {!!profile.user.company && <Text style={styles.company}>{profile.user.company}</Text>}

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
                  <Text style={styles.postsTitle}>Posts</Text>
                  <Pressable onPress={() => router.push('/posts/create')}>
                    <Text style={styles.createPost}>＋ Post</Text>
                  </Pressable>
                </View>
                {posts.map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    <View style={styles.postMetaRow}>
                      <Text style={styles.postTime}>{relativeTime(post.createdAt)}</Text>
                      {!!post.community && (
                        <Text style={styles.communityName}>{post.community.name}</Text>
                      )}
                    </View>
                    <Text style={styles.postContent}>{post.content}</Text>
                    {!!post.imageUrl && (
                      <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                    )}
                    <View style={styles.postActions}>
                      <Pressable onPress={() => void toggleLike(post)} style={styles.postAction}>
                        <Text style={[styles.postActionIcon, post.likedByMe && styles.liked]}>
                          {post.likedByMe ? '♥' : '♡'}
                        </Text>
                        <Text style={[styles.postActionText, post.likedByMe && styles.liked]}>
                          {post.likeCount}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => router.push('/posts')} style={styles.postAction}>
                        <Text style={styles.commentIcon}>○</Text>
                        <Text style={styles.postActionText}>{post.commentCount}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                {!posts.length && (
                  <Text style={styles.noPosts}>Одоогоор post оруулаагүй байна.</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        <NavItem icon="⌂" label="Нүүр" onPress={() => router.replace('/home')} />
        <NavItem icon="⌘" label="Мэдлэг" onPress={() => router.replace('/medlege')} />
        <Pressable onPress={() => router.push('/posts/create')} style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </Pressable>
        <NavItem icon="◯" label="Мессеж" onPress={() => router.replace('/messages')} />
        <NavItem icon="♙" label="Профайл" active />
      </View>
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

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
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
  content: { alignItems: 'center', padding: 24, paddingBottom: 125 },
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
  postsSection: { width: '100%', maxWidth: 520, marginTop: 34 },
  postsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  postsTitle: { color: '#F4F7F6', fontSize: 20, fontWeight: '900' },
  createPost: { color: lime, fontSize: 12, fontWeight: '900' },
  postCard: {
    marginBottom: 12,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#09171A',
    borderWidth: 1,
    borderColor: '#162B29',
  },
  postMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postTime: { color: '#74817B', fontSize: 10 },
  communityName: { color: lime, fontSize: 10, fontWeight: '800' },
  postContent: { color: '#EDF3F0', fontSize: 14, lineHeight: 21, marginTop: 10 },
  postImage: { width: '100%', aspectRatio: 1.35, borderRadius: 13, marginTop: 12 },
  postActions: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#172B28',
    flexDirection: 'row',
    gap: 24,
  },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postActionIcon: { color: '#D2DBD7', fontSize: 21 },
  commentIcon: { color: '#D2DBD7', fontSize: 21 },
  postActionText: { color: '#A4B0AA', fontSize: 12, fontWeight: '700' },
  liked: { color: lime },
  noPosts: {
    color: '#78867F',
    textAlign: 'center',
    paddingVertical: 35,
    borderRadius: 15,
    backgroundColor: '#081512',
  },
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
  navIcon: { color: '#E0E6E3', fontSize: 29, lineHeight: 31 },
  navLabel: { color: '#C5CECA', fontSize: 12, fontWeight: '600' },
  navActive: { color: lime },
  addButton: {
    width: 61,
    height: 61,
    borderRadius: 31,
    marginTop: -27,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#061712',
  },
  addIcon: { color: '#142000', fontSize: 38, lineHeight: 40, fontWeight: '300' },
});
