import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Screen } from '@/components/Screen';

export default function HomeScreen() {
  return <Screen><Text className="text-3xl font-bold text-white">Discover</Text><Text className="mt-2 text-slate-400">Podcasts, reels, and conversations for builders.</Text><View className="mt-8 gap-3"><Link href="/podcast" className="rounded-xl bg-slate-800 p-4 text-white">Podcasts</Link><Link href="/reels" className="rounded-xl bg-slate-800 p-4 text-white">Reels</Link><Link href="/community" className="rounded-xl bg-slate-800 p-4 text-white">Community</Link></View></Screen>;
}
