import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STARTED_KEY = 'learning_started_lessons';
const COMPLETED_KEY = 'learning_completed_lessons';

type LearningState = {
  startedIds: Set<string>;
  completedIds: Set<string>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  markStarted: (lessonId: string) => void;
  toggleCompleted: (lessonId: string) => void;
};

export const useLearningStore = create<LearningState>((set, get) => ({
  startedIds: new Set(),
  completedIds: new Set(),
  isHydrated: false,
  hydrate: async () => {
    try {
      const [startedRaw, completedRaw] = await Promise.all([
        AsyncStorage.getItem(STARTED_KEY),
        AsyncStorage.getItem(COMPLETED_KEY),
      ]);
      set({
        startedIds: new Set(startedRaw ? (JSON.parse(startedRaw) as string[]) : []),
        completedIds: new Set(completedRaw ? (JSON.parse(completedRaw) as string[]) : []),
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },
  markStarted: (lessonId) => {
    if (get().startedIds.has(lessonId)) return;
    const next = new Set(get().startedIds);
    next.add(lessonId);
    set({ startedIds: next });
    void AsyncStorage.setItem(STARTED_KEY, JSON.stringify(Array.from(next)));
  },
  toggleCompleted: (lessonId) => {
    const next = new Set(get().completedIds);
    if (next.has(lessonId)) next.delete(lessonId);
    else next.add(lessonId);
    set({ completedIds: next });
    void AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(Array.from(next)));
  },
}));
