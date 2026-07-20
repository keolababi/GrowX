import { Pressable, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

export default function SettingsScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const setUser = useUserStore((state) => state.setUser);
  return <Screen><Text className="mb-6 text-2xl font-bold text-white">Settings</Text><Pressable className="rounded-xl bg-red-500 p-4" onPress={() => { void signOut(); setUser(null); }}><Text className="text-center font-semibold text-white">Sign out</Text></Pressable></Screen>;
}
