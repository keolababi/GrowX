export type SocialUser = {
  id: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  company: string | null;
};

export type SocialProfile = {
  user: SocialUser;
  counts: { posts: number; followers: number; following: number };
  isMe: boolean;
  isFollowing: boolean;
};

export type SocialConnection = SocialUser & { isFollowing: boolean };
