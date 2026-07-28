export type User = {
  id: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  company: string | null;
};
export type AuthResponse = { user: User; token: string };
