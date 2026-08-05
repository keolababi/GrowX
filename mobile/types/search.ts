import type { DiscoverUser } from './discover';

export type SearchCommunity = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  memberCount: number;
  postCount: number;
};

export type SearchPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  community: { id: string; name: string } | null;
  author: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    company: string | null;
  };
  likeCount: number;
  commentCount: number;
};

export type SearchLesson = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  durationMin: number;
};

export type SearchPodcast = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  author: { id: string; email?: string; displayName: string | null };
  episodes: Array<{ id: string; title: string; durationSec: number | null }>;
};

export type GlobalSearchResponse = {
  query: string;
  users: DiscoverUser[];
  communities: SearchCommunity[];
  posts: SearchPost[];
  lessons: SearchLesson[];
  podcasts: SearchPodcast[];
};
