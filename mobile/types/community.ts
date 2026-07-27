export type Community = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  memberCount: number;
  postCount: number;
  joinedByMe: boolean;
};
