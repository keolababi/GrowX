import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { token, isHydrating } = useAuthStore();
  if (isHydrating) return null;
  return <Redirect href={token ? '/(tabs)' : '/login'} />;
}
