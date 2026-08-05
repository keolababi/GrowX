import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { design } from '@/constants/design';
import { Icon } from './ui/Icon';

type Props = {
  title?: string;
  back?: boolean;
  actions?: ReactNode;
  maxWidth?: number;
};

export function AppPageHeader({ title, back = false, actions, maxWidth }: Props) {
  return (
    <View style={styles.frame}>
      <View style={[styles.inner, maxWidth ? { maxWidth } : undefined]}>
        <View style={styles.leading}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Буцах"
              hitSlop={8}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Icon name="chevron-back" size={24} color={design.colors.text} />
            </Pressable>
          )}
          <Text numberOfLines={1} style={styles.title}>
            {title || 'Grow'}
            {!title && <Text style={styles.accent}>X</Text>}
          </Text>
        </View>
        {!!actions && <View style={styles.actions}>{actions}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: design.colors.border,
    backgroundColor: design.colors.background,
  },
  inner: {
    width: '100%',
    maxWidth: design.layout.maxWidth,
    height: design.layout.headerHeight,
    paddingHorizontal: design.layout.pagePadding,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leading: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    flexShrink: 1,
    color: design.colors.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  accent: { color: design.colors.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 42,
    height: 42,
    marginLeft: -9,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.65 },
});
