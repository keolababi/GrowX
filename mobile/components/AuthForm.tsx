import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import type { AuthResponse } from '@/types/auth';
import { credentialsSchema } from '@/utils/auth';

type FormValues = { email: string; password: string; displayName?: string };

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const signIn = useAuthStore((state) => state.signIn);
  const setUser = useUserStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { email: '', password: '', displayName: '' },
  });

  const submit = async (values: FormValues) => {
    setError(null);
    const parsed = credentialsSchema.safeParse(values);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Invalid form data.');
    try {
      const { data } = await api.post<AuthResponse>(`/auth/${mode === 'login' ? 'login' : 'register'}`, values);
      await signIn(data.token);
      setUser(data.user);
    } catch {
      setError('Unable to authenticate. Please check your details and try again.');
    }
  };

  return (
    <View className="gap-4">
      {mode === 'register' && <Controller control={control} name="displayName" render={({ field: { onChange, value } }) => <TextInput className="rounded-xl bg-slate-800 px-4 py-3 text-white" placeholder="Name" placeholderTextColor="#94a3b8" value={value} onChangeText={onChange} />} />}
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => <TextInput className="rounded-xl bg-slate-800 px-4 py-3 text-white" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="Email" placeholderTextColor="#94a3b8" value={value} onChangeText={onChange} />} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => <TextInput className="rounded-xl bg-slate-800 px-4 py-3 text-white" secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Password" placeholderTextColor="#94a3b8" value={value} onChangeText={onChange} />} />
      {error && <Text className="text-red-400">{error}</Text>}
      <Pressable className="rounded-xl bg-indigo-500 px-4 py-3" disabled={isSubmitting} onPress={handleSubmit(submit)}>
        <Text className="text-center font-semibold text-white">{isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Text>
      </Pressable>
    </View>
  );
}
