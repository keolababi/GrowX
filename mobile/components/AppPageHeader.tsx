import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { design } from '@/constants/design';
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from './ui/Icon';

type Props = {
  title?: string;
  back?: boolean;
  backFallback?: Href;
  actions?: ReactNode;
  maxWidth?: number;
  prominent?: boolean;
};

export function AppPageHeader({
  title,
  back = false,
  backFallback = '/posts',
  actions,
  maxWidth,
  prominent = false,
}: Props) {
  const { colors } = useColorMode();
  const { width } = useWindowDimensions();
  const compact = width <= 480;
  return (
    <View
      style={[
        styles.frame,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.inner,
          prominent && styles.innerProminent,
          compact && styles.innerCompact,
          compact && prominent && styles.innerProminentCompact,
          maxWidth ? { maxWidth } : undefined,
        ]}
      >
        <View style={styles.leading}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Буцах"
              hitSlop={8}
              onPress={() => (router.canGoBack() ? router.back() : router.replace(backFallback))}
              style={styles.iconButton}
            >
              <Icon name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          )}
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              prominent && styles.titleProminent,
              compact && styles.titleCompact,
              compact && prominent && styles.titleProminentCompact,
              { color: colors.text },
            ]}
          >
            {title || 'Grow'}
            {!title && <Text style={[styles.accent, { color: colors.primary }]}>X</Text>}
          </Text>
        </View>
        {!!actions && (
          <View style={[styles.actions, prominent && styles.actionsProminent]}>{actions}</View>
        )}
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
  innerProminent: { height: 78 },
  innerCompact: { height: 62, paddingHorizontal: 16 },
  innerProminentCompact: { height: 68 },
  leading: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    flexShrink: 1,
    color: design.colors.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  titleProminent: { fontSize: 32, lineHeight: 38, letterSpacing: -1.4 },
  titleCompact: { fontSize: 23, lineHeight: 28 },
  titleProminentCompact: { fontSize: 28, lineHeight: 34, letterSpacing: -1 },
  accent: { color: design.colors.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionsProminent: { gap: 6 },
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
