import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Slider from '@react-native-community/slider';
import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { useUser } from '@/providers/UserProvider';
import { usePodcastStore } from '@/store/podcastStore';
import type { Podcast } from '@/types/media';
import { NotificationBell } from '@/components/NotificationBell';
import { AppBottomNav } from '@/components/AppBottomNav';
import { AppPageHeader } from '@/components/AppPageHeader';
import { GlobalSearchButton } from '@/components/GlobalSearchButton';
import { Icon } from '@/components/ui/Icon';
import { useColorMode } from '@/providers/ColorModeProvider';

const lime = '#9AF000';

function rankPodcasts(items: Podcast[]) {
  return [...items].sort(
    (a, b) =>
      (b.listenCount ?? 0) - (a.listenCount ?? 0) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function PodcastRow({
  podcast,
  isFollowingHost,
  onToggleFollowHost,
  activeEpisodeId,
  onActivateEpisode,
  onListen,
}: {
  podcast: Podcast;
  isFollowingHost: boolean;
  onToggleFollowHost: () => void;
  activeEpisodeId: string | null;
  onActivateEpisode: (episodeId: string) => void;
  onListen: () => void;
}) {
  const { iconAccent, colors } = useColorMode();
  const episode = podcast.episodes[0];
  const mediaUrl = episode?.audioUrl ?? episode?.videoUrl ?? null;
  const player = useAudioPlayer(mediaUrl, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;
  const activationPendingRef = useRef(false);
  const [seeking, setSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const savedEpisodeIds = usePodcastStore((state) => state.savedEpisodeIds);
  const toggleSaved = usePodcastStore((state) => state.toggleSaved);

  useEffect(() => {
    if (!episode || !isPlaying || activeEpisodeId === episode.id) return;
    activationPendingRef.current = true;
    onActivateEpisode(episode.id);
  }, [activeEpisodeId, episode, isPlaying, onActivateEpisode]);

  useEffect(() => {
    if (!episode) return;
    if (activeEpisodeId === episode.id) {
      activationPendingRef.current = false;
      return;
    }
    if (isPlaying && !activationPendingRef.current) player.pause();
  }, [activeEpisodeId, episode, isPlaying, player]);

  if (!episode) return null;

  const share = async () => {
    try {
      await Share.share({ message: `${podcast.title} — GrowX podcast` });
    } catch {
      // User dismissed the native share sheet.
    }
  };

  const saved = savedEpisodeIds.has(episode.id);
  const duration = Number.isFinite(status.duration) && status.duration > 0 ? status.duration : 0;
  const currentTime = Number.isFinite(status.currentTime) ? status.currentTime : 0;
  const displayedTime = seeking ? seekTime : currentTime;

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
      return;
    }
    activationPendingRef.current = true;
    onActivateEpisode(episode.id);
    onListen();
    player.play();
  };

  const skip = (seconds: number) => {
    const knownDuration = Number.isFinite(status.duration) ? status.duration : 0;
    const knownCurrentTime = Number.isFinite(status.currentTime) ? status.currentTime : 0;
    const nextTime = Math.max(
      0,
      knownDuration > 0
        ? Math.min(knownCurrentTime + seconds, knownDuration)
        : knownCurrentTime + seconds,
    );
    if (Number.isFinite(nextTime)) void player.seekTo(nextTime);
  };

  return (
    <View
      style={[
        styles.uploadedCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isPlaying && [
          styles.uploadedCardActive,
          { backgroundColor: colors.surface, borderColor: colors.primary },
        ],
      ]}
    >
      <View
        style={[
          styles.podcastHero,
          { backgroundColor: colors.surfaceRaised, borderBottomColor: colors.border },
        ]}
      >
        {podcast.coverUrl ? (
          <Image source={{ uri: podcast.coverUrl }} style={styles.podcastCover} />
        ) : (
          <View
            style={[
              styles.podcastCoverFallback,
              { backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong },
            ]}
          >
            <Icon name="mic" size={30} color={iconAccent} />
          </View>
        )}
        <View style={styles.podcastHeroCopy}>
          <View style={[styles.audioTypePill, { backgroundColor: colors.surfaceSoft }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.audioTypePillText, { color: colors.primary }]}>GROWX PODCAST</Text>
          </View>
          <Text numberOfLines={2} style={[styles.heroTitle, { color: colors.text }]}>
            {podcast.title}
          </Text>
          <Text numberOfLines={1} style={[styles.heroAuthor, { color: colors.muted }]}>
            {podcast.author.displayName || 'GrowX хэрэглэгч'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.playerControls,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Slider
          accessibilityLabel="Podcast-ын хугацааг урагш, хойшлуулах"
          disabled={duration <= 0}
          maximumTrackTintColor={colors.surfaceSoft}
          maximumValue={Math.max(duration, 1)}
          minimumTrackTintColor={colors.primary}
          minimumValue={0}
          onSlidingComplete={(value) => {
            setSeekTime(value);
            void player
              .seekTo(value)
              .catch(() => undefined)
              .finally(() => setSeeking(false));
          }}
          onSlidingStart={() => {
            setSeekTime(currentTime);
            setSeeking(true);
          }}
          onValueChange={setSeekTime}
          step={0.1}
          style={styles.progressSlider}
          thumbTintColor={colors.primary}
          value={Math.min(displayedTime, Math.max(duration, 1))}
        />
        <View style={styles.controlRow}>
          <Text style={[styles.timeText, { color: colors.muted }]}>
            {formatTime(displayedTime)}
          </Text>
          <View style={styles.transportControls}>
            <Pressable
              accessibilityLabel="5 секунд ухраах"
              onPress={() => skip(-5)}
              style={[
                styles.skipButton,
                { backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong },
              ]}
            >
              <Text style={[styles.skipText, { color: colors.text }]}>−5</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={isPlaying ? 'Түр зогсоох' : 'Тоглуулах'}
              onPress={togglePlayback}
              style={[styles.playButton, { backgroundColor: colors.primary }]}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} size={24} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityLabel="5 секунд урагшлуулах"
              onPress={() => skip(5)}
              style={[
                styles.skipButton,
                { backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong },
              ]}
            >
              <Text style={[styles.skipText, { color: colors.text }]}>+5</Text>
            </Pressable>
          </View>
          <Text style={[styles.timeText, styles.durationText, { color: colors.muted }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      <View style={styles.videoDetails}>
        <View style={styles.creatorRow}>
          <Pressable
            onPress={() => router.push(`/users/${podcast.author.id}` as Href)}
            style={styles.uploadedAuthorRow}
          >
            {podcast.author.avatarUrl ? (
              <Image source={{ uri: podcast.author.avatarUrl }} style={styles.uploadedAvatar} />
            ) : (
              <View
                style={[styles.uploadedAvatarFallback, { backgroundColor: colors.surfaceSoft }]}
              >
                <Text style={[styles.uploadedAvatarText, { color: colors.primary }]}>
                  {(podcast.author.displayName || 'G').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[styles.uploadedAuthor, { color: colors.text }]}>
              {podcast.author.displayName || 'GrowX хэрэглэгч'}
            </Text>
          </Pressable>
          <View style={styles.episodeMeta}>
            <View style={styles.listenMetric}>
              <Icon name="headset-outline" size={15} color={colors.muted} />
              <Text style={[styles.listenMetricText, { color: colors.muted }]}>
                {podcast.listenCount ?? 0} сонссон
              </Text>
            </View>
            <Text style={[styles.episodeNumber, { color: colors.primary }]}>ШИНЭ ДУГААР</Text>
          </View>
        </View>
        <Text
          numberOfLines={2}
          style={[styles.uploadedDescription, { color: colors.textSecondary }]}
        >
          {podcast.description || 'Энэ видеонд тайлбар оруулаагүй байна.'}
        </Text>
        <View style={[styles.videoFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.episodeLabel, { color: colors.muted }]}>GROWX ORIGINALS</Text>
          <View style={styles.secondaryActions}>
            <Pressable
              onPress={onToggleFollowHost}
              style={[
                styles.followChip,
                { borderColor: colors.borderStrong },
                isFollowingHost && [
                  styles.followChipActive,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.followChipText,
                  { color: isFollowingHost ? colors.ink : colors.textSecondary },
                ]}
              >
                {isFollowingHost ? 'Дагаж буй' : 'Дагах'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Хадгалах"
              onPress={() => toggleSaved(episode.id)}
              style={[
                styles.iconAction,
                { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
              ]}
            >
              <Icon
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={saved ? iconAccent : colors.textSecondary}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="Хуваалцах"
              onPress={() => void share()}
              style={[
                styles.iconAction,
                { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
              ]}
            >
              <Icon name="arrow-redo-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PodcastScreen() {
  const { iconAccent, colors } = useColorMode();
  const { podcastId } = useLocalSearchParams<{ podcastId?: string }>();
  const { user } = useUser();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const listenedIdsRef = useRef<Set<string>>(new Set());
  const hydrateStore = usePodcastStore((state) => state.hydrate);

  const load = useCallback(async () => {
    try {
      const [{ data }, followingResponse] = await Promise.all([
        api.get<{ podcasts: Podcast[] }>('/media/podcasts'),
        user?.id
          ? api.get<{ users: { id: string }[] }>(`/users/${user.id}/following`)
          : Promise.resolve(null),
      ]);
      listenedIdsRef.current = new Set(
        data.podcasts.filter((podcast) => podcast.listenedByMe).map((podcast) => podcast.id),
      );
      setPodcasts(rankPodcasts(data.podcasts));
      if (followingResponse) {
        setFollowingIds(new Set(followingResponse.data.users.map((item) => item.id)));
      }
    } catch {
      setPodcasts([]);
    }
  }, [user?.id]);

  useEffect(() => {
    void hydrateStore();
    void load();
  }, [hydrateStore, load]);

  useEffect(() => {
    if (!podcastId) return;
    const selected = podcasts.find((item) => item.id === podcastId);
    const episode = selected?.episodes[0];
    if (episode) setActiveEpisodeId(episode.id);
  }, [podcastId, podcasts]);

  const toggleFollowHost = async (hostId: string) => {
    const wasFollowing = followingIds.has(hostId);
    setFollowingIds((current) => {
      const next = new Set(current);
      if (wasFollowing) next.delete(hostId);
      else next.add(hostId);
      return next;
    });
    try {
      await api.post(`/users/${hostId}/follow`);
    } catch {
      setFollowingIds((current) => {
        const next = new Set(current);
        if (wasFollowing) next.add(hostId);
        else next.delete(hostId);
        return next;
      });
    }
  };

  const recordListen = async (podcastId: string) => {
    if (listenedIdsRef.current.has(podcastId)) return;
    listenedIdsRef.current.add(podcastId);
    setPodcasts((items) =>
      rankPodcasts(
        items.map((podcast) =>
          podcast.id === podcastId
            ? { ...podcast, listenedByMe: true, listenCount: (podcast.listenCount ?? 0) + 1 }
            : podcast,
        ),
      ),
    );
    try {
      const { data } = await api.post<{ listened: boolean; listenCount: number }>(
        `/media/podcasts/${podcastId}/listen`,
      );
      setPodcasts((items) =>
        rankPodcasts(
          items.map((podcast) =>
            podcast.id === podcastId ? { ...podcast, listenCount: data.listenCount } : podcast,
          ),
        ),
      );
    } catch {
      listenedIdsRef.current.delete(podcastId);
      void load();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppPageHeader
        maxWidth={900}
        back
        backFallback="/medlege"
        actions={
          <>
            <GlobalSearchButton />
            <NotificationBell />
          </>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View
            style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.headingGroup}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>GROWX ORIGINALS</Text>
              <Text style={[styles.heading, { color: colors.text }]}>Подкаст</Text>
              <Text style={[styles.headingDescription, { color: colors.muted }]}>
                Бизнесийн бодит түүх, туршлага, ярилцлага.
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.allTitle, { color: colors.text }]}>Хамгийн их сонссон</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceSoft }]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                {podcasts.length}
              </Text>
            </View>
          </View>
          <View style={styles.uploadedList}>
            {podcasts.map((podcast) => (
              <PodcastRow
                key={podcast.id}
                podcast={podcast}
                isFollowingHost={followingIds.has(podcast.author.id)}
                onToggleFollowHost={() => void toggleFollowHost(podcast.author.id)}
                activeEpisodeId={activeEpisodeId}
                onActivateEpisode={setActiveEpisodeId}
                onListen={() => void recordListen(podcast.id)}
              />
            ))}
            {!podcasts.length && (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSoft }]}>
                  <Icon name="mic-outline" size={30} color={iconAccent} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Подкаст алга</Text>
                <Text style={[styles.emptyDescription, { color: colors.muted }]}>
                  Анхны подкастаа оруулж GrowX хамт олонтой хуваалцаарай.
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/posts/create', params: { type: 'podcast' } })
                  }
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                >
                  <Icon name="add" size={18} color={colors.ink} />
                  <Text style={[styles.emptyButtonText, { color: colors.ink }]}>
                    Подкаст оруулах
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020B0D' },
  topHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#29463B',
    backgroundColor: '#081D17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderIconActive: { borderColor: lime, backgroundColor: lime },
  scroll: { flex: 1 },
  content: { paddingBottom: 36 },
  page: { width: '100%', maxWidth: 900, alignSelf: 'center', paddingHorizontal: 20 },
  header: {
    minHeight: 126,
    marginTop: 18,
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E3D30',
    backgroundColor: '#062019',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headingGroup: { flex: 1, minWidth: 230 },
  eyebrow: { color: lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  heading: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 4 },
  headingDescription: { color: '#91A49B', fontSize: 12, marginTop: 6 },
  searchBar: {
    height: 50,
    borderRadius: 25,
    marginTop: 16,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#27463A',
    backgroundColor: '#071C17',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#F4F8F6',
    fontSize: 14,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allTitle: { color: '#F7FAF8', fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  countBadge: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17372A',
  },
  countBadgeText: { color: lime, fontSize: 11, fontWeight: '900' },
  uploadedList: { gap: 22 },
  uploadedCard: {
    borderRadius: 26,
    backgroundColor: '#071B16',
    borderWidth: 1,
    borderColor: '#244338',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },
  uploadedCardActive: {
    borderColor: lime,
    backgroundColor: '#082219',
  },
  podcastHero: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: '#0A251C',
    borderBottomWidth: 1,
    borderBottomColor: '#1D3D30',
  },
  podcastCover: { width: 76, height: 76, borderRadius: 18, backgroundColor: '#102E23' },
  podcastCoverFallback: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: '#102E23',
    borderWidth: 1,
    borderColor: '#315143',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastHeroCopy: { flex: 1, minWidth: 0 },
  audioTypePill: {
    alignSelf: 'flex-start',
    height: 23,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: '#153A2A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioTypePillText: { color: lime, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 8,
  },
  heroAuthor: { color: '#8FA299', fontSize: 11, fontWeight: '700', marginTop: 4 },
  playerControls: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 13,
    backgroundColor: '#0A251C',
    borderBottomWidth: 1,
    borderBottomColor: '#1D3D30',
  },
  progressSlider: { width: '100%', height: 30 },
  controlRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: { width: 48, color: '#91A39A', fontSize: 10, fontWeight: '800' },
  durationText: { textAlign: 'right' },
  transportControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  skipButton: {
    minWidth: 50,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#315043',
    backgroundColor: '#0C2C21',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  skipText: { color: '#DDE8E2', fontSize: 14, fontWeight: '900', letterSpacing: -0.2 },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: lime,
    shadowOpacity: 0.25,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  videoDetails: { padding: 19 },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: lime },
  episodeMeta: { alignItems: 'flex-end', gap: 5 },
  listenMetric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listenMetricText: { fontSize: 10, fontWeight: '800' },
  episodeNumber: { color: lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  videoFooter: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#204034',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  episodeLabel: { color: '#74877E', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  uploadedDescription: { color: '#91A098', fontSize: 13, lineHeight: 20, marginTop: 7 },
  uploadedAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  uploadedAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#173126' },
  uploadedAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#173126',
    borderWidth: 1,
    borderColor: '#315444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedAvatarText: { color: lime, fontSize: 10, fontWeight: '900' },
  uploadedAuthor: { color: '#DDE7E2', fontSize: 11, fontWeight: '800' },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  followChip: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3B5148',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followChipActive: { backgroundColor: lime, borderColor: lime },
  followChipText: { color: '#D6DFDA', fontSize: 11, fontWeight: '900' },
  followChipTextActive: { color: '#142000' },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D2B21',
    borderWidth: 1,
    borderColor: '#2B493D',
  },
  emptyCard: {
    minHeight: 280,
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#315143',
    backgroundColor: '#071B16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#122A20',
  },
  emptyTitle: { color: '#F4F8F6', fontSize: 18, fontWeight: '900', marginTop: 15 },
  emptyDescription: {
    color: '#7F8F88',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 390,
    marginTop: 7,
  },
  emptyButton: {
    height: 42,
    borderRadius: 13,
    paddingHorizontal: 17,
    marginTop: 18,
    backgroundColor: lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  emptyButtonText: { color: '#142000', fontSize: 12, fontWeight: '900' },
});
