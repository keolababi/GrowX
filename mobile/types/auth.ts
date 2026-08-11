export type User = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  company: string | null;
  accountType: 'PERSONAL' | 'BUSINESS';
  isMentor: boolean;
  coverUrl: string | null;
  industry: string | null;
  location: string | null;
  services: string | null;
};
export type AuthResponse = { user: User; token: string };
