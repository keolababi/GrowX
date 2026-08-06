import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors } from './Screen';
import { Icon } from './ui/Icon';

type IconName = ComponentProps<typeof Icon>['name'];

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.back}>
      <Icon name="chevron-back" size={25} color="#FFFFFF" />
    </Pressable>
  );
}

export function Field({
  label,
  icon,
  secret,
  ...props
}: TextInputProps & { label: string; icon: IconName; secret?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <View style={styles.icon}>
          <Icon name={icon} size={18} color="#D7DDDE" />
        </View>
        <TextInput
          {...props}
          cursorColor={colors.lime}
          keyboardAppearance="dark"
          placeholderTextColor="#899790"
          selectionColor={colors.lime}
          secureTextEntry={secret && !visible}
          style={styles.input}
        />
        {secret && (
          <Pressable
            accessibilityLabel={visible ? 'Нууц үгийг нуух' : 'Нууц үгийг харуулах'}
            onPress={() => setVisible(!visible)}
            style={styles.eye}
          >
            <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#D7DDDE" />
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
  icon: { width: 27, alignItems: 'flex-start' },
  input: { color: '#FFFFFF', fontSize: 14, flex: 1, height: '100%' },
  eye: { paddingLeft: 8 },
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
