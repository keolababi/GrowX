import { View } from 'react-native';
import { router } from 'expo-router';
import { AuthHeader, Screen } from '@/components/Screen';
import { BackButton, Field, FooterLink, GoogleButton, PrimaryButton } from '@/components/AuthUI';

export default function RegisterScreen() {
  return (
    <Screen>
      <AuthHeader
        title="Бүртгэл үүсгэх"
        subtitle="Таны аялал эндээс эхэлнэ."
        back={<BackButton onPress={() => router.back()} />}
      />
      <Field label="Нэр" icon="♧" placeholder="Бүтэн нэрээ оруулна уу" />
      <Field
        label="И-мэйл хаяг"
        icon="✉"
        placeholder="yourname@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field label="Нууц үг" icon="♙" placeholder="Нууц үгээ оруулна уу" secret />
      <Field label="Нууц үгээ давтах" icon="♙" placeholder="Нууц үгээ давтана уу" secret />
      <PrimaryButton onPress={() => router.replace('/login')}>Бүртгүүлэх</PrimaryButton>
      <View style={{ height: 14 }} />
      <GoogleButton onPress={() => router.replace('/login')} />
      <FooterLink
        prefix="Бүртгэлтэй юу?"
        action="Нэвтрэх"
        onPress={() => router.replace('/login')}
      />
    </Screen>
  );
}
