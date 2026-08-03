export type AccountType = 'PERSONAL' | 'BUSINESS';

export type SocialUser = {
  id: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  company: string | null;
  accountType: AccountType;
  coverUrl: string | null;
  industry: string | null;
  location: string | null;
  services: string | null;
  phone: string | null;
};

export type SocialProfile = {
  user: SocialUser;
  counts: { posts: number; followers: number; following: number };
  isMe: boolean;
  isFollowing: boolean;
};

export type SocialConnection = SocialUser & { isFollowing: boolean };
