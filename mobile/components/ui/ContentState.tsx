import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { design } from '@/constants/design';
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from './Icon';
import { Loader } from './Loader';

type EmptyStateProps = {
  icon?: React.ComponentProps<typeof Icon>['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useColorMode();
  return (
    <View style={[styles.empty, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSoft }]}>
        <Icon name={icon} size={25} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {!!description && (
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      )}
      {!!actionLabel && !!onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.actionText, { color: colors.ink }]}>{actionLabel}</Text>
          <Icon name="arrow-forward" size={16} color={colors.ink} />
        </Pressable>
      )}
    </View>
  );
}

export function LoadingState({ label = 'Уншиж байна...' }: { label?: string }) {
  const { colors } = useColorMode();
  return (
    <View style={styles.loading} accessibilityRole="progressbar">
      <View style={styles.loadingIcon}>
        <Loader size={34} />
      </View>
      <Text style={[styles.loadingLabel, { color: colors.muted }]}>{label}</Text>
      <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.skeletonAvatar, { backgroundColor: colors.surfaceSoft }]} />
        <View style={styles.skeletonCopy}>
          <View style={[styles.skeletonLineWide, { backgroundColor: colors.surfaceSoft }]} />
          <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceRaised }]} />
        </View>
      </View>
      <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.skeletonAvatar, { backgroundColor: colors.surfaceSoft }]} />
        <View style={styles.skeletonCopy}>
          <View style={[styles.skeletonLineWide, { backgroundColor: colors.surfaceSoft }]} />
          <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceRaised }]} />
        </View>
      </View>
    </View>
  );
}

function SkeletonBlock({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const { colors } = useColorMode();
  const opacity = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 720, useNativeDriver }),
        Animated.timing(opacity, { toValue: 0.42, duration: 720, useNativeDriver }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.skeletonBlock, style, { backgroundColor: colors.surfaceSoft, opacity }]}
    />
  );
}

export function ProfileSkeleton() {
  const { colors } = useColorMode();
  return (
    <View style={styles.profileSkeleton} accessibilityRole="progressbar">
      <View style={[styles.profileSkeletonCard, { backgroundColor: colors.surface }]}>
        <SkeletonBlock style={styles.profileSkeletonAvatar} />
        <SkeletonBlock style={styles.profileSkeletonName} />
        <SkeletonBlock style={styles.profileSkeletonHandle} />
        <View style={styles.profileSkeletonBadges}>
          <SkeletonBlock style={styles.profileSkeletonBadge} />
          <SkeletonBlock style={styles.profileSkeletonBadgeSmall} />
        </View>
        <SkeletonBlock style={styles.profileSkeletonBio} />
        <SkeletonBlock style={styles.profileSkeletonButton} />
        <View style={[styles.profileSkeletonStats, { backgroundColor: colors.surfaceRaised }]}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={styles.profileSkeletonStat}>
              <SkeletonBlock style={styles.profileSkeletonStatValue} />
              <SkeletonBlock style={styles.profileSkeletonStatLabel} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.profileSkeletonHeading}>
        <SkeletonBlock style={styles.profileSkeletonTitle} />
        <SkeletonBlock style={styles.profileSkeletonLink} />
      </View>
      <SkeletonBlock style={styles.profileSkeletonTabs} />
      <View style={[styles.profileSkeletonPost, { backgroundColor: colors.surface }]}>
        <View style={styles.profileSkeletonPostHeader}>
          <SkeletonBlock style={styles.profileSkeletonPostAvatar} />
          <View style={styles.profileSkeletonPostCopy}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLine} />
          </View>
        </View>
        <SkeletonBlock style={styles.profileSkeletonPostLine} />
        <SkeletonBlock style={styles.profileSkeletonPostLineShort} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    width: '100%',
    minHeight: 220,
    padding: 28,
    borderRadius: design.radius.card,
    backgroundColor: design.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: design.colors.surfaceSoft,
  },
  title: {
    marginTop: 14,
    color: design.colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    maxWidth: 360,
    marginTop: 7,
    color: design.colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  action: {
    minHeight: 40,
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: design.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionText: { color: design.colors.ink, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  loading: {
    flex: 1,
    width: '100%',
    maxWidth: design.layout.feedWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: design.layout.pagePadding,
  },
  loadingIcon: { height: 38, alignItems: 'center', justifyContent: 'center' },
  loadingLabel: {
    marginBottom: 18,
    color: design.colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  skeletonCard: {
    height: 76,
    marginBottom: 9,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: design.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: design.colors.surfaceSoft,
  },
  skeletonCopy: { flex: 1, marginLeft: 12, gap: 9 },
  skeletonLineWide: {
    width: '72%',
    height: 10,
    borderRadius: 5,
    backgroundColor: design.colors.surfaceSoft,
  },
  skeletonLine: {
    width: '42%',
    height: 8,
    borderRadius: 4,
    backgroundColor: design.colors.surfaceRaised,
  },
  skeletonBlock: { backgroundColor: design.colors.surfaceSoft },
  profileSkeleton: {
    flex: 1,
    width: '100%',
    maxWidth: design.layout.feedWidth,
    alignSelf: 'center',
    padding: design.layout.pagePadding,
  },
  profileSkeletonCard: {
    width: '100%',
    padding: 24,
    borderRadius: design.radius.hero,
    backgroundColor: design.colors.surface,
    alignItems: 'center',
  },
  profileSkeletonAvatar: { width: 96, height: 96, borderRadius: 48 },
  profileSkeletonName: { width: 168, height: 20, borderRadius: 10, marginTop: 16 },
  profileSkeletonHandle: { width: 92, height: 9, borderRadius: 5, marginTop: 9 },
  profileSkeletonBadges: { flexDirection: 'row', gap: 7, marginTop: 13 },
  profileSkeletonBadge: { width: 108, height: 27, borderRadius: 14 },
  profileSkeletonBadgeSmall: { width: 70, height: 27, borderRadius: 14 },
  profileSkeletonBio: { width: '68%', maxWidth: 320, height: 10, borderRadius: 5, marginTop: 16 },
  profileSkeletonButton: { width: 132, height: 40, borderRadius: 20, marginTop: 19 },
  profileSkeletonStats: {
    width: '100%',
    maxWidth: 430,
    height: 78,
    marginTop: 22,
    borderRadius: 18,
    backgroundColor: design.colors.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSkeletonStat: { flex: 1, alignItems: 'center', gap: 8 },
  profileSkeletonStatValue: { width: 30, height: 17, borderRadius: 8 },
  profileSkeletonStatLabel: { width: 54, height: 8, borderRadius: 4 },
  profileSkeletonHeading: {
    marginTop: 25,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSkeletonTitle: { width: 90, height: 17, borderRadius: 8 },
  profileSkeletonLink: { width: 58, height: 10, borderRadius: 5 },
  profileSkeletonTabs: { width: '100%', height: 42, borderRadius: 14, marginTop: 15 },
  profileSkeletonPost: {
    marginTop: 12,
    padding: 16,
    borderRadius: design.radius.card,
    backgroundColor: design.colors.surface,
  },
  profileSkeletonPostHeader: { flexDirection: 'row', alignItems: 'center' },
  profileSkeletonPostAvatar: { width: 42, height: 42, borderRadius: 21 },
  profileSkeletonPostCopy: { flex: 1, marginLeft: 12, gap: 8 },
  profileSkeletonPostLine: { width: '94%', height: 10, borderRadius: 5, marginTop: 18 },
  profileSkeletonPostLineShort: { width: '62%', height: 10, borderRadius: 5, marginTop: 9 },
});
