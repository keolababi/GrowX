import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = 'podcast_progress';
const SAVED_KEY = 'podcast_saved_episodes';

export type EpisodeProgress = { positionSec: number; durationSec: number; updatedAt: number };

type PodcastState = {
  progress: Record<string, EpisodeProgress>;
  savedEpisodeIds: Set<string>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setProgress: (episodeId: string, positionSec: number, durationSec: number) => void;
  toggleSaved: (episodeId: string) => void;
};

export const usePodcastStore = create<PodcastState>((set, get) => ({
  progress: {},
  savedEpisodeIds: new Set(),
  isHydrated: false,
  hydrate: async () => {
    try {
      const [progressRaw, savedRaw] = await Promise.all([
        AsyncStorage.getItem(PROGRESS_KEY),
        AsyncStorage.getItem(SAVED_KEY),
      ]);
      set({
        progress: progressRaw ? (JSON.parse(progressRaw) as Record<string, EpisodeProgress>) : {},
        savedEpisodeIds: new Set(savedRaw ? (JSON.parse(savedRaw) as string[]) : []),
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },
  setProgress: (episodeId, positionSec, durationSec) => {
    const next = {
      ...get().progress,
      [episodeId]: { positionSec, durationSec, updatedAt: Date.now() },
    };
    set({ progress: next });
    void AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  },
  toggleSaved: (episodeId) => {
    const next = new Set(get().savedEpisodeIds);
    if (next.has(episodeId)) next.delete(episodeId);
    else next.add(episodeId);
    set({ savedEpisodeIds: next });
    void AsyncStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(next)));
  },
}));
