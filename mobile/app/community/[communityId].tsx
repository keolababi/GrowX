import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/services/api';
import type { CommunityDetail } from '@/types/community';
import type { SocialPost } from '@/types/post';
import { getApiError } from '@/utils/auth';

const lime = '#8EE817';
type GroupTab = 'discussions' | 'articles' | 'members';

const tabs: Array<{ value: GroupTab; label: string }> = [
  { value: 'discussions', label: 'Хэлэлцүүлэг' },
  { value: 'articles', label: 'Нийтлэл' },
  { value: 'members', label: 'Гишүүд' },
];

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} минутын өмнө`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} цагийн өмнө`;
  return `${Math.floor(hours / 24)} өдрийн өмнө`;
}

export default function CommunityDetailScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [tab, setTab] = useState<GroupTab>('discussions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [membershipBusy, setMembershipBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (refresh = false) => {
      if (!communityId) return;
      if (refresh) setRefreshing(true);
      try {
        const [{ data }, { data: postData }] = await Promise.all([
          api.get<{ community: CommunityDetail }>(`/communities/${communityId}`),
          api.get<{ posts: SocialPost[] }>('/posts'),
        ]);
        setCommunity(data.community);
        setPosts(postData.posts.filter((post) => post.community?.id === communityId));
        setError('');
      } catch (value) {
        setError(getApiError(value, 'Бүлгийн мэдээллийг авч чадсангүй.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [communityId],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visiblePosts = useMemo(() => {
    if (tab === 'members') return [];
    const wantedType = tab === 'articles' ? 'ARTICLE' : 'DISCUSSION';
    return posts.filter((post) => {
      const postType = post.communityPostType ?? (post.imageUrl ? 'ARTICLE' : 'DISCUSSION');
      return postType === wantedType;
    });
  }, [posts, tab]);

  const changeMembership = async () => {
    if (!community || membershipBusy || community.isOwner) return;
    setMembershipBusy(true);
    try {
      await api.post(`/communities/${community.id}/membership`);
      await load();
    } catch (value) {
      setError(getApiError(value, 'Гишүүнчлэлийг өөрчилж чадсангүй.'));
    } finally {
      setMembershipBusy(false);
    }
  };

  const handleMembership = () => {
    if (!community?.joinedByMe) {
      void changeMembership();
      return;
    }
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Энэ бүлгээс гарах уу?')) void changeMembership();
      return;
    }
    Alert.alert('Бүлгээс гарах', 'Та энэ бүлгээс гарахдаа итгэлтэй байна уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Гарах', style: 'destructive', onPress: () => void changeMembership() },
    ]);
  };

  const openComposer = () => {
    if (!community?.joinedByMe || tab === 'members') return;
    router.push({
      pathname: '/posts/create',
      params: {
        type: 'post',
        communityId: community.id,
        communityKind: tab,
      },
    });
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
        <ActivityIndicator color={lime} style={styles.loader} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {community?.name || 'Бүлэг'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={lime}
            onRefresh={() => void load(true)}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!!error && <Text style={styles.error}>{error}</Text>}
        {community && (
          <>
            <View style={styles.cover}>
              <View style={styles.coverGlow} />
              <View style={styles.groupMark}>
                <Text style={styles.groupMarkText}>{community.name.slice(0, 2).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.name}>{community.name}</Text>
            <Text style={styles.description}>
              {community.description || 'Бизнесийн мэдлэг, туршлагаа хуваалцах бүлэг'}
            </Text>
            <Text style={styles.stats}>
              {community.memberCount} гишүүн · {community.postCount} post
            </Text>

            <Pressable
              disabled={membershipBusy || community.isOwner}
              onPress={handleMembership}
              style={[
                styles.membershipButton,
                community.joinedByMe && styles.leaveButton,
                community.isOwner && styles.ownerButton,
              ]}
            >
              {membershipBusy ? (
                <ActivityIndicator color={community.joinedByMe ? lime : '#142000'} />
              ) : (
                <Text
                  style={[
                    styles.membershipButtonText,
                    community.joinedByMe && styles.leaveButtonText,
                  ]}
                >
                  {community.isOwner
                    ? 'Бүлгийн админ'
                    : community.joinedByMe
                      ? 'Бүлгээс гарах'
                      : 'Бүлэгт нэгдэх'}
                </Text>
              )}
            </Pressable>

            <View style={styles.tabs}>
              {tabs.map((item) => {
                const active = tab === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setTab(item.value)}
                    style={[styles.tab, active && styles.activeTab]}
                  >
                    <Text style={[styles.tabText, active && styles.activeTabText]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!community.joinedByMe && tab !== 'members' ? (
              <Empty
                title="Гишүүдэд зориулсан контент"
                copy="Хэлэлцүүлэг болон нийтлэлийг харахын тулд бүлэгт нэгдэнэ үү."
              />
            ) : tab === 'members' ? (
              <View style={styles.memberList}>
                {community.members.map((member) => {
                  const memberName = member.displayName || member.email.split('@')[0];
                  return (
                    <Pressable
                      key={member.id}
                      onPress={() => router.push(`/users/${member.id}` as Href)}
                      style={({ pressed }) => [
                        styles.memberRow,
                        pressed && styles.memberRowPressed,
                      ]}
                    >
                      {member.avatarUrl ? (
                        <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
                      ) : (
                        <View style={styles.memberAvatarFallback}>
                          <Text style={styles.memberAvatarText}>
                            {memberName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.memberCopy}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName}>{memberName}</Text>
                          {member.isOwner && <Text style={styles.adminBadge}>АДМИН</Text>}
                        </View>
                        <Text numberOfLines={1} style={styles.memberBio}>
                          {member.bio || 'GrowX хэрэглэгч'}
                        </Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.feed}>
                {visiblePosts.map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    <Pressable
                      onPress={() => router.push(`/users/${post.author.id}` as Href)}
                      style={styles.authorRow}
                    >
                      {post.author.avatarUrl ? (
                        <Image source={{ uri: post.author.avatarUrl }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarText}>
                            {(post.author.displayName || post.author.email).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={styles.authorName}>
                          {post.author.displayName || post.author.email.split('@')[0]}
                        </Text>
                        <Text style={styles.time}>{relativeTime(post.createdAt)}</Text>
                      </View>
                    </Pressable>
                    <Text style={styles.postContent}>{post.content}</Text>
                    {!!post.imageUrl && (
                      <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                    )}
                    <View style={styles.actions}>
                      <Pressable onPress={() => void toggleLike(post)} style={styles.action}>
                        <Text style={[styles.actionIcon, post.likedByMe && styles.liked]}>
                          {post.likedByMe ? '♥' : '♡'}
                        </Text>
                        <Text style={[styles.actionText, post.likedByMe && styles.liked]}>
                          {post.likeCount}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => router.push('/posts')} style={styles.action}>
                        <Text style={styles.commentIcon}>○</Text>
                        <Text style={styles.actionText}>{post.commentCount}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                {!visiblePosts.length && (
                  <Empty
                    title={tab === 'articles' ? 'Нийтлэл алга' : 'Хэлэлцүүлэг алга'}
                    copy="Доорх ＋ товчоор анхны контентоо оруулаарай."
                  />
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {community?.joinedByMe && tab !== 'members' && (
        <Pressable onPress={openComposer} style={styles.floatingAdd}>
          <Text style={styles.floatingAddText}>＋</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function Empty({ title, copy }: { title: string; copy: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020D12' },
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
  headerTitle: { flex: 1, color: '#F4F7F6', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  headerSpacer: { width: 46 },
  content: { width: '100%', maxWidth: 650, alignSelf: 'center', padding: 20, paddingBottom: 110 },
  error: { color: '#FF817B', marginBottom: 12 },
  cover: {
    height: 150,
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#0C291F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#214C25',
    opacity: 0.55,
  },
  groupMark: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: lime,
    backgroundColor: '#10291F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupMarkText: { color: lime, fontSize: 24, fontWeight: '900' },
  name: { color: '#F4F7F6', fontSize: 25, fontWeight: '900', marginTop: 20 },
  description: { color: '#9AA7A1', fontSize: 13, lineHeight: 20, marginTop: 7 },
  stats: { color: '#74827C', fontSize: 11, marginTop: 9 },
  membershipButton: {
    height: 48,
    marginTop: 19,
    borderRadius: 14,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipButtonText: { color: '#142000', fontSize: 14, fontWeight: '900' },
  leaveButton: { backgroundColor: '#10251F', borderWidth: 1, borderColor: '#3E5A50' },
  leaveButtonText: { color: '#E5ECE9' },
  ownerButton: { opacity: 0.72 },
  tabs: {
    height: 54,
    marginTop: 25,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#193029',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: lime },
  tabText: { color: '#7E8B85', fontSize: 12, fontWeight: '800' },
  activeTabText: { color: lime },
  feed: { paddingTop: 5 },
  postCard: { paddingVertical: 19, borderBottomWidth: 1, borderBottomColor: '#172B28' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 43, height: 43, borderRadius: 22 },
  avatarFallback: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#173329',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: lime, fontSize: 15, fontWeight: '900' },
  authorName: { color: '#F0F4F2', fontSize: 14, fontWeight: '900' },
  time: { color: '#75827C', fontSize: 10, marginTop: 3 },
  postContent: { color: '#E7ECEA', fontSize: 15, lineHeight: 23, marginTop: 14 },
  postImage: { width: '100%', aspectRatio: 1.55, borderRadius: 14, marginTop: 13 },
  actions: { flexDirection: 'row', gap: 24, marginTop: 13 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { color: '#D0D8D5', fontSize: 23 },
  commentIcon: { color: '#D0D8D5', fontSize: 23 },
  actionText: { color: '#A4B0AA', fontSize: 12, fontWeight: '700' },
  liked: { color: lime },
  memberList: { paddingTop: 5 },
  memberRow: {
    minHeight: 72,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#172B28',
  },
  memberRowPressed: { backgroundColor: '#081A17' },
  memberAvatar: { width: 46, height: 46, borderRadius: 23 },
  memberAvatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#173329',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: lime, fontSize: 16, fontWeight: '900' },
  memberCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  memberName: { color: '#EFF3F1', fontSize: 14, fontWeight: '900', flexShrink: 1 },
  adminBadge: {
    color: lime,
    fontSize: 8,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#17331F',
  },
  memberBio: { color: '#7E8B85', fontSize: 11, marginTop: 4 },
  chevron: { color: '#8F9C96', fontSize: 29 },
  empty: { alignItems: 'center', paddingVertical: 55, paddingHorizontal: 25 },
  emptyTitle: { color: '#EFF3F1', fontSize: 17, fontWeight: '900' },
  emptyCopy: { color: '#78867F', fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  floatingAdd: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: lime,
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  floatingAddText: { color: '#142000', fontSize: 38, lineHeight: 40 },
});
