import { router } from 'expo-router';
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

const lime = '#8EE817';

const menuItems = [
  { icon: '▧', label: 'Миний контент' },
  { icon: '▯', label: 'Хадгалсан контент' },
  { icon: '▣', label: 'Миний төсөл' },
  { icon: '♧', label: 'Миний зөвлөлүүд' },
  { icon: '⚙', label: 'Тохиргоо' },
  { icon: '↪', label: 'Гарах' },
];

export default function ProfileScreen() {
  const { user, logout: clearSession } = useUser();
  const logout = async () => {
    await clearSession();
    router.replace('/login');
  };
  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Энэ төхөөрөмж дээрх хадгалсан нэвтрэлтийг цэвэрлэж гарах уу?'))
        void logout();
      return;
    }
    Alert.alert('Бүртгэлээс гарах', 'Энэ төхөөрөмж дээрх хадгалсан нэвтрэлтийг цэвэрлэх үү?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Гарах', style: 'destructive', onPress: () => void logout() },
    ]);
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityLabel="Тохиргоо" hitSlop={12} style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <View style={styles.hair} />
            <View style={styles.face} />
            <View style={styles.ears} />
            <View style={styles.neck} />
            <View style={styles.suit} />
            <View style={styles.shirt} />
            <View style={styles.tie} />
          </View>
          <Text style={styles.name}>{user?.displayName ?? 'GrowX хэрэглэгч'}</Text>
          <Text style={styles.role}>Startup Founder</Text>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.accountIcon}>
            <Text style={styles.accountIconText}>✉</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountLabel}>Нэвтэрсэн бүртгэл</Text>
            <Text numberOfLines={1} style={styles.accountEmail}>
              {user?.email ?? 'И-мэйл ачаалж байна...'}
            </Text>
          </View>
          <View style={styles.activeDot} />
        </View>

        <View style={styles.stats}>
          <Stat value="23" label="Нийтлэл" />
          <Stat value="156" label="Дагагч" />
          <Stat value="89" label="Дагадаг" />
        </View>

        <View style={styles.divider} />

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.label === 'Гарах' ? confirmLogout : undefined}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={styles.menuIconWrap}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={[styles.menuLabel, item.label === 'Гарах' && styles.logoutLabel]}>
                {item.label}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem icon="⌂" label="Нүүр" onPress={() => router.replace('/home')} />
        <NavItem icon="⌘" label="Мэдлэг" onPress={() => router.push('/medlege')} />
        <Pressable style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </Pressable>
        <NavItem icon="◯" label="Мессеж" onPress={() => router.push('/messages')} />
        <NavItem icon="♙" label="Профайл" active onPress={() => router.replace('/profile')} />
      </View>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#02110D' },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 116,
    backgroundColor: '#02110D',
  },
  settingsButton: {
    position: 'absolute',
    zIndex: 3,
    right: 27,
    top: 22,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { color: '#F4F7F5', fontSize: 27 },
  profileHeader: { alignItems: 'center' },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#DCE1DF',
    borderWidth: 3,
    borderColor: '#F0F3F2',
  },
  hair: {
    position: 'absolute',
    zIndex: 4,
    top: 15,
    width: 55,
    height: 27,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 22,
    backgroundColor: '#191614',
    transform: [{ rotate: '-3deg' }],
  },
  face: {
    position: 'absolute',
    zIndex: 3,
    top: 27,
    width: 49,
    height: 55,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: '#D89A73',
  },
  ears: {
    position: 'absolute',
    zIndex: 2,
    top: 48,
    width: 59,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C98664',
  },
  neck: {
    position: 'absolute',
    zIndex: 2,
    top: 75,
    width: 19,
    height: 18,
    backgroundColor: '#C98664',
  },
  suit: {
    position: 'absolute',
    bottom: -18,
    width: 108,
    height: 58,
    borderTopLeftRadius: 39,
    borderTopRightRadius: 39,
    backgroundColor: '#11192A',
  },
  shirt: {
    position: 'absolute',
    zIndex: 2,
    bottom: 0,
    width: 28,
    height: 38,
    backgroundColor: '#F2F3F3',
    transform: [{ rotate: '45deg' }],
  },
  tie: {
    position: 'absolute',
    zIndex: 3,
    bottom: 0,
    width: 8,
    height: 28,
    backgroundColor: '#20283A',
  },
  name: { color: '#F6F8F7', fontSize: 26, fontWeight: '800', marginTop: 17, letterSpacing: -0.4 },
  role: { color: '#9AA5A1', fontSize: 15, fontWeight: '500', marginTop: 6 },
  accountCard: {
    height: 70,
    marginTop: 24,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#17382C',
    backgroundColor: '#071A14',
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#112B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconText: { color: lime, fontSize: 18 },
  accountCopy: { flex: 1, marginLeft: 12 },
  accountLabel: { color: '#87958F', fontSize: 11, fontWeight: '600' },
  accountEmail: { color: '#F0F5F2', fontSize: 14, fontWeight: '700', marginTop: 4 },
  activeDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: lime },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 34,
    paddingHorizontal: 12,
  },
  stat: { minWidth: 75, alignItems: 'center' },
  statValue: { color: '#F3F6F5', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#A0AAA7', fontSize: 14, fontWeight: '600', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#173028', marginTop: 30, marginBottom: 18 },
  menu: { gap: 2 },
  menuItem: {
    height: 67,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 5,
  },
  menuItemPressed: { backgroundColor: '#092019' },
  menuIconWrap: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { color: '#EFF3F1', fontSize: 27 },
  menuLabel: { flex: 1, color: '#F0F3F2', fontSize: 17, fontWeight: '700', marginLeft: 9 },
  logoutLabel: { color: '#FF7777' },
  chevron: { color: '#B8C1BE', fontSize: 35, fontWeight: '300', marginRight: 3, marginTop: -3 },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 94,
    paddingBottom: 9,
    backgroundColor: '#061712',
    borderTopWidth: 1,
    borderTopColor: '#132822',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { width: 69, alignItems: 'center', gap: 4 },
  navIcon: { color: '#E0E6E3', fontSize: 29, lineHeight: 31 },
  navLabel: { color: '#C5CECA', fontSize: 12, fontWeight: '600' },
  navActive: { color: lime },
  addButton: {
    width: 61,
    height: 61,
    borderRadius: 31,
    marginTop: -27,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#061712',
  },
  addIcon: { color: '#142000', fontSize: 38, lineHeight: 40, fontWeight: '300' },
});
