import { create } from 'zustand';

export type NavSection = 'home' | 'knowledge' | 'messages' | 'profile';

type TabPressState = {
  section: NavSection | null;
  ts: number;
  pressActiveTab: (section: NavSection) => void;
};

export const useTabPressStore = create<TabPressState>((set) => ({
  section: null,
  ts: 0,
  pressActiveTab: (section) => set({ section, ts: Date.now() }),
}));
