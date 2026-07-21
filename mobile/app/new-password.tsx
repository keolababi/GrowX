import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthHeader, Screen, colors } from '@/components/Screen';
import { BackButton, Field, PrimaryButton } from '@/components/AuthUI';

export default function NewPassword() {
  return (
    <Screen>
      <AuthHeader
        title="Шинэ нууц үг үүсгэх"
        subtitle="Аюулгүй нууц үг сонгоно уу."
        back={<BackButton onPress={() => router.back()} />}
      />
      <Field label="Шинэ нууц үг" icon="♙" placeholder="••••••••••" secret />
      <Text style={styles.strong}>Хүчтэй ━━━ ━━━ ━━━ ━━━</Text>
      <Field label="Нууц үгээ давтах" icon="♙" placeholder="••••••••••" secret />
      <View style={{ height: 12 }} />
      <PrimaryButton onPress={() => router.replace('/password-success')}>Хадгалах</PrimaryButton>
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
