import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthHeader, Screen, colors } from '@/components/Screen';
import { BackButton, Field, FooterLink, PrimaryButton } from '@/components/AuthUI';

export default function ForgotPassword() {
  return (
    <Screen>
      <AuthHeader
        title="Нууц үгээ мартсан уу?"
        subtitle={'И-мэйл хаягаа оруулж, сэргээх\nлинкээ аваарай.'}
        back={<BackButton onPress={() => router.back()} />}
      />
      <View style={styles.art}>
        <View style={styles.envelope}>
          <Text style={styles.mail}>═</Text>
        </View>
        <Text style={styles.send}>➤</Text>
        <View style={styles.dash} />
      </View>
      <Field
        label="И-мэйл хаяг"
        icon="✉"
        placeholder="yourname@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <PrimaryButton onPress={() => router.push('/verify-code')}>Сэргээх линк илгээх</PrimaryButton>
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
  mail: { color: '#E5F8C8', fontSize: 44, fontWeight: '200' },
  send: {
    position: 'absolute',
    color: colors.lime,
    fontSize: 54,
    right: 42,
    top: 30,
    transform: [{ rotate: '-34deg' }],
    textShadowColor: colors.lime,
    textShadowRadius: 12,
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
