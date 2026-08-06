import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthHeader, Screen, colors } from '@/components/Screen';
import { BackButton, Field, FooterLink, PrimaryButton } from '@/components/AuthUI';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email.includes('@')) return setError('Зөв и-мэйл хаяг оруулна уу.');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', {
        email: email.trim(),
      });
      router.push({
        pathname: '/verify-code',
        params: { email: email.trim() },
      });
    } catch (value) {
      setError(getApiError(value));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen>
      <AuthHeader
        title="Нууц үгээ мартсан уу?"
        subtitle={'И-мэйл хаягаа оруулж, сэргээх\nлинкээ аваарай.'}
        back={<BackButton onPress={() => router.back()} />}
      />
      <View style={styles.art}>
        <View style={styles.envelope}>
          <Icon name="mail-unread-outline" size={52} color="#E5F8C8" />
        </View>
        <View style={styles.send}>
          <Icon name="paper-plane-outline" size={50} color={colors.lime} />
        </View>
        <View style={styles.dash} />
      </View>
      <Field
        label="И-мэйл хаяг"
        icon="mail-outline"
        placeholder="yourname@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      {!!error && <Text style={{ color: '#ff7777', fontSize: 13 }}>{error}</Text>}
      <PrimaryButton disabled={loading} onPress={submit}>
        {loading ? 'Илгээж байна...' : 'Сэргээх код авах'}
      </PrimaryButton>
      <FooterLink
        prefix="Нэвтрэх хэсэг рүү буцах уу?"
        action="Нэвтрэх"
        onPress={() => router.replace('/login')}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  art: { height: 220, alignItems: 'center', justifyContent: 'center' },
  envelope: {
    width: 126,
    height: 84,
    borderRadius: 13,
    backgroundColor: '#294715',
    borderWidth: 2,
    borderColor: '#579916',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ perspective: 400 }, { rotateX: '-8deg' }],
  },
  send: {
    position: 'absolute',
    right: 42,
    top: 30,
    transform: [{ rotate: '-34deg' }],
    shadowColor: colors.lime,
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  dash: {
    position: 'absolute',
    width: 185,
    height: 100,
    borderWidth: 1,
    borderColor: '#5E950A',
    borderStyle: 'dashed',
    borderRadius: 90,
    opacity: 0.8,
  },
});
