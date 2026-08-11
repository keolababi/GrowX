import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { useColorMode } from '@/providers/ColorModeProvider';
import { useUser } from '@/providers/UserProvider';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import { useAppDialog } from '@/providers/AppDialogProvider';

type UserRole = 'USER' | 'ADMIN';
type ManagedUser = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  isMe: boolean;
};

export default function AdminUsersScreen() {
  const { user } = useUser();
  const { confirm } = useAppDialog();
  const { colors } = useColorMode();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(
    async (search: string) => {
      if (user?.role !== 'ADMIN') return;
      setLoading(true);
      setError('');
      try {
        const params = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
        const { data } = await api.get<{ users: ManagedUser[] }>(`/admin/users${params}`);
        setUsers(data.users);
      } catch (value) {
        setError(getApiError(value, 'Хэрэглэгчдийг авч чадсангүй.'));
      } finally {
        setLoading(false);
      }
    },
    [user?.role],
  );

  useFocusEffect(
    useCallback(() => {
      void load('');
    }, [load]),
  );

  const updateRole = async (target: ManagedUser, role: UserRole) => {
    setBusyId(target.id);
    setError('');
    try {
      const { data } = await api.patch<{ user: { id: string; role: UserRole } }>(
        `/admin/users/${target.id}/role`,
        { role },
      );
      setUsers((items) =>
        items.map((item) => (item.id === target.id ? { ...item, role: data.user.role } : item)),
      );
    } catch (value) {
      setError(getApiError(value, 'Хэрэглэгчийн эрхийг өөрчилж чадсангүй.'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmRoleChange = async (target: ManagedUser) => {
    if (target.isMe) return;
    const nextRole: UserRole = target.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const name = target.displayName || target.email;
    const title = nextRole === 'ADMIN' ? 'Admin эрх өгөх' : 'Admin эрх цуцлах';
    const message =
      nextRole === 'ADMIN'
        ? `${name} хэрэглэгчид admin эрх өгөх үү?`
        : `${name} хэрэглэгчийн admin эрхийг цуцлах уу?`;

    const accepted = await confirm({
      title,
      message,
      confirmLabel: nextRole === 'ADMIN' ? 'Эрх өгөх' : 'Цуцлах',
      variant: nextRole === 'ADMIN' ? 'default' : 'danger',
    });
    if (accepted) await updateRole(target, nextRole);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <SafeAreaView
        style={[styles.safeArea, styles.center, { backgroundColor: colors.background }]}
      >
        <Icon name="lock-closed-outline" size={38} color={colors.danger} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Admin эрх шаардлагатай</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="chevron-back" size={27} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>ADMIN ACCESS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Хэрэглэгчийн эрх</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View
          style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Icon name="search-outline" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void load(query)}
            placeholder="Нэр эсвэл и-мэйлээр хайх"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
          />
          <Pressable onPress={() => void load(query)} style={styles.searchButton}>
            <Text style={{ color: colors.ink, fontWeight: '900' }}>Хайх</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Бүх хэрэглэгч</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{users.length} хэрэглэгч</Text>
        </View>

        {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
        {loading ? (
          <Loader size={32} style={styles.loader} />
        ) : users.length === 0 ? (
          <View style={styles.centeredMessage}>
            <Icon name="person-outline" size={32} color={colors.muted} />
            <Text style={{ color: colors.muted }}>Хэрэглэгч олдсонгүй.</Text>
          </View>
        ) : (
          users.map((managedUser) => {
            const isAdmin = managedUser.role === 'ADMIN';
            return (
              <View
                key={managedUser.id}
                style={[
                  styles.userCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {managedUser.avatarUrl ? (
                  <Image source={{ uri: managedUser.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarFallback,
                      { backgroundColor: colors.surfaceSoft },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {(managedUser.displayName || managedUser.email).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userCopy}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={[styles.userName, { color: colors.text }]}>
                      {managedUser.displayName || managedUser.email.split('@')[0]}
                    </Text>
                    {isAdmin && (
                      <View style={[styles.adminBadge, { backgroundColor: colors.surfaceSoft }]}>
                        <Icon name="shield-checkmark-outline" size={12} color={colors.primary} />
                        <Text style={[styles.adminBadgeText, { color: colors.primary }]}>
                          ADMIN
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>
                    {managedUser.email}
                    {managedUser.isMe ? ' · Та' : ''}
                  </Text>
                </View>
                <Pressable
                  disabled={managedUser.isMe || busyId !== null}
                  onPress={() => confirmRoleChange(managedUser)}
                  style={[
                    styles.roleButton,
                    {
                      borderColor: isAdmin ? colors.danger : colors.primary,
                      backgroundColor: isAdmin ? 'transparent' : colors.primary,
                    },
                    managedUser.isMe && { opacity: 0.35 },
                  ]}
                >
                  {busyId === managedUser.id ? (
                    <Loader size={17} />
                  ) : (
                    <Text
                      style={{
                        color: isAdmin ? colors.danger : colors.ink,
                        fontSize: 12,
                        fontWeight: '900',
                      }}
                    >
                      {managedUser.isMe ? 'Таны эрх' : isAdmin ? 'Эрх цуцлах' : 'Admin болгох'}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  deniedTitle: { fontSize: 20, fontWeight: '900' },
  header: {
    minHeight: 72,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 50,
    gap: 14,
  },
  search: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 14 },
  searchButton: {
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9AF000',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  error: { fontSize: 13, fontWeight: '700' },
  loader: { marginTop: 40 },
  centeredMessage: { paddingVertical: 42, alignItems: 'center', gap: 10 },
  userCard: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900' },
  userCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { flexShrink: 1, fontSize: 14, fontWeight: '900' },
  adminBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  adminBadgeText: { fontSize: 9, fontWeight: '900' },
  roleButton: {
    minHeight: 38,
    minWidth: 88,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
