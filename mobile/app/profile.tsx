import { Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { useUserStore } from '@/store/userStore';

export default function ProfileScreen() {
  const user = useUserStore((state) => state.user);
  return <Screen><Text className="text-3xl font-bold text-white">{user?.displayName ?? 'Your profile'}</Text><Text className="mt-2 text-slate-400">{user?.email ?? 'Sign in to personalize your profile.'}</Text></Screen>;
}
