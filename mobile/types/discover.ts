export type DiscoverUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  bio: string | null;
  company: string | null;
  accountType: 'PERSONAL' | 'BUSINESS';
  isMentor: boolean;
  industry: string | null;
};
