import type { ComponentProps } from 'react';
import { router, type Href } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useUser } from '@/providers/UserProvider';
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from '@/components/ui/Icon';
import { useAppDialog } from '@/providers/AppDialogProvider';

type IconName = ComponentProps<typeof Icon>['name'];

const menuItems: Array<{ icon: IconName; label: string; route?: Href }> = [
  { icon: 'person-outline', label: 'Хувийн мэдээлэл', route: '/profile/personal' as Href },
  {
    icon: 'shield-checkmark-outline',
    label: 'Professional tools',
    route: '/profile/professional' as Href,
  },
  { icon: 'newspaper-outline', label: 'Миний контент', route: '/posts' as Href },
  {
    icon: 'bookmark-outline',
    label: 'Хадгалсан контент',
    route: '/profile?saved=1' as Href,
  },
  { icon: 'help-circle-outline', label: 'Миний асуулгууд', route: '/feedback' as Href },
  { icon: 'folder-open-outline', label: 'Миний төсөл' },
  { icon: 'people-outline', label: 'Миний зөвлөлүүд' },
];

export default function ProfileSettingsScreen() {
  const { logout, user } = useUser();
  const { confirm } = useAppDialog();
  const { colors, isDark, toggleMode } = useColorMode();
  const styles = createStyles(isDark);

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  const confirmSignOut = async () => {
    const accepted = await confirm({
      title: 'Бүртгэлээс гарах',
      message: 'Та бүртгэлээс гарахдаа итгэлтэй байна уу?',
      cancelLabel: 'Үгүй',
      confirmLabel: 'Тийм',
      variant: 'danger',
    });
    if (accepted) await signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="chevron-back" size={23} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.themeItem}>
          <View style={styles.iconWrap}>
            <Icon
              name={isDark ? 'moon-outline' : 'sunny-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.themeCopy}>
            <Text style={[styles.label, styles.themeLabel]}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </Text>
            <Text style={styles.themeHint}>Аппын харагдах өнгийг солих</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleMode}
            trackColor={{ false: '#D9D9D4', true: '#49651D' }}
            thumbColor={isDark ? '#9AF000' : '#FFFFFF'}
          />
        </View>
        {user?.role === 'ADMIN' && (
          <Pressable onPress={() => router.push('/admin' as Href)} style={styles.menuItem}>
            <View style={styles.menuRow}>
              <View style={styles.iconWrap}>
                <Icon name="shield-outline" size={20} color={colors.primary} />
              </View>
              <Text numberOfLines={1} style={[styles.label, { color: colors.primary }]}>
                Admin удирдлага
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.primary} />
            </View>
          </Pressable>
        )}
        {menuItems.map((item) => (
          <Pressable
            key={item.label}
            onPress={item.route ? () => router.push(item.route!) : undefined}
            style={styles.menuItem}
          >
            <View style={styles.menuRow}>
              <View style={styles.iconWrap}>
                <Icon name={item.icon} size={20} color={colors.textSecondary} />
              </View>
              <Text numberOfLines={1} style={styles.label}>
                {item.label}
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.muted} />
            </View>
          </Pressable>
        ))}
        <Pressable onPress={confirmSignOut} style={styles.menuItem}>
          <View style={styles.menuRow}>
            <View style={styles.iconWrap}>
              <Icon name="log-out-outline" size={20} color={colors.danger} />
            </View>
            <Text numberOfLines={1} style={[styles.label, { color: colors.danger }]}>
              Гарах
            </Text>
            <Icon name="chevron-forward" size={18} color={colors.danger} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#020B0D' : '#FFFFFF' },
    header: {
      height: 58,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#173029' : '#D9D9D4',
    },
    backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
    title: {
      flex: 1,
      color: isDark ? '#F4F7F6' : '#111111',
      fontSize: 20,
      fontWeight: '900',
      textAlign: 'center',
    },
    headerSpacer: { width: 46 },
    scroll: { flex: 1 },
    content: {
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      paddingBottom: 24,
      gap: 3,
    },
    menuItem: {
      minHeight: 56,
      paddingHorizontal: 8,
      borderRadius: 14,
      justifyContent: 'center',
    },
    menuRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuItemPressed: { backgroundColor: isDark ? '#0A201A' : '#F2F2EF' },
    themeItem: {
      minHeight: 60,
      paddingHorizontal: 8,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    themeCopy: { flex: 1, marginLeft: 13 },
    themeLabel: { marginLeft: 0 },
    themeHint: { color: isDark ? '#899790' : '#7A7A76', fontSize: 12, marginTop: 3 },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#10261F' : '#F2F2EF',
    },
    label: {
      flex: 1,
      minWidth: 0,
      color: isDark ? '#F0F3F2' : '#111111',
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 13,
    },
  });
