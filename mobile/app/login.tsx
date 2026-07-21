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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <PrimaryButton onPress={() => undefined}>Нэвтрэх</PrimaryButton>
      <Divider />
      <GoogleButton onPress={() => undefined} />
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
});
