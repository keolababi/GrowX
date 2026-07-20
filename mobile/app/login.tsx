import { Link } from 'expo-router';
import { Text } from 'react-native';
import { AuthForm } from '@/components/AuthForm';
import { Screen } from '@/components/Screen';

export default function LoginScreen() {
  return <Screen><Text className="mb-2 text-3xl font-bold text-white">Welcome back</Text><Text className="mb-8 text-slate-400">Build what’s next.</Text><AuthForm mode="login" /><Link href="/register" className="mt-6 text-center text-indigo-300">Create an account</Link></Screen>;
}
