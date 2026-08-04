export type PodcastEpisode = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  audioUrl?: string;
  durationSec: number | null;
  publishedAt: string | null;
};

export type Podcast = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: string;
  author: { id: string; displayName: string | null; avatarUrl: string | null };
  episodes: PodcastEpisode[];
};
