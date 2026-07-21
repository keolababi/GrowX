import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, colors } from '@/components/Screen';
import { PrimaryButton } from '@/components/AuthUI';

export default function PasswordSuccess() {
  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.rays}>
          <View style={styles.circle}>
            <Text style={styles.check}>✓</Text>
          </View>
        </View>
        <Text style={styles.title}>Амжилттай!</Text>
        <Text style={styles.body}>Таны нууц үг амжилттай{`\n`}шинэчлэгдлээ.</Text>
        <View style={styles.button}>
          <PrimaryButton onPress={() => router.replace('/login')}>Нэвтрэх рүү очих</PrimaryButton>
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 680, justifyContent: 'center', alignItems: 'center' },
  rays: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#082012',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: colors.lime,
    shadowOpacity: 0.45,
    shadowRadius: 40,
  },
  circle: {
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 7,
    borderColor: colors.lime,
    backgroundColor: '#102B12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: colors.lime, fontSize: 72, fontWeight: '500' },
  title: { color: '#FFFFFF', fontSize: 31, fontWeight: '900' },
  body: { color: '#C6CBCD', textAlign: 'center', fontSize: 15, lineHeight: 23, marginTop: 10 },
  button: { width: '100%', marginTop: 68 },
});
