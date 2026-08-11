export type ReelAuthor = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ReelComment = {
  id: string;
  content: string;
  createdAt: string;
  author: ReelAuthor;
};

export type Reel = {
  id: string;
  authorId: string;
  caption: string | null;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
  author: ReelAuthor;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  comments: ReelComment[];
};
