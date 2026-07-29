export type Community = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  memberCount: number;
  postCount: number;
  joinedByMe: boolean;
};

export type CommunityMember = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isOwner: boolean;
};

export type CommunityDetail = Community & {
  isOwner: boolean;
  members: CommunityMember[];
};
