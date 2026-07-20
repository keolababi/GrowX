export type User = { id: string; email: string; displayName: string | null };
export type AuthResponse = { user: User; token: string };
