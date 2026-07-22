import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthHeader, Screen } from '@/components/Screen';
import { BackButton, Field, FooterLink, GoogleButton, PrimaryButton } from '@/components/AuthUI';
import { api } from '@/services/api';
import type { AuthResponse } from '@/types/auth';
import { getApiError } from '@/utils/auth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useUser } from '@/providers/UserProvider';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveSession } = useUser();
  const googleSignIn = useGoogleAuth();
  const submit = async () => {
    if (!displayName.trim() || !email.trim())
      return setError('Нэр болон и-мэйлээ бүрэн оруулна уу.');
    if (password.length < 8) return setError('Нууц үг хамгийн багадаа 8 тэмдэгт байна.');
    if (password !== confirmPassword) return setError('Нууц үгнүүд таарахгүй байна.');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
      await saveSession(data.token, data.user);
      router.replace('/home');
    } catch (value) {
      setError(getApiError(value, 'Бүртгэл үүсгэж чадсангүй.'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen>
      <AuthHeader
        title="Бүртгэл үүсгэх"
        subtitle="Таны аялал эндээс эхэлнэ."
        back={<BackButton onPress={() => router.back()} />}
      />
      <Field
        label="Нэр"
        icon="♧"
        placeholder="Бүтэн нэрээ оруулна уу"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <Field
        label="И-мэйл хаяг"
        icon="✉"
        placeholder="yourname@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Нууц үг"
        icon="♙"
        placeholder="Нууц үгээ оруулна уу"
        secret
        value={password}
        onChangeText={setPassword}
      />
      <Field
        label="Нууц үгээ давтах"
        icon="♙"
        placeholder="Нууц үгээ давтана уу"
        secret
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {!!error && <Text style={{ color: '#ff7777', fontSize: 13 }}>{error}</Text>}
      <PrimaryButton disabled={loading} onPress={submit}>
        {loading ? 'Түр хүлээнэ үү...' : 'Бүртгүүлэх'}
      </PrimaryButton>
      <View style={{ height: 14 }} />
      <GoogleButton
        onPress={async () => {
          setError('');
          try {
            await googleSignIn();
          } catch (value) {
            setError(value instanceof Error ? value.message : getApiError(value));
          }
        }}
      />
      <FooterLink
        prefix="Бүртгэлтэй юу?"
        action="Нэвтрэх"
        onPress={() => router.replace('/login')}
      />
    </Screen>
  );
}
