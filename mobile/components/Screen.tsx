import type { PropsWithChildren, ReactNode } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GrowXLogo } from './GrowXLogo';
import { design } from '@/constants/design';

export const colors = {
  background: design.colors.background,
  surface: design.colors.surface,
  border: design.colors.border,
  muted: design.colors.muted,
  lime: design.colors.primary,
  limeDark: '#62B900',
};

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return <GrowXLogo compact={compact} appearance="dark" />;
}

export function AuthHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle: string;
  back?: ReactNode;
}) {
  return (
    <>
      <View style={styles.topbar}>
        {back}
        <Logo compact />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },
  topbar: { minHeight: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 26,
  },
});
