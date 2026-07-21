import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AuthHeader, Screen, colors } from '@/components/Screen';
import { BackButton, PrimaryButton } from '@/components/AuthUI';

export default function VerifyCode() {
  const [code, setCode] = useState('248713');
  const input = useRef<TextInput>(null);
  return (
    <Screen>
      <AuthHeader
        title="Кодоо оруулна уу"
        subtitle={'Таны и-мэйл рүү 6 оронтой код\nилгээсэн болно.'}
        back={<BackButton onPress={() => router.back()} />}
      />
      <Pressable onPress={() => input.current?.focus()} style={styles.codes}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.box, i === code.length - 1 && styles.active]}>
            <Text style={styles.digit}>{code[i] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.hidden}
        autoFocus
      />
      <Text style={styles.timer}>
        Код дахин илгээх <Text style={styles.green}>00:45</Text>
      </Text>
      <PrimaryButton disabled={code.length !== 6} onPress={() => router.push('/new-password')}>
        Баталгаажуулах
      </PrimaryButton>
      <View style={styles.keypad}>
        {[
          '1',
          '2\nABC',
          '3\nDEF',
          '4\nGHI',
          '5\nJKL',
          '6\nMNO',
          '7\nPQRS',
          '8\nTUV',
          '9\nWXYZ',
          '',
          '0',
          '⌫',
        ].map((k, i) => (
          <Pressable
            key={i}
            style={[styles.key, !k && { backgroundColor: 'transparent' }]}
            onPress={() =>
              k === '⌫'
                ? setCode(code.slice(0, -1))
                : /^\d/.test(k) && setCode((code + k[0]).slice(0, 6))
            }
          >
            <Text style={styles.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  codes: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 4 },
  box: {
    width: 47,
    height: 58,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#766F51',
    backgroundColor: '#11191B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: colors.lime },
  digit: { color: '#FFFFFF', fontSize: 28 },
  hidden: { position: 'absolute', opacity: 0 },
  timer: { color: '#8D9597', textAlign: 'center', marginVertical: 16, fontSize: 13 },
  green: { color: colors.lime },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    marginTop: 22,
  },
  key: {
    width: '31%',
    height: 58,
    borderRadius: 6,
    backgroundColor: '#25292B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { color: '#FFFFFF', fontSize: 20, lineHeight: 20, textAlign: 'center' },
});
