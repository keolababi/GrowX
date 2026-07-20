import { Link } from 'expo-router';
import { Text } from 'react-native';
import { AuthForm } from '@/components/AuthForm';
import { Screen } from '@/components/Screen';

export default function RegisterScreen() {
  return <Screen><Text className="mb-2 text-3xl font-bold text-white">Join the platform</Text><Text className="mb-8 text-slate-400">Your founder network starts here.</Text><AuthForm mode="register" /><Link href="/login" className="mt-6 text-center text-indigo-300">Already have an account?</Link></Screen>;
}
