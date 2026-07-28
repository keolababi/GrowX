import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
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
import { api } from '@/services/api';
import type { SocialProfile } from '@/types/social';
import type { SocialPost } from '@/types/post';
import { getApiError } from '@/utils/auth';

const lime = '#8EE817';

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'саяхан';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} минутын өмнө`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} цагийн өмнө`;
  return `${Math.floor(seconds / 86400)} өдрийн өмнө`;
}

export default function PublicUserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingBusy, setFollowingBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [{ data }, { data: postsData }] = await Promise.all([
        api.get<SocialProfile>(`/users/${userId}`),
        api.get<{ posts: SocialPost[] }>(`/posts/user/${userId}`),
      ]);
      setProfile(data);
      setPosts(postsData.posts);
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Профайлыг авч чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggleFollow = async () => {
    if (!profile || followingBusy) return;
    setFollowingBusy(true);
    const wasFollowing = profile.isFollowing;
    setProfile({
      ...profile,
      isFollowing: !wasFollowing,
      counts: {
        ...profile.counts,
        followers: Math.max(0, profile.counts.followers + (wasFollowing ? -1 : 1)),
      },
    });
    try {
      const { data } = await api.post<{ following: boolean; followersCount: number }>(
        `/users/${profile.user.id}/follow`,
      );
      setProfile((current) =>
        current
          ? {
              ...current,
              isFollowing: data.following,
              counts: { ...current.counts, followers: data.followersCount },
            }
          : current,
      );
    } catch (value) {
      setError(getApiError(value, 'Follow үйлдэл амжилтгүй.'));
      void load();
    } finally {
      setFollowingBusy(false);
    }
  };

  const startMessage = async () => {
    if (!profile) return;
    const { data } = await api.post<{ conversationId: string }>('/conversations', {
      recipientId: profile.user.id,
    });
    router.push(`/messages/${data.conversationId}` as Href);
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={lime} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Профайл</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
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

            {profile.isMe ? (
              <Pressable onPress={() => router.replace('/profile')} style={styles.followButton}>
                <Text style={styles.followText}>Миний профайл</Text>
              </Pressable>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  disabled={followingBusy}
                  onPress={() => void toggleFollow()}
                  style={[styles.followButton, profile.isFollowing && styles.followingButton]}
                >
                  <Text
                    style={[styles.followText, profile.isFollowing && styles.followingButtonText]}
                  >
                    {profile.isFollowing ? 'Дагаж байгаа' : 'Дагах'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void startMessage()} style={styles.messageButton}>
                  <Text style={styles.messageButtonText}>Мессеж</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.postsSection}>
              <Text style={styles.postsTitle}>Posts</Text>
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
                <Text style={styles.noPosts}>Одоогоор нийтлэл оруулаагүй байна.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  back: { color: '#F2F6F4', fontSize: 38, lineHeight: 40 },
  headerTitle: { flex: 1, color: '#F4F7F6', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  headerSpacer: { width: 46 },
  content: { alignItems: 'center', padding: 24, paddingBottom: 50 },
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
  actions: { width: '100%', maxWidth: 430, flexDirection: 'row', gap: 10, marginTop: 24 },
  followButton: {
    flex: 1,
    minHeight: 51,
    marginTop: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lime,
  },
  followText: { color: '#142000', fontSize: 15, fontWeight: '900' },
  followingButton: { backgroundColor: '#10231D', borderWidth: 1, borderColor: '#496057' },
  followingButtonText: { color: '#E8EFEC' },
  messageButton: {
    flex: 1,
    minHeight: 51,
    marginTop: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EFEC',
  },
  messageButtonText: { color: '#14201B', fontSize: 15, fontWeight: '900' },
  postsSection: { width: '100%', maxWidth: 520, marginTop: 34 },
  postsTitle: { color: '#F4F7F6', fontSize: 20, fontWeight: '900', marginBottom: 13 },
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
});
