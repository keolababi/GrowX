import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { PostCard } from '@/components/ui/PostCard';
import type { SocialProfile } from '@/types/social';
import type { SocialPost } from '@/types/post';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';

const lime = '#9AF000';

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

  const contactAuthor = () => {
    const phone = profile?.user.phone;
    if (!phone) {
      const message = 'Энэ хэрэглэгч утасны дугаараа оруулаагүй байна.';
      if (Platform.OS === 'web') globalThis.alert(message);
      else Alert.alert('Холбоо барих', message);
      return;
    }
    void Linking.openURL(`tel:${phone}`);
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

  const mediaPosts = useMemo(() => posts.filter((post) => !!post.imageUrl), [posts]);
  const isBusiness = profile?.user.accountType === 'BUSINESS';

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {profile && (
          <>
            {isBusiness && (
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
              {isBusiness && profile.user.company
                ? profile.user.company
                : profile.user.displayName || profile.user.email.split('@')[0]}
            </Text>
            {isBusiness ? (
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
                {isBusiness && (
                  <Pressable onPress={contactAuthor} style={styles.messageButton}>
                    <Text style={styles.messageButtonText}>Холбоо барих</Text>
                  </Pressable>
                )}
              </View>
            )}

            {isBusiness && !!mediaPosts.length && (
              <View className="mt-8 w-full max-w-[520px]">
                <Text style={styles.postsTitle}>Медиа</Text>
                <View className="mt-2 flex-row flex-wrap gap-1">
                  {mediaPosts.map((post) => (
                    <Pressable
                      key={post.id}
                      onPress={() => router.push(`/posts/${post.id}` as Href)}
                      className="aspect-square w-[32.5%]"
                    >
                      <Image
                        source={{ uri: post.imageUrl! }}
                        className="h-full w-full rounded-btn"
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.postsSection}>
              <Text style={styles.postsTitle}>Posts</Text>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  author={profile.user}
                  timestamp={relativeTime(post.createdAt)}
                  content={post.content}
                  media={post.imageUrl ? [{ type: 'image', url: post.imageUrl }] : []}
                  communityName={post.community?.name}
                  likeCount={post.likeCount}
                  commentCount={post.commentCount}
                  likedByMe={post.likedByMe}
                  isOwnPost={profile.isMe}
                  onPressLike={() => void toggleLike(post)}
                  onPressComment={() => router.push(`/posts/${post.id}`)}
                  onEdit={() => router.push(`/posts/${post.id}/edit`)}
                />
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
  safeArea: { flex: 1, backgroundColor: '#020B0D' },
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
  scroll: { flex: 1 },
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
  noPosts: {
    color: '#78867F',
    textAlign: 'center',
    paddingVertical: 35,
    borderRadius: 15,
    backgroundColor: '#081512',
  },
});
