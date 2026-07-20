import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

export function useAuth() {
  const auth = useAuthStore();
  const user = useUserStore((state) => state.user);
  return { ...auth, user };
}
