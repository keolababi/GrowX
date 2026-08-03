import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, Stack, type Href } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { useUser } from '@/providers/UserProvider';
import { usePodcastStore } from '@/store/podcastStore';
import type { Podcast, PodcastEpisode } from '@/types/media';
import { NotificationBell } from '@/components/NotificationBell';
import { AppBottomNav } from '@/components/AppBottomNav';
import { Icon } from '@/components/ui/Icon';

const lime = '#8EE817';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}

function PodcastRow({
  podcast,
  isFollowingHost,
  onToggleFollowHost,
  resumeAt,
}: {
  podcast: Podcast;
  isFollowingHost: boolean;
  onToggleFollowHost: () => void;
  resumeAt?: number;
}) {
  const episode = podcast.episodes[0];
  const player = useAudioPlayer(episode?.audioUrl ?? null);
  const status = useAudioPlayerStatus(player);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [resumed, setResumed] = useState(false);
  const savedEpisodeIds = usePodcastStore((state) => state.savedEpisodeIds);
  const toggleSaved = usePodcastStore((state) => state.toggleSaved);
  const setProgress = usePodcastStore((state) => state.setProgress);

  useEffect(() => {
    if (!resumed && resumeAt && status.duration > 0) {
      void player.seekTo(resumeAt);
      setResumed(true);
    }
  }, [resumeAt, resumed, status.duration, player]);

  useEffect(() => {
    if (!episode || !status.playing) return;
    const interval = setInterval(() => {
      setProgress(episode.id, status.currentTime, status.duration);
    }, 5000);
    return () => clearInterval(interval);
  }, [episode, status.currentTime, status.duration, status.playing, setProgress]);

  if (!episode) return null;

  const toggle = () => {
    setControlsOpen(true);
    if (status.playing) {
      player.pause();
      setProgress(episode.id, status.currentTime, status.duration);
    } else {
      player.play();
    }
  };

  const seekBy = (seconds: number) => {
    const nextTime = Math.min(Math.max(status.currentTime + seconds, 0), status.duration || 0);
    void player.seekTo(nextTime);
  };

  const share = async () => {
    try {
      await Share.share({ message: `${podcast.title} — GrowX podcast` });
    } catch {
      // User dismissed the native share sheet.
    }
  };

  const progress =
    status.duration > 0 ? Math.min(Math.max(status.currentTime / status.duration, 0), 1) : 0;
  const saved = savedEpisodeIds.has(episode.id);

  return (
    <View style={[styles.uploadedCard, controlsOpen && styles.uploadedCardActive]}>
      <Pressable onPress={toggle} style={styles.uploadedRow}>
        {podcast.coverUrl ? (
          <Image source={{ uri: podcast.coverUrl }} style={styles.uploadedCover} />
        ) : (
          <View style={styles.uploadedCover} />
        )}
        <View style={styles.uploadedCopy}>
          <Text numberOfLines={1} style={styles.uploadedTitle}>
            {podcast.title}
          </Text>
          <Text numberOfLines={2} style={styles.uploadedDescription}>
            {podcast.description || 'Тайлбаргүй'}
          </Text>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              router.push(`/users/${podcast.author.id}` as Href);
            }}
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
        </View>
        <View style={styles.uploadedPlay}>
          <Text style={styles.uploadedPlayText}>{status.playing ? 'Ⅱ' : '▶'}</Text>
        </View>
      </Pressable>

      {controlsOpen && (
        <View style={styles.playerControls}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.playerTime}>{formatTime(status.currentTime)}</Text>
            <Text style={styles.playerTime}>{formatTime(status.duration)}</Text>
          </View>
          <View style={styles.controlRow}>
            <Pressable
              accessibilityLabel="10 секунд ухрах"
              onPress={() => seekBy(-10)}
              style={({ pressed }) => [styles.skipButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.skipValue}>−10</Text>
              <Text style={styles.skipUnit}>сек</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={status.playing ? 'Түр зогсоох' : 'Тоглуулах'}
              onPress={toggle}
              style={({ pressed }) => [styles.mainControl, pressed && styles.controlPressed]}
            >
              <Text style={styles.mainControlIcon}>{status.playing ? 'Ⅱ' : '▶'}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="10 секунд урагшлуулах"
              onPress={() => seekBy(10)}
              style={({ pressed }) => [styles.skipButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.skipValue}>+10</Text>
              <Text style={styles.skipUnit}>сек</Text>
            </Pressable>
          </View>
          {status.isBuffering && <Text style={styles.buffering}>Ачаалж байна...</Text>}

          <View style={styles.secondaryActions}>
            <Pressable
              onPress={onToggleFollowHost}
              style={[styles.followChip, isFollowingHost && styles.followChipActive]}
            >
              <Text style={[styles.followChipText, isFollowingHost && styles.followChipTextActive]}>
                {isFollowingHost ? 'Дагаж буй' : 'Хостыг дагах'}
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
                color={saved ? lime : '#D6DBDC'}
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
      )}
    </View>
  );
}

export default function PodcastScreen() {
  const { user } = useUser();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const progress = usePodcastStore((state) => state.progress);
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

  const continueListening = useMemo(() => {
    const episodeById = new Map<string, { podcast: Podcast; episode: PodcastEpisode }>();
    for (const podcast of podcasts) {
      for (const episode of podcast.episodes) episodeById.set(episode.id, { podcast, episode });
    }
    return Object.entries(progress)
      .map(([episodeId, value]) => ({ episodeId, ...value, match: episodeById.get(episodeId) }))
      .filter(
        (item) =>
          item.match &&
          item.durationSec > 0 &&
          item.positionSec / item.durationSec < 0.95 &&
          item.positionSec > 5,
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [podcasts, progress]);

  const continueListeningPodcastIds = useMemo(
    () => new Set(continueListening.map((item) => item.match!.podcast.id)),
    [continueListening],
  );

  const visiblePodcasts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return podcasts.filter((podcast) => {
      if (continueListeningPodcastIds.has(podcast.id)) return false;
      if (!normalizedQuery) return true;
      return (
        podcast.title.toLocaleLowerCase().includes(normalizedQuery) ||
        (podcast.description ?? '').toLocaleLowerCase().includes(normalizedQuery)
      );
    });
  }, [continueListeningPodcastIds, podcasts, query]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Podcast</Text>
          <View style={styles.headerActions}>
            <NotificationBell />
            <Pressable
              accessibilityLabel="Podcast хайх"
              hitSlop={12}
              onPress={() => {
                setSearching((current) => !current);
                if (searching) setQuery('');
              }}
            >
              <Text style={styles.search}>⌕</Text>
            </Pressable>
          </View>
        </View>

        {searching && (
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Podcast хайх..."
            placeholderTextColor="#687278"
            style={styles.searchInput}
          />
        )}

        {!!continueListening.length && (
          <>
            <Text style={styles.allTitle}>Үргэлжлүүлж сонсох</Text>
            <View style={styles.uploadedList}>
              {continueListening.map(({ episodeId, positionSec, match }) => (
                <PodcastRow
                  key={episodeId}
                  podcast={match!.podcast}
                  isFollowingHost={followingIds.has(match!.podcast.author.id)}
                  onToggleFollowHost={() => void toggleFollowHost(match!.podcast.author.id)}
                  resumeAt={positionSec}
                />
              ))}
            </View>
          </>
        )}

        <Text style={styles.allTitle}>Бүх подкаст</Text>
        <View style={styles.uploadedList}>
          {visiblePodcasts.map((podcast) => (
            <PodcastRow
              key={podcast.id}
              podcast={podcast}
              isFollowingHost={followingIds.has(podcast.author.id)}
              onToggleFollowHost={() => void toggleFollowHost(podcast.author.id)}
            />
          ))}
          {!visiblePodcasts.length && <Text style={styles.empty}>Podcast олдсонгүй.</Text>}
        </View>
      </ScrollView>

      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  safeArea: { flex: 1, backgroundColor: '#020d12' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 24 },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { color: '#f7f7f7', fontSize: 31, fontWeight: '800', letterSpacing: -0.7 },
  search: { color: '#f7f7f7', fontSize: 42, lineHeight: 44, transform: [{ rotate: '-20deg' }] },
  searchInput: {
    height: 46,
    marginTop: 8,
    paddingHorizontal: 15,
    borderRadius: 13,
    color: '#fff',
    backgroundColor: '#0b171d',
    borderWidth: 1,
    borderColor: '#1a292f',
    fontSize: 15,
  },
  allTitle: { color: '#f5f5f5', fontSize: 23, fontWeight: '800', marginTop: 30, marginBottom: 17 },
  uploadedList: { gap: 11 },
  uploadedCard: {
    borderRadius: 18,
    backgroundColor: '#07161B',
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  uploadedCardActive: {
    borderColor: '#315B3C',
    backgroundColor: '#091B17',
  },
  uploadedRow: {
    minHeight: 90,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedCover: { width: 76, height: 70, borderRadius: 12, backgroundColor: '#173029' },
  uploadedCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  uploadedTitle: { color: '#F1F4F3', fontSize: 15, fontWeight: '800' },
  uploadedDescription: { color: '#8F9B97', fontSize: 12, lineHeight: 17, marginTop: 6 },
  uploadedAuthorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 6 },
  uploadedAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#173126' },
  uploadedAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#173126',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedAvatarText: { color: lime, fontSize: 8, fontWeight: '900' },
  uploadedAuthor: { color: lime, fontSize: 10, fontWeight: '800' },
  uploadedPlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedPlayText: { color: '#162000', fontSize: 15, fontWeight: '900' },
  playerControls: {
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 17,
    borderTopWidth: 1,
    borderTopColor: '#173027',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#24352F',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: lime },
  timeRow: {
    marginTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerTime: { color: '#819089', fontSize: 11, fontWeight: '600' },
  controlRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 29,
  },
  skipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#50635B',
    backgroundColor: '#10231D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipValue: { color: '#F0F5F2', fontSize: 14, lineHeight: 16, fontWeight: '900' },
  skipUnit: { color: '#87958F', fontSize: 8, lineHeight: 10, fontWeight: '700' },
  mainControl: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lime,
    shadowColor: lime,
    shadowOpacity: 0.25,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  mainControlIcon: { color: '#142000', fontSize: 22, fontWeight: '900', marginLeft: 2 },
  controlPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  buffering: { color: '#A8B4AF', fontSize: 11, textAlign: 'center', marginTop: 5 },
  secondaryActions: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#50635B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followChipActive: { backgroundColor: lime, borderColor: lime },
  followChipText: { color: '#D6DBDC', fontSize: 12, fontWeight: '800' },
  followChipTextActive: { color: '#142000' },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10231D',
  },
  empty: { color: '#899399', textAlign: 'center', paddingVertical: 28, fontSize: 14 },
});
