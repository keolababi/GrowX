export type PostAuthor = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type PostComment = {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
};

export type SocialPost = {
  id: string;
  authorId: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  community: { id: string; name: string } | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  comments: PostComment[];
};
