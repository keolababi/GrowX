export type User = {
  id: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  company: string | null;
  accountType: 'PERSONAL' | 'BUSINESS';
  coverUrl: string | null;
  industry: string | null;
  location: string | null;
  services: string | null;
};
export type AuthResponse = { user: User; token: string };
