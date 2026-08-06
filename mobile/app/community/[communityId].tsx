import { useCallback, useEffect, useMemo, useState } from 'react';
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
  TextInput,
  View,
} from 'react-native';
import { api } from '@/services/api';
import type { CommunityDetail, CommunityMember } from '@/types/community';
import type { SocialPost } from '@/types/post';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';
import { useColorMode, type AppModeColors } from '@/providers/ColorModeProvider';

type GroupTab = 'discussions' | 'articles' | 'members';

const tabs: Array<{ value: GroupTab; label: string }> = [
  { value: 'discussions', label: 'Хэлэлцүүлэг' },
  { value: 'articles', label: 'Нийтлэл' },
  { value: 'members', label: 'Гишүүд' },
];

export default function CommunityDetailScreen() {
  const { iconAccent, colors } = useColorMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [tab, setTab] = useState<GroupTab>('discussions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [membershipBusy, setMembershipBusy] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidates, setCandidates] = useState<CommunityMember[]>([]);
  const [adminBusy, setAdminBusy] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
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

  const loadCandidates = useCallback(
    async (query = '') => {
      if (!communityId) return;
      const { data } = await api.get<{ users: CommunityMember[] }>(
        `/communities/${communityId}/member-candidates`,
        { params: { q: query } },
      );
      setCandidates(data.users);
    },
    [communityId],
  );

  useEffect(() => {
    if (!addMemberOpen || !community?.isOwner) return;
    const timer = setTimeout(() => {
      void loadCandidates(candidateQuery).catch((value) => {
        setCandidates([]);
        setError(getApiError(value, 'Хэрэглэгчдийн жагсаалтыг авч чадсангүй.'));
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [addMemberOpen, candidateQuery, community?.isOwner, loadCandidates]);

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

  const addMember = async (userId: string) => {
    if (!community?.isOwner || adminBusy) return;
    setAdminBusy(userId);
    setError('');
    try {
      await api.post(`/communities/${community.id}/members`, { userId });
      await Promise.all([load(), loadCandidates(candidateQuery)]);
    } catch (value) {
      setError(getApiError(value, 'Гишүүн нэмж чадсангүй.'));
    } finally {
      setAdminBusy(null);
    }
  };

  const removeMemberNow = async (member: CommunityMember) => {
    if (!community?.isOwner || member.isOwner || adminBusy) return;
    setAdminBusy(member.id);
    setError('');
    try {
      await api.delete(`/communities/${community.id}/members/${member.id}`);
      await load();
    } catch (value) {
      setError(getApiError(value, 'Гишүүнийг хасаж чадсангүй.'));
    } finally {
      setAdminBusy(null);
    }
  };

  const confirmRemoveMember = (member: CommunityMember) => {
    const memberName = member.displayName || member.email.split('@')[0];
    if (Platform.OS === 'web') {
      if (globalThis.confirm(`${memberName}-г бүлгээс хасах уу?`)) {
        void removeMemberNow(member);
      }
      return;
    }
    Alert.alert('Гишүүн хасах', `${memberName}-г бүлгээс хасах уу?`, [
      { text: 'Болих', style: 'cancel' },
      { text: 'Хасах', style: 'destructive', onPress: () => void removeMemberNow(member) },
    ]);
  };

  const deleteGroupNow = async () => {
    if (!community?.isOwner || deletingGroup) return;
    setDeletingGroup(true);
    setError('');
    try {
      await api.delete(`/communities/${community.id}`);
      router.replace('/community');
    } catch (value) {
      setError(getApiError(value, 'Бүлгийг устгаж чадсангүй.'));
      setDeletingGroup(false);
    }
  };

  const confirmDeleteGroup = () => {
    if (!community?.isOwner) return;
    const message = `"${community.name}" бүлэг болон бүх post, хэлэлцүүлгийг бүр мөсөн устгах уу?`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) void deleteGroupNow();
      return;
    }
    Alert.alert('Бүлэг устгах', message, [
      { text: 'Болих', style: 'cancel' },
      { text: 'Бүр мөсөн устгах', style: 'destructive', onPress: () => void deleteGroupNow() },
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={iconAccent} style={styles.loader} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={iconAccent}
            onRefresh={() => void load(true)}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!!error && <Text style={styles.error}>{error}</Text>}
        {community && (
          <>
            <View style={styles.cover}>
              {community.coverUrl ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: community.coverUrl }}
                  style={styles.coverImage}
                />
              ) : (
                <>
                  <View style={styles.coverGlow} />
                  <View style={styles.groupMark}>
                    <Text style={styles.groupMarkText}>
                      {community.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                </>
              )}
            </View>
            <Text style={styles.name}>{community.name}</Text>
            <Text style={styles.description}>
              {community.description || 'Бизнесийн мэдлэг, туршлагаа хуваалцах бүлэг'}
            </Text>
            <Text style={styles.stats}>
              {community.memberCount} гишүүн · {community.postCount} post
            </Text>

            <Pressable
              disabled={membershipBusy}
              onPress={community.isOwner ? () => setTab('members') : handleMembership}
              style={[
                styles.membershipButton,
                community.joinedByMe && styles.leaveButton,
                community.isOwner && styles.ownerButton,
              ]}
            >
              {membershipBusy ? (
                <ActivityIndicator color={community.joinedByMe ? iconAccent : '#142000'} />
              ) : (
                <Text
                  style={[
                    styles.membershipButtonText,
                    community.joinedByMe && styles.leaveButtonText,
                  ]}
                >
                  {community.isOwner
                    ? 'Бүлэг удирдах'
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
                {community.isOwner && (
                  <View style={styles.adminPanel}>
                    <View style={styles.adminPanelHeader}>
                      <View style={styles.adminPanelCopy}>
                        <Text style={styles.adminPanelTitle}>Гишүүдийн удирдлага</Text>
                        <Text style={styles.adminPanelHint}>
                          Хэрэглэгч нэмж, одоогийн гишүүдийг хасах боломжтой.
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          setAddMemberOpen((open) => !open);
                          setCandidateQuery('');
                          setError('');
                        }}
                        style={[
                          styles.addMemberButton,
                          addMemberOpen && styles.addMemberButtonOpen,
                        ]}
                      >
                        <Text style={styles.addMemberButtonText}>
                          {addMemberOpen ? 'Хаах' : '＋ Нэмэх'}
                        </Text>
                      </Pressable>
                    </View>

                    {addMemberOpen && (
                      <View style={styles.candidatePanel}>
                        <TextInput
                          autoCapitalize="none"
                          value={candidateQuery}
                          onChangeText={setCandidateQuery}
                          placeholder="Нэр эсвэл и-мэйлээр хайх"
                          placeholderTextColor={colors.muted}
                          style={styles.candidateSearch}
                        />
                        {candidates.map((candidate) => {
                          const candidateName =
                            candidate.displayName || candidate.email.split('@')[0];
                          return (
                            <View key={candidate.id} style={styles.candidateRow}>
                              {candidate.avatarUrl ? (
                                <Image
                                  source={{ uri: candidate.avatarUrl }}
                                  style={styles.candidateAvatar}
                                />
                              ) : (
                                <View style={styles.candidateAvatarFallback}>
                                  <Text style={styles.candidateAvatarText}>
                                    {candidateName.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.candidateCopy}>
                                <Text numberOfLines={1} style={styles.candidateName}>
                                  {candidateName}
                                </Text>
                                <Text numberOfLines={1} style={styles.candidateEmail}>
                                  {candidate.email}
                                </Text>
                              </View>
                              <Pressable
                                disabled={Boolean(adminBusy)}
                                onPress={() => void addMember(candidate.id)}
                                style={styles.candidateAdd}
                              >
                                {adminBusy === candidate.id ? (
                                  <ActivityIndicator color={colors.ink} size="small" />
                                ) : (
                                  <Text style={styles.candidateAddText}>Нэмэх</Text>
                                )}
                              </Pressable>
                            </View>
                          );
                        })}
                        {!candidates.length && (
                          <Text style={styles.noCandidates}>Нэмэх хэрэглэгч олдсонгүй.</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
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
                      {community.isOwner && !member.isOwner ? (
                        <Pressable
                          disabled={Boolean(adminBusy)}
                          onPress={(event) => {
                            event.stopPropagation();
                            confirmRemoveMember(member);
                          }}
                          style={styles.removeMemberButton}
                        >
                          {adminBusy === member.id ? (
                            <ActivityIndicator color="#FF817B" size="small" />
                          ) : (
                            <Text style={styles.removeMemberText}>Хасах</Text>
                          )}
                        </Pressable>
                      ) : (
                        <Text style={styles.chevron}>›</Text>
                      )}
                    </Pressable>
                  );
                })}
                {community.isOwner && (
                  <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Аюултай үйлдэл</Text>
                    <Text style={styles.dangerHint}>
                      Бүлгийг устгавал гишүүд, post болон хэлэлцүүлгүүд хамт устна.
                    </Text>
                    <Pressable
                      disabled={deletingGroup}
                      onPress={confirmDeleteGroup}
                      style={styles.deleteGroupButton}
                    >
                      {deletingGroup ? (
                        <ActivityIndicator color="#FF817B" />
                      ) : (
                        <Text style={styles.deleteGroupText}>Бүлгийг устгах</Text>
                      )}
                    </Pressable>
                  </View>
                )}
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
  const { colors } = useColorMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

const createStyles = (colors: AppModeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    loader: { flex: 1 },
    header: {
      height: 68,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
    back: { color: colors.text, fontSize: 38, lineHeight: 40 },
    headerTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
      textAlign: 'center',
    },
    headerSpacer: { width: 46 },
    scroll: { flex: 1 },
    content: { width: '100%', maxWidth: 650, alignSelf: 'center', padding: 20, paddingBottom: 110 },
    error: { color: '#FF817B', marginBottom: 12 },
    cover: {
      height: 150,
      overflow: 'hidden',
      borderRadius: 22,
      backgroundColor: colors.surfaceSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverImage: { width: '100%', height: '100%' },
    coverGlow: {
      position: 'absolute',
      width: 230,
      height: 230,
      borderRadius: 115,
      backgroundColor: colors.surfaceRaised,
      opacity: 0.55,
    },
    groupMark: {
      width: 88,
      height: 88,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupMarkText: { color: colors.primary, fontSize: 24, fontWeight: '900' },
    name: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 20 },
    description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
    stats: { color: colors.muted, fontSize: 11, marginTop: 9 },
    membershipButton: {
      height: 48,
      marginTop: 19,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    membershipButtonText: { color: colors.ink, fontSize: 14, fontWeight: '900' },
    leaveButton: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    leaveButtonText: { color: colors.textSecondary },
    ownerButton: { opacity: 0.72 },
    tabs: {
      height: 54,
      marginTop: 25,
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    activeTab: { borderBottomColor: colors.primary },
    tabText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
    activeTabText: { color: colors.primary },
    feed: { paddingTop: 5 },
    postCard: { paddingVertical: 19, borderBottomWidth: 1, borderBottomColor: colors.border },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 43, height: 43, borderRadius: 22 },
    avatarFallback: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: colors.surfaceSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
    authorName: { color: colors.text, fontSize: 14, fontWeight: '900' },
    time: { color: colors.muted, fontSize: 10, marginTop: 3 },
    postContent: { color: colors.text, fontSize: 15, lineHeight: 23, marginTop: 14 },
    postImage: { width: '100%', aspectRatio: 1.55, borderRadius: 14, marginTop: 13 },
    actions: { flexDirection: 'row', gap: 24, marginTop: 13 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionIcon: { color: colors.textSecondary, fontSize: 23 },
    commentIcon: { color: colors.textSecondary, fontSize: 23 },
    actionText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
    liked: { color: colors.primary },
    memberList: { paddingTop: 5 },
    adminPanel: {
      marginVertical: 14,
      padding: 15,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    adminPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    adminPanelCopy: { flex: 1, minWidth: 0 },
    adminPanelTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
    adminPanelHint: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
    addMemberButton: {
      height: 36,
      paddingHorizontal: 13,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addMemberButtonOpen: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceRaised,
    },
    addMemberButtonText: { color: colors.ink, fontSize: 11, fontWeight: '900' },
    candidatePanel: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    candidateSearch: {
      height: 44,
      paddingHorizontal: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceRaised,
      color: colors.text,
      fontSize: 12,
      marginBottom: 8,
    },
    candidateRow: {
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    candidateAvatar: { width: 38, height: 38, borderRadius: 19 },
    candidateAvatarFallback: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surfaceSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    candidateAvatarText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
    candidateCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
    candidateName: { color: colors.text, fontSize: 12, fontWeight: '800' },
    candidateEmail: { color: colors.muted, fontSize: 9, marginTop: 3 },
    candidateAdd: {
      minWidth: 62,
      height: 32,
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    candidateAddText: { color: colors.ink, fontSize: 10, fontWeight: '900' },
    noCandidates: { color: colors.muted, fontSize: 11, textAlign: 'center', paddingVertical: 18 },
    memberRow: {
      minHeight: 72,
      paddingHorizontal: 5,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    memberRowPressed: { backgroundColor: colors.surfaceRaised },
    memberAvatar: { width: 46, height: 46, borderRadius: 23 },
    memberAvatarFallback: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.surfaceSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberAvatarText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
    memberCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
    memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    memberName: { color: colors.text, fontSize: 14, fontWeight: '900', flexShrink: 1 },
    adminBadge: {
      color: colors.primary,
      fontSize: 8,
      fontWeight: '900',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 7,
      backgroundColor: colors.surfaceSoft,
    },
    memberBio: { color: colors.muted, fontSize: 11, marginTop: 4 },
    chevron: { color: colors.muted, fontSize: 29 },
    removeMemberButton: {
      minWidth: 58,
      height: 32,
      paddingHorizontal: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#713D3A',
      backgroundColor: '#271513',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeMemberText: { color: '#FF817B', fontSize: 10, fontWeight: '900' },
    dangerZone: {
      marginTop: 24,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#5A302E',
      backgroundColor: '#1D1110',
    },
    dangerTitle: { color: '#FFAAA5', fontSize: 13, fontWeight: '900' },
    dangerHint: { color: '#9F7774', fontSize: 10, lineHeight: 16, marginTop: 5 },
    deleteGroupButton: {
      height: 42,
      marginTop: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#A54D48',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteGroupText: { color: '#FF817B', fontSize: 12, fontWeight: '900' },
    empty: { alignItems: 'center', paddingVertical: 55, paddingHorizontal: 25 },
    emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
    emptyCopy: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 8,
    },
    floatingAdd: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    floatingAddText: { color: colors.ink, fontSize: 38, lineHeight: 40 },
  });
