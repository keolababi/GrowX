import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors } from './Screen';

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.back}>
      <Text style={styles.backText}>‹</Text>
    </Pressable>
  );
}

export function Field({
  label,
  icon,
  secret,
  ...props
}: TextInputProps & { label: string; icon: string; secret?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.icon}>{icon}</Text>
        <TextInput
          {...props}
          placeholderTextColor="#747D80"
          secureTextEntry={secret && !visible}
          style={styles.input}
        />
        {secret && (
          <Pressable onPress={() => setVisible(!visible)}>
            <Text style={styles.eye}>{visible ? '◉' : '◎'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.primaryText}>{children}</Text>
    </Pressable>
  );
}

export function FooterLink({
  prefix,
  action,
  onPress,
}: {
  prefix: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{prefix} </Text>
      <Pressable onPress={onPress}>
        <Text style={styles.link}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#111A1C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  backText: { color: '#FFFFFF', fontSize: 32, fontWeight: '200', lineHeight: 33 },
  group: { marginBottom: 16 },
  label: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  icon: { color: '#D7DDDE', fontSize: 16, width: 27 },
  input: { color: '#FFFFFF', fontSize: 14, flex: 1, height: '100%' },
  eye: { color: '#D7DDDE', fontSize: 18, paddingLeft: 8 },
  primary: {
    height: 52,
    borderRadius: 11,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.lime,
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  primaryText: { color: '#071000', fontSize: 15, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#A7AEB0', fontSize: 13 },
  link: { color: colors.lime, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
