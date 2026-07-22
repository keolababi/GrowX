import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthHeader, Screen, colors } from '@/components/Screen';
import { BackButton, Field, PrimaryButton } from '@/components/AuthUI';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';

export default function NewPassword() {
  const params = useLocalSearchParams<{ email: string; code: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (password.length < 8) return setError('Нууц үг хамгийн багадаа 8 тэмдэгт байна.');
    if (password !== confirmPassword) return setError('Нууц үгнүүд таарахгүй байна.');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { email: params.email, code: params.code, password });
      router.replace('/password-success');
    } catch (value) {
      setError(getApiError(value));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen>
      <AuthHeader
        title="Шинэ нууц үг үүсгэх"
        subtitle="Аюулгүй нууц үг сонгоно уу."
        back={<BackButton onPress={() => router.back()} />}
      />
      <Field
        label="Шинэ нууц үг"
        icon="♙"
        placeholder="••••••••••"
        secret
        value={password}
        onChangeText={setPassword}
      />
      <Text style={styles.strong}>Хүчтэй ━━━ ━━━ ━━━ ━━━</Text>
      <Field
        label="Нууц үгээ давтах"
        icon="♙"
        placeholder="••••••••••"
        secret
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <View style={{ height: 12 }} />
      {!!error && <Text style={{ color: '#ff7777', fontSize: 13 }}>{error}</Text>}
      <PrimaryButton disabled={loading} onPress={submit}>
        {loading ? 'Хадгалж байна...' : 'Хадгалах'}
      </PrimaryButton>
      <View style={styles.rules}>
        {[
          '8 ба түүнээс дээш тэмдэгтэй',
          'Том жижиг үсэг орсон байх',
          'Тоо болон тэмдэгт орсон байх',
        ].map((x) => (
          <Text key={x} style={styles.rule}>
            <Text style={styles.check}>✓ </Text>
            {x}
          </Text>
        ))}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  strong: { color: colors.lime, marginTop: -8, marginBottom: 18, fontSize: 12 },
  rules: { marginTop: 20, gap: 10 },
  rule: { color: '#E1E5E5', fontSize: 13 },
  check: { color: colors.lime, fontWeight: '900', fontSize: 16 },
});
