import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Image,
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
import { api } from '@/services/api';
import { uploadMedia, type LocalUploadAsset } from '@/services/blob';
import { useUser } from '@/providers/UserProvider';
import { getApiError } from '@/utils/auth';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { User } from '@/types/auth';

type AccountType = 'PERSONAL' | 'BUSINESS';

const lime = '#8EE817';

export default function PersonalInformationScreen() {
  const { user, refreshUser } = useUser();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [services, setServices] = useState('');
  const [avatar, setAvatar] = useState<LocalUploadAsset | null>(null);
  const [cover, setCover] = useState<LocalUploadAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
    setBio(user?.bio ?? '');
    setPhone(user?.phone ?? '');
    setCompany(user?.company ?? '');
    setAccountType(user?.accountType ?? 'PERSONAL');
    setIndustry(user?.industry ?? '');
    setLocation(user?.location ?? '');
    setServices(user?.services ?? '');
  }, [user]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setAvatar({
      uri: asset.uri,
      name: asset.fileName || `profile-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      file: asset.file,
    });
    setSuccess('');
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setCover({
      uri: asset.uri,
      name: asset.fileName || `cover-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      file: asset.file,
    });
    setSuccess('');
  };

  const save = async () => {
    if (!displayName.trim()) {
      setError('Нэрээ оруулна уу.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let avatarUrl = user?.avatarUrl ?? null;
      if (avatar) {
        const uploaded = await uploadMedia(avatar, 'image');
        avatarUrl = uploaded.url;
      }
      let coverUrl = user?.coverUrl ?? null;
      if (cover) {
        const uploaded = await uploadMedia(cover, 'image');
        coverUrl = uploaded.url;
      }
      await api.patch<{ user: User }>('/auth/me', {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        accountType,
        coverUrl,
        industry: accountType === 'BUSINESS' ? industry.trim() || null : null,
        location: accountType === 'BUSINESS' ? location.trim() || null : null,
        services: accountType === 'BUSINESS' ? services.trim() || null : null,
        avatarUrl,
      });
      await refreshUser();
      setAvatar(null);
      setCover(null);
      setSuccess('Хувийн мэдээлэл хадгалагдлаа.');
    } catch (value) {
      setError(getApiError(value, 'Хувийн мэдээллийг хадгалж чадсангүй.'));
    } finally {
      setSaving(false);
    }
  };

  const avatarUri = avatar?.uri || user?.avatarUrl;
  const coverUri = cover?.uri || user?.coverUrl;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Хувийн мэдээлэл</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <SegmentedControl
            options={['Хувийн профайл', 'Бизнес профайл']}
            selectedIndex={accountType === 'BUSINESS' ? 1 : 0}
            onChange={(index) => setAccountType(index === 1 ? 'BUSINESS' : 'PERSONAL')}
          />

          {accountType === 'BUSINESS' && (
            <Pressable onPress={() => void pickCover()} style={styles.coverCard}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Text style={styles.rowHint}>Нүүр зураг нэмэх</Text>
                </View>
              )}
            </Pressable>
          )}

          <Pressable onPress={() => void pickAvatar()} style={styles.avatarCard}>
            <View style={styles.rowIcon}>
              <Text style={styles.rowIconText}>♙</Text>
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowLabel}>Профайл зураг</Text>
              <Text style={styles.rowHint}>Зураг солихын тулд дарна уу</Text>
            </View>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {(displayName || user?.email || 'G').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Field
            icon="♙"
            label="Нэр"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Таны нэр"
          />
          <Field
            icon="▧"
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Жишээ: Startup Founder"
            multiline
            maxLength={500}
          />
          <Field
            icon="☎"
            label="Утасны дугаар"
            value={phone}
            onChangeText={setPhone}
            placeholder="+976 9900 1234"
            keyboardType="phone-pad"
            maxLength={30}
          />
          <Field
            icon="▣"
            label={accountType === 'BUSINESS' ? 'Бизнесийн нэр' : 'Хаана ажилладаг'}
            value={company}
            onChangeText={setCompany}
            placeholder="Жишээ: GrowX LLC"
            maxLength={120}
          />

          {accountType === 'BUSINESS' && (
            <>
              <Field
                icon="◆"
                label="Салбар"
                value={industry}
                onChangeText={setIndustry}
                placeholder="Жишээ: Fintech"
                maxLength={120}
              />
              <Field
                icon="⌖"
                label="Байршил"
                value={location}
                onChangeText={setLocation}
                placeholder="Жишээ: Улаанбаатар"
                maxLength={120}
              />
              <Field
                icon="▤"
                label="Үйлчилгээ"
                value={services}
                onChangeText={setServices}
                placeholder="Санал болгож буй үйлчилгээгээ бичнэ үү"
                multiline
                maxLength={2000}
              />
            </>
          )}

          <View style={styles.emailCard}>
            <Text style={styles.emailLabel}>И-мэйл</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!success && <Text style={styles.success}>{success}</Text>}

          <Pressable
            disabled={saving}
            onPress={() => void save()}
            style={({ pressed }) => [
              styles.saveButton,
              saving && styles.saveDisabled,
              pressed && styles.savePressed,
            ]}
          >
            <Text style={styles.saveText}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</Text>
          </Pressable>

          <Text style={styles.note}>Та өөрийн хувийн мэдээллийг хүссэн үедээ шинэчилж болно.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  icon,
  label,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { icon: string; label: string }) {
  return (
    <View style={styles.field}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.fieldCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <TextInput
          {...inputProps}
          placeholderTextColor="#65736D"
          style={[styles.input, inputProps.multiline && styles.multilineInput]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#031015' },
  keyboard: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#162A26',
  },
  backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  back: { color: '#F2F6F4', fontSize: 38, lineHeight: 40 },
  title: { flex: 1, color: '#F4F7F6', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  headerSpacer: { width: 46 },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 44, gap: 11 },
  avatarCard: {
    minHeight: 96,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09171A',
    borderWidth: 1,
    borderColor: '#152A28',
  },
  coverCard: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#09171A',
    borderWidth: 1,
    borderColor: '#152A28',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10261E',
  },
  rowIconText: { color: '#DCE5E1', fontSize: 19 },
  rowCopy: { flex: 1, marginLeft: 11 },
  rowLabel: { color: '#EAF0ED', fontSize: 13, fontWeight: '800' },
  rowHint: { color: '#6F7E78', fontSize: 10, marginTop: 5 },
  avatar: { width: 57, height: 57, borderRadius: 29, marginLeft: 8 },
  avatarFallback: {
    width: 57,
    height: 57,
    borderRadius: 29,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173126',
    borderWidth: 2,
    borderColor: lime,
  },
  avatarInitial: { color: lime, fontSize: 21, fontWeight: '900' },
  chevron: { color: '#8C9993', fontSize: 29, marginLeft: 8 },
  field: {
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09171A',
    borderWidth: 1,
    borderColor: '#152A28',
  },
  fieldCopy: { flex: 1, marginLeft: 12 },
  input: {
    minHeight: 34,
    paddingVertical: 7,
    color: '#F1F5F3',
    fontSize: 14,
    fontWeight: '600',
  },
  multilineInput: { minHeight: 54, textAlignVertical: 'top' },
  emailCard: {
    minHeight: 67,
    paddingHorizontal: 15,
    borderRadius: 15,
    justifyContent: 'center',
    backgroundColor: '#071411',
    borderWidth: 1,
    borderColor: '#142621',
  },
  emailLabel: { color: '#718079', fontSize: 10, fontWeight: '700' },
  email: { color: '#A7B2AD', fontSize: 13, marginTop: 5 },
  error: { color: '#FF7777', fontSize: 12, paddingHorizontal: 3 },
  success: { color: lime, fontSize: 12, paddingHorizontal: 3 },
  saveButton: {
    height: 54,
    marginTop: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lime,
  },
  saveDisabled: { opacity: 0.55 },
  savePressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  saveText: { color: '#142000', fontSize: 16, fontWeight: '900' },
  note: { color: '#66746E', fontSize: 12, lineHeight: 18, paddingHorizontal: 5, marginTop: 4 },
});
