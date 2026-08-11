import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
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
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';

type ApplicationType = 'BUSINESS' | 'MENTOR';
type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type ProfessionalApplication = {
  id: string;
  type: ApplicationType;
  status: VerificationStatus;
  reviewNote: string | null;
  createdAt: string;
};

const lime = '#9AF000';
const ink = '#0B1605';

const statusCopy: Record<VerificationStatus, string> = {
  PENDING: 'Шалгаж байна',
  APPROVED: 'Баталгаажсан',
  REJECTED: 'Татгалзсан',
};

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export default function ProfessionalToolsScreen() {
  const { colors, isDark } = useColorMode();
  const accent = isDark ? lime : colors.primary;
  const accentInk = isDark ? ink : colors.ink;
  const [applications, setApplications] = useState<ProfessionalApplication[]>([]);
  const [selectedType, setSelectedType] = useState<ApplicationType | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [expertise, setExpertise] = useState('');
  const [experience, setExperience] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ applications: ProfessionalApplication[] }>(
        '/professional/applications/me',
      );
      setApplications(data.applications);
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Хүсэлтийн төлөвийг авч чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const applicationsByType = useMemo(
    () => new Map(applications.map((application) => [application.type, application])),
    [applications],
  );

  const openForm = (type: ApplicationType) => {
    const current = applicationsByType.get(type);
    if (current?.status === 'PENDING' || current?.status === 'APPROVED') return;
    setSelectedType(type);
    setConfirmed(false);
    setError('');
    setSuccess('');
  };

  const closeForm = () => {
    setSelectedType(null);
    setConfirmed(false);
    setError('');
  };

  const submit = async () => {
    if (!selectedType || !confirmed) {
      setError('Мэдээлэл үнэн зөв болохыг батална уу.');
      return;
    }
    if (selectedType === 'BUSINESS' && (!organizationName.trim() || !registrationNumber.trim())) {
      setError('Байгууллагын нэр болон регистрийн дугаарыг оруулна уу.');
      return;
    }
    if (selectedType === 'MENTOR' && (!expertise.trim() || experience.trim().length < 20)) {
      setError('Мэргэшсэн чиглэл болон туршлагаа дэлгэрэнгүй оруулна уу.');
      return;
    }
    if (!evidenceUrl.trim()) {
      setError('Баталгаажуулах материалын холбоос оруулна уу.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/professional/applications', {
        type: selectedType,
        organizationName: selectedType === 'BUSINESS' ? organizationName.trim() : undefined,
        registrationNumber: selectedType === 'BUSINESS' ? registrationNumber.trim() : undefined,
        expertise: selectedType === 'MENTOR' ? expertise.trim() : undefined,
        experience: selectedType === 'MENTOR' ? experience.trim() : undefined,
        websiteUrl: websiteUrl.trim() ? normalizeUrl(websiteUrl) : undefined,
        evidenceUrl: normalizeUrl(evidenceUrl),
      });
      await load();
      setSelectedType(null);
      setConfirmed(false);
      setSuccess('Хүсэлт амжилттай илгээгдлээ. GrowX баг шалгасны дараа мэдэгдэнэ.');
    } catch (value) {
      setError(getApiError(value, 'Хүсэлт илгээж чадсангүй.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Icon name="chevron-back" size={27} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Professional tools</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={[styles.eyebrow, { color: accent }]}>GROWX VERIFIED</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Мэргэжлийн эрхээ баталгаажуулах
            </Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              Бизнес болон ментор эрхийг GrowX баг шалгаж баталгаажуулсны дараа профайл дээр badge
              харагдана.
            </Text>
          </View>

          {loading ? (
            <Loader size={30} style={styles.loader} />
          ) : (
            <View style={styles.cards}>
              <ApplicationCard
                type="BUSINESS"
                icon="business-outline"
                title="Бизнес профайл"
                description="Байгууллагын нэрээр контент нийтэлж, бүтээгдэхүүн үйлчилгээгээ танилцуулна."
                application={applicationsByType.get('BUSINESS')}
                onPress={() => openForm('BUSINESS')}
              />
              <ApplicationCard
                type="MENTOR"
                icon="school-outline"
                title="Ментор болох"
                description="Туршлага, мэргэшлээ баталгаажуулж GrowX-ийн mentor badge авна."
                application={applicationsByType.get('MENTOR')}
                onPress={() => openForm('MENTOR')}
              />
            </View>
          )}

          {!!success && (
            <View style={[styles.notice, { backgroundColor: colors.surfaceSoft }]}>
              <Icon name="checkmark-circle-outline" size={20} color={accent} />
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{success}</Text>
            </View>
          )}

          {selectedType && (
            <View
              style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.formHeader}>
                <View>
                  <Text style={[styles.formEyebrow, { color: accent }]}>APPLICATION</Text>
                  <Text style={[styles.formTitle, { color: colors.text }]}>
                    {selectedType === 'BUSINESS' ? 'Бизнесээ баталгаажуулах' : 'Менторын хүсэлт'}
                  </Text>
                </View>
                <Pressable onPress={closeForm} hitSlop={8}>
                  <Icon name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>

              {selectedType === 'BUSINESS' ? (
                <>
                  <FormField
                    label="Байгууллагын албан ёсны нэр"
                    value={organizationName}
                    onChangeText={setOrganizationName}
                    placeholder="Жишээ: GrowX LLC"
                  />
                  <FormField
                    label="Регистрийн дугаар"
                    value={registrationNumber}
                    onChangeText={setRegistrationNumber}
                    placeholder="Байгууллагын регистр"
                  />
                </>
              ) : (
                <>
                  <FormField
                    label="Мэргэшсэн чиглэл"
                    value={expertise}
                    onChangeText={setExpertise}
                    placeholder="Жишээ: Product management"
                  />
                  <FormField
                    label="Ажлын туршлага"
                    value={experience}
                    onChangeText={setExperience}
                    placeholder="Туршлага, амжилт, ментор хийх чиглэлээ бичнэ үү"
                    multiline
                  />
                </>
              )}

              <FormField
                label={
                  selectedType === 'BUSINESS' ? 'Website (заавал биш)' : 'LinkedIn (заавал биш)'
                }
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
              />
              <FormField
                label="Баталгаажуулах материалын холбоос"
                value={evidenceUrl}
                onChangeText={setEvidenceUrl}
                placeholder="Google Drive, website эсвэл portfolio link"
                autoCapitalize="none"
                keyboardType="url"
              />

              <Pressable onPress={() => setConfirmed((value) => !value)} style={styles.confirmRow}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: confirmed ? accent : colors.borderStrong },
                    confirmed && { backgroundColor: accent },
                  ]}
                >
                  {confirmed && <Icon name="checkmark" size={15} color={accentInk} />}
                </View>
                <Text style={[styles.confirmText, { color: colors.textSecondary }]}>
                  Миний оруулсан мэдээлэл үнэн зөв бөгөөд GrowX баг шалгахыг зөвшөөрч байна.
                </Text>
              </Pressable>

              {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
              <Pressable
                disabled={submitting}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.submitButton,
                  { backgroundColor: accent },
                  submitting && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                {submitting ? (
                  <Loader size={20} />
                ) : (
                  <>
                    <Text style={[styles.submitText, { color: accentInk }]}>Хүсэлт илгээх</Text>
                    <Icon name="arrow-forward" size={19} color={accentInk} />
                  </>
                )}
              </Pressable>
            </View>
          )}

          {!!error && !selectedType && (
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          )}
          <Text style={[styles.privacy, { color: colors.muted }]}>
            Таны баталгаажуулах материалыг зөвхөн хүсэлт шалгах зорилгоор ашиглана.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ApplicationCard({
  icon,
  title,
  description,
  application,
  onPress,
}: {
  type: ApplicationType;
  icon: ComponentProps<typeof Icon>['name'];
  title: string;
  description: string;
  application?: ProfessionalApplication;
  onPress: () => void;
}) {
  const { colors, isDark } = useColorMode();
  const accent = isDark ? lime : colors.primary;
  const accentInk = isDark ? ink : colors.ink;
  const disabled = application?.status === 'PENDING' || application?.status === 'APPROVED';
  const actionLabel = application
    ? application.status === 'REJECTED'
      ? 'Дахин хүсэлт илгээх'
      : statusCopy[application.status]
    : 'Эхлэх';
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: colors.surfaceSoft }]}>
          <Icon name={icon} size={24} color={accent} />
        </View>
        {application && <StatusPill status={application.status} />}
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.cardDescription, { color: colors.muted }]}>{description}</Text>
      {!!application?.reviewNote && (
        <Text style={[styles.reviewNote, { color: colors.textSecondary }]}>
          Тайлбар: {application.reviewNote}
        </Text>
      )}
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardButton,
          { backgroundColor: accent },
          disabled && { backgroundColor: colors.surfaceSoft },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text
          style={[styles.cardButtonText, { color: accentInk }, disabled && { color: colors.muted }]}
        >
          {actionLabel}
        </Text>
        {!disabled && <Icon name="chevron-forward" size={18} color={accentInk} />}
      </Pressable>
    </View>
  );
}

function StatusPill({ status }: { status: VerificationStatus }) {
  const { colors, isDark } = useColorMode();
  const accent = isDark ? lime : colors.primary;
  const statusColor =
    status === 'APPROVED' ? accent : status === 'REJECTED' ? colors.danger : '#B7791F';
  return (
    <View style={[styles.statusPill, { borderColor: statusColor }]}>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <Text style={[styles.statusText, { color: statusColor }]}>{statusCopy[status]}</Text>
    </View>
  );
}

function FormField(props: ComponentProps<typeof TextInput> & { label: string }) {
  const { label, multiline, ...inputProps } = props;
  const { colors, isDark } = useColorMode();
  const accent = isDark ? lime : colors.primary;
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        cursorColor={accent}
        selectionColor={accent}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
          multiline && styles.multilineInput,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboard: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, paddingBottom: 50 },
  intro: { marginBottom: 24 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { fontSize: 27, fontWeight: '900', letterSpacing: -0.7, marginTop: 7 },
  description: { maxWidth: 580, fontSize: 14, lineHeight: 21, marginTop: 9 },
  loader: { paddingVertical: 60 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    minHeight: 260,
    padding: 18,
    borderWidth: 1,
    borderRadius: 22,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 19, fontWeight: '900', marginTop: 20 },
  cardDescription: { flex: 1, fontSize: 13, lineHeight: 19, marginTop: 8 },
  reviewNote: { fontSize: 12, lineHeight: 18, marginTop: 9 },
  cardButton: {
    minHeight: 47,
    paddingHorizontal: 16,
    marginTop: 18,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  cardButtonText: { fontSize: 13, fontWeight: '900' },
  statusPill: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 15,
    marginTop: 16,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  form: { marginTop: 18, padding: 18, borderWidth: 1, borderRadius: 22, gap: 14 },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  formEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  formTitle: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  input: {
    minHeight: 49,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  multilineInput: { minHeight: 110, textAlignVertical: 'top' },
  confirmRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { flex: 1, fontSize: 12, lineHeight: 18 },
  error: { fontSize: 12, lineHeight: 18 },
  submitButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: { fontSize: 14, fontWeight: '900' },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.82 },
  privacy: { textAlign: 'center', fontSize: 10, lineHeight: 16, marginTop: 18 },
});
