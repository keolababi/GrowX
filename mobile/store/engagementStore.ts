import { create } from 'zustand';

type EngagementState = {
  repostedIds: Set<string>;
  savedIds: Set<string>;
  savedReelIds: Set<string>;
  toggleRepost: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleSaveReel: (reelId: string) => void;
};

function toggleInSet(set: Set<string>, id: string) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export const useEngagementStore = create<EngagementState>((set) => ({
  repostedIds: new Set(),
  savedIds: new Set(),
  savedReelIds: new Set(),
  toggleRepost: (postId) =>
    set((state) => ({ repostedIds: toggleInSet(state.repostedIds, postId) })),
  toggleSave: (postId) => set((state) => ({ savedIds: toggleInSet(state.savedIds, postId) })),
  toggleSaveReel: (reelId) =>
    set((state) => ({ savedReelIds: toggleInSet(state.savedReelIds, reelId) })),
}));
