import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { AuthHeader, Screen, colors } from '@/components/Screen';
import {
  BackButton,
  Divider,
  Field,
  FooterLink,
  GoogleButton,
  PrimaryButton,
} from '@/components/AuthUI';
import { api } from '@/services/api';
import type { AuthResponse } from '@/types/auth';
import { getApiError } from '@/utils/auth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useUser } from '@/providers/UserProvider';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveSession } = useUser();
  const googleSignIn = useGoogleAuth();

  const submit = async () => {
    if (!email.trim() || password.length < 8)
      return setError('И-мэйл болон 8+ оронтой нууц үгээ оруулна уу.');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email: email.trim(),
        password,
      });
      await saveSession(data.token, data.user);
      router.replace('/home');
    } catch (value) {
      setError(getApiError(value, 'И-мэйл эсвэл нууц үг буруу байна.'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen>
      <AuthHeader
        title="Welcome Back 👋"
        subtitle="Бизнесээ дараагийн түвшинд хүргэ."
        back={<BackButton onPress={() => router.back()} />}
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
      <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgot}>
        <Text style={styles.forgotText}>Нууц үгээ мартсан уу?</Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton disabled={loading} onPress={submit}>
        {loading ? 'Түр хүлээнэ үү...' : 'Нэвтрэх'}
      </PrimaryButton>
      <Divider />
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
        prefix="Бүртгэлгүй юу?"
        action="Бүртгүүлэх"
        onPress={() => router.push('/register')}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 8 },
  forgotText: { color: colors.lime, fontSize: 13, fontWeight: '600' },
  error: { color: '#ff7777', fontSize: 13, marginBottom: 4 },
});
