import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
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

type ApplicationType = 'BUSINESS' | 'MENTOR';
type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type AdminApplication = {
  id: string;
  type: ApplicationType;
  status: VerificationStatus;
  organizationName: string | null;
  registrationNumber: string | null;
  websiteUrl: string | null;
  expertise: string | null;
  experience: string | null;
  evidenceUrl: string;
  reviewNote: string | null;
  createdAt: string;
  user: { email: string; profile: { displayName: string | null } | null };
};

const filters: Array<{ value: VerificationStatus; label: string }> = [
  { value: 'PENDING', label: 'Хүлээгдэж буй' },
  { value: 'APPROVED', label: 'Баталсан' },
  { value: 'REJECTED', label: 'Татгалзсан' },
];

export default function AdminScreen() {
  const { user } = useUser();
  const { colors } = useColorMode();
  const [status, setStatus] = useState<VerificationStatus>('PENDING');
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const { data } = await api.get<{ applications: AdminApplication[] }>(
        `/professional/applications?status=${status}`,
      );
      setApplications(data.applications);
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Хүсэлтүүдийг авч чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [status, user?.role]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const counts = useMemo(
    () => ({
      business: applications.filter((item) => item.type === 'BUSINESS').length,
      mentor: applications.filter((item) => item.type === 'MENTOR').length,
    }),
    [applications],
  );

  const review = async (applicationId: string, nextStatus: 'APPROVED' | 'REJECTED') => {
    setBusyId(applicationId);
    setError('');
    try {
      await api.patch(`/professional/applications/${applicationId}/review`, {
        status: nextStatus,
        reviewNote: notes[applicationId]?.trim() || undefined,
      });
      setApplications((items) => items.filter((item) => item.id !== applicationId));
    } catch (value) {
      setError(getApiError(value, 'Хүсэлтийг шийдвэрлэж чадсангүй.'));
    } finally {
      setBusyId(null);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <SafeAreaView
        style={[styles.safeArea, styles.center, { backgroundColor: colors.background }]}
      >
        <Icon name="lock-closed-outline" size={38} color={colors.danger} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Admin эрх шаардлагатай</Text>
        <Pressable onPress={() => router.replace('/posts')}>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>Нүүр хуудас руу буцах</Text>
        </Pressable>
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
          <Text style={[styles.eyebrow, { color: colors.primary }]}>GROWX ADMIN</Text>
          <Text style={[styles.title, { color: colors.text }]}>Эрхийн хүсэлтүүд</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => router.push('/admin/users')}
          style={({ pressed }) => [
            styles.userManagement,
            { backgroundColor: colors.surface, borderColor: colors.primary },
            pressed && { opacity: 0.75 },
          ]}
        >
          <View style={[styles.typeIcon, { backgroundColor: colors.surfaceSoft }]}>
            <Icon name="people-outline" size={23} color={colors.primary} />
          </View>
          <View style={styles.cardHeaderCopy}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Хэрэглэгчийн эрх</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
              Хэрэглэгчид admin эрх өгөх болон цуцлах
            </Text>
          </View>
          <Icon name="chevron-forward" size={21} color={colors.primary} />
        </Pressable>

        <View style={styles.summaryRow}>
          <Summary icon="business-outline" label="Бизнес" value={counts.business} />
          <Summary icon="school-outline" label="Ментор" value={counts.mentor} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const active = filter.value === status;
            return (
              <Pressable
                key={filter.value}
                onPress={() => setStatus(filter.value)}
                style={[
                  styles.filter,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.surfaceSoft : colors.surface,
                  },
                ]}
              >
                <Text style={{ color: active ? colors.primary : colors.muted, fontWeight: '800' }}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
        {loading ? (
          <Loader size={32} style={styles.loader} />
        ) : applications.length === 0 ? (
          <View
            style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Icon name="checkmark-done-outline" size={34} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Энд хүсэлт алга</Text>
            <Text style={{ color: colors.muted }}>Сонгосон төлөвт тохирох хүсэлт олдсонгүй.</Text>
          </View>
        ) : (
          applications.map((application) => (
            <View
              key={application.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.typeIcon, { backgroundColor: colors.surfaceSoft }]}>
                  <Icon
                    name={application.type === 'BUSINESS' ? 'business-outline' : 'school-outline'}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.cardHeaderCopy}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {application.type === 'BUSINESS'
                      ? application.organizationName
                      : application.expertise}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {application.user.profile?.displayName || application.user.email} ·{' '}
                    {new Date(application.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Detail label="И-мэйл" value={application.user.email} />
              {application.type === 'BUSINESS' ? (
                <Detail label="Регистр" value={application.registrationNumber} />
              ) : (
                <Detail label="Туршлага" value={application.experience} />
              )}
              <Detail label="Website / LinkedIn" value={application.websiteUrl} />
              <Detail label="Нотлох материал" value={application.evidenceUrl} />
              {!!application.reviewNote && (
                <Detail label="Admin тайлбар" value={application.reviewNote} />
              )}

              {application.status === 'PENDING' && (
                <>
                  <TextInput
                    value={notes[application.id] ?? ''}
                    onChangeText={(value) =>
                      setNotes((current) => ({ ...current, [application.id]: value }))
                    }
                    placeholder="Шийдвэрийн тайлбар (заавал биш)"
                    placeholderTextColor={colors.muted}
                    multiline
                    style={[
                      styles.noteInput,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                  <View style={styles.actions}>
                    <Pressable
                      disabled={busyId !== null}
                      onPress={() => void review(application.id, 'REJECTED')}
                      style={[styles.action, { borderColor: colors.danger }]}
                    >
                      <Text style={{ color: colors.danger, fontWeight: '900' }}>Татгалзах</Text>
                    </Pressable>
                    <Pressable
                      disabled={busyId !== null}
                      onPress={() => void review(application.id, 'APPROVED')}
                      style={[
                        styles.action,
                        { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      {busyId === application.id ? (
                        <Loader size={18} />
                      ) : (
                        <Text style={{ color: colors.ink, fontWeight: '900' }}>Батлах</Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({
  icon,
  label,
  value,
}: {
  icon: 'business-outline' | 'school-outline';
  label: string;
  value: number;
}) {
  const { colors } = useColorMode();
  return (
    <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon name={icon} size={22} color={colors.primary} />
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
      <Text style={{ color: colors.muted }}>{label}</Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  const { colors } = useColorMode();
  if (!value) return null;
  return (
    <View style={styles.detail}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text selectable style={[styles.detailValue, { color: colors.textSecondary }]}>
        {value}
      </Text>
    </View>
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
    gap: 16,
  },
  summaryRow: { flexDirection: 'row', gap: 12 },
  userManagement: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summary: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 25, fontWeight: '900' },
  filters: { gap: 8 },
  filter: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  loader: { marginTop: 40 },
  error: { fontSize: 13, fontWeight: '700' },
  empty: { borderWidth: 1, borderRadius: 18, padding: 28, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderCopy: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  detail: { gap: 4 },
  detailLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailValue: { fontSize: 14, lineHeight: 21 },
  noteInput: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 10 },
  action: {
    flex: 1,
    minHeight: 45,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
