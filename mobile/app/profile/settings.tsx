import { router, type Href } from 'expo-router';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useUser } from '@/providers/UserProvider';

const menuItems: Array<{ icon: string; label: string; route?: Href }> = [
  { icon: '♙', label: 'Хувийн мэдээлэл', route: '/profile/personal' as Href },
  { icon: '▧', label: 'Миний контент', route: '/posts' as Href },
  { icon: '▯', label: 'Хадгалсан контент', route: '/profile?saved=1' as Href },
  { icon: '▤', label: 'Миний асуулгууд', route: '/feedback' as Href },
  { icon: '▣', label: 'Миний төсөл' },
  { icon: '♧', label: 'Миний зөвлөлүүд' },
  { icon: '⚙', label: 'Тохиргоо' },
];

export default function ProfileSettingsScreen() {
  const { logout } = useUser();

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  const confirmSignOut = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Бүртгэлээс гарах уу?')) void signOut();
      return;
    }
    Alert.alert('Бүртгэлээс гарах', 'Та бүртгэлээс гарахдаа итгэлтэй байна уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Гарах', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {menuItems.map((item) => (
          <Pressable
            key={item.label}
            onPress={item.route ? () => router.push(item.route!) : undefined}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={confirmSignOut}
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
        >
          <View style={styles.iconWrap}>
            <Text style={[styles.icon, styles.signOut]}>↪</Text>
          </View>
          <Text style={[styles.label, styles.signOut]}>Гарах</Text>
          <Text style={[styles.chevron, styles.signOut]}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020B0D' },
  header: {
    height: 68,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  back: { color: '#F2F6F4', fontSize: 38, lineHeight: 40 },
  title: { flex: 1, color: '#F4F7F6', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  headerSpacer: { width: 46 },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, gap: 5 },
  menuItem: {
    minHeight: 68,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemPressed: { backgroundColor: '#0A201A' },
  iconWrap: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10261F',
  },
  icon: { color: '#EFF3F1', fontSize: 23 },
  label: { flex: 1, color: '#F0F3F2', fontSize: 16, fontWeight: '700', marginLeft: 13 },
  chevron: { color: '#AEBAB5', fontSize: 32 },
  signOut: { color: '#FF817B' },
});
