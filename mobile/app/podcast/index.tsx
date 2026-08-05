import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import {
  Image,
  type LayoutChangeEvent,
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
}: {
  podcast: Podcast;
  isFollowingHost: boolean;
  onToggleFollowHost: () => void;
  activeEpisodeId: string | null;
  onActivateEpisode: (episodeId: string) => void;
}) {
  const { iconAccent } = useColorMode();
  const episode = podcast.episodes[0];
  const mediaUrl = episode?.audioUrl ?? episode?.videoUrl ?? null;
  const player = useAudioPlayer(mediaUrl, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;
  const activationPendingRef = useRef(false);
  const [progressWidth, setProgressWidth] = useState(0);
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
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
      return;
    }
    activationPendingRef.current = true;
    onActivateEpisode(episode.id);
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

  const seekFromPress = (locationX: number) => {
    if (progressWidth <= 0 || duration <= 0) return;
    const nextTime = Math.max(0, Math.min(locationX / progressWidth, 1)) * duration;
    if (Number.isFinite(nextTime)) void player.seekTo(nextTime);
  };

  const captureProgressWidth = (event: LayoutChangeEvent) => {
    setProgressWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.uploadedCard, isPlaying && styles.uploadedCardActive]}>
      <View style={styles.podcastHero}>
        {podcast.coverUrl ? (
          <Image source={{ uri: podcast.coverUrl }} style={styles.podcastCover} />
        ) : (
          <View style={styles.podcastCoverFallback}>
            <Icon name="mic" size={30} color={iconAccent} />
          </View>
        )}
        <View style={styles.podcastHeroCopy}>
          <View style={styles.audioTypePill}>
            <View style={styles.liveDot} />
            <Text style={styles.audioTypePillText}>GROWX PODCAST</Text>
          </View>
          <Text numberOfLines={2} style={styles.heroTitle}>
            {podcast.title}
          </Text>
          <Text numberOfLines={1} style={styles.heroAuthor}>
            {podcast.author.displayName || 'GrowX хэрэглэгч'}
          </Text>
        </View>
      </View>

      <View style={styles.playerControls}>
        <Pressable
          accessibilityRole="adjustable"
          onLayout={captureProgressWidth}
          onPress={(event) => seekFromPress(event.nativeEvent.locationX)}
          style={styles.progressTrack}
        >
          <View style={styles.progressRail} />
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
        </Pressable>
        <View style={styles.controlRow}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <View style={styles.transportControls}>
            <Pressable
              accessibilityLabel="5 секунд ухраах"
              onPress={() => skip(-5)}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>−5</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={isPlaying ? 'Түр зогсоох' : 'Тоглуулах'}
              onPress={togglePlayback}
              style={styles.playButton}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} size={24} color="#071209" />
            </Pressable>
            <Pressable
              accessibilityLabel="5 секунд урагшлуулах"
              onPress={() => skip(5)}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>+5</Text>
            </Pressable>
          </View>
          <Text style={[styles.timeText, styles.durationText]}>{formatTime(duration)}</Text>
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
              <View style={styles.uploadedAvatarFallback}>
                <Text style={styles.uploadedAvatarText}>
                  {(podcast.author.displayName || 'G').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.uploadedAuthor}>
              {podcast.author.displayName || 'GrowX хэрэглэгч'}
            </Text>
          </Pressable>
          <Text style={styles.episodeNumber}>ШИНЭ ДУГААР</Text>
        </View>
        <Text numberOfLines={2} style={styles.uploadedDescription}>
          {podcast.description || 'Энэ видеонд тайлбар оруулаагүй байна.'}
        </Text>
        <View style={styles.videoFooter}>
          <Text style={styles.episodeLabel}>GROWX ORIGINALS</Text>
          <View style={styles.secondaryActions}>
            <Pressable
              onPress={onToggleFollowHost}
              style={[styles.followChip, isFollowingHost && styles.followChipActive]}
            >
              <Text style={[styles.followChipText, isFollowingHost && styles.followChipTextActive]}>
                {isFollowingHost ? 'Дагаж буй' : 'Дагах'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Хадгалах"
              onPress={() => toggleSaved(episode.id)}
              style={styles.iconAction}
            >
              <Icon
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={saved ? iconAccent : '#D6DBDC'}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="Хуваалцах"
              onPress={() => void share()}
              style={styles.iconAction}
            >
              <Icon name="arrow-redo-outline" size={20} color="#D6DBDC" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PodcastScreen() {
  const { iconAccent } = useColorMode();
  const { podcastId } = useLocalSearchParams<{ podcastId?: string }>();
  const { user } = useUser();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const hydrateStore = usePodcastStore((state) => state.hydrate);

  const load = useCallback(async () => {
    try {
      const [{ data }, followingResponse] = await Promise.all([
        api.get<{ podcasts: Podcast[] }>('/media/podcasts'),
        user?.id
          ? api.get<{ users: { id: string }[] }>(`/users/${user.id}/following`)
          : Promise.resolve(null),
      ]);
      setPodcasts(data.podcasts);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppPageHeader
        maxWidth={900}
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
          <View style={styles.header}>
            <View style={styles.headingGroup}>
              <Text style={styles.eyebrow}>GROWX ORIGINALS</Text>
              <Text style={styles.heading}>Подкаст</Text>
              <Text style={styles.headingDescription}>
                Бизнесийн бодит түүх, туршлага, ярилцлага.
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityLabel="Шинэ подкаст оруулах"
                onPress={() =>
                  router.push({ pathname: '/posts/create', params: { type: 'podcast' } })
                }
                style={styles.createButton}
              >
                <Icon name="mic" size={18} color="#142000" />
                <Text style={styles.createButtonText}>Подкаст нэмэх</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.allTitle}>Сүүлийн дугаарууд</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{podcasts.length}</Text>
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
              />
            ))}
            {!podcasts.length && (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Icon name="mic-outline" size={30} color={iconAccent} />
                </View>
                <Text style={styles.emptyTitle}>Подкаст алга</Text>
                <Text style={styles.emptyDescription}>
                  Анхны подкастаа оруулж GrowX хамт олонтой хуваалцаарай.
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/posts/create', params: { type: 'podcast' } })
                  }
                  style={styles.emptyButton}
                >
                  <Icon name="add" size={18} color="#142000" />
                  <Text style={styles.emptyButtonText}>Подкаст оруулах</Text>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  createButton: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 21,
    backgroundColor: lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  createButtonText: { color: '#142000', fontSize: 12, fontWeight: '900' },
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
  progressTrack: {
    width: '100%',
    height: 18,
    justifyContent: 'center',
  },
  progressRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#315043',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: lime,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
    backgroundColor: lime,
    borderWidth: 2,
    borderColor: '#0A251C',
  },
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
