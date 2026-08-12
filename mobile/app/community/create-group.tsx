import { useState } from 'react';
import { router, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
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
import type { Community } from '@/types/community';
import { getApiError } from '@/utils/auth';
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from '@/components/ui/Icon';

const lime = '#9AF000';

export default function CreateGroupScreen() {
  const { colors } = useColorMode();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<LocalUploadAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [3, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setCover({
      uri: asset.uri,
      name: asset.fileName || `community-cover-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      file: asset.file,
    });
    setUploadProgress(0);
    setError('');
  };

  const createGroup = async () => {
    const groupName = name.trim();
    if (groupName.length < 2 || submitting) {
      setError('Бүлгийн нэр хамгийн багадаа 2 тэмдэгт байна.');
      return;
    }
    setSubmitting(true);
    setUploadProgress(0);
    setError('');
    try {
      let coverUrl: string | undefined;
      if (cover) {
        const uploadedCover = await uploadMedia(cover, 'image', setUploadProgress);
        coverUrl = uploadedCover.url;
      }
      const { data } = await api.post<{ community: Community }>('/communities', {
        name: groupName,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(coverUrl ? { coverUrl } : {}),
      });
      router.replace(`/community/${data.community.id}` as Href);
    } catch (value) {
      setError(getApiError(value, 'Бүлэг үүсгэж чадсангүй.'));
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
          <Pressable
            accessibilityLabel="Буцах"
            disabled={submitting}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon name="chevron-back" size={27} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Бүлэг үүсгэх</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            disabled={submitting}
            onPress={() => void pickCover()}
            style={[
              styles.coverPicker,
              { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
            ]}
          >
            {cover ? (
              <Image resizeMode="cover" source={{ uri: cover.uri }} style={styles.coverPreview} />
            ) : (
              <>
                <View style={[styles.coverGlow, { backgroundColor: colors.surfaceRaised }]} />
                <View
                  style={[
                    styles.groupMark,
                    { backgroundColor: colors.surface, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.groupMarkText, { color: colors.primary }]}>
                    {(name.trim() || 'GX').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              </>
            )}
            <View style={styles.coverAction}>
              <Text style={styles.coverActionText}>
                {cover ? 'Зураг солих' : 'Cover зураг сонгох'}
              </Text>
            </View>
          </Pressable>
          {cover && !submitting && (
            <Pressable onPress={() => setCover(null)} style={styles.removeCover}>
              <Text style={[styles.removeCoverText, { color: colors.danger }]}>Зураг хасах</Text>
            </Pressable>
          )}
          <Text style={[styles.title, { color: colors.text }]}>Шинэ community бүлэг</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Нэг зорилго, сонирхолтой хүмүүсийг цуглуулж мэдлэг туршлагаа хуваалцаарай.
          </Text>

          <View
            style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>Бүлгийн нэр</Text>
            <TextInput
              autoFocus
              maxLength={100}
              value={name}
              onChangeText={setName}
              placeholder="Жишээ: Startup founders"
              placeholderTextColor={colors.muted}
              cursorColor={colors.primary}
              selectionColor={colors.primary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Тайлбар</Text>
              <Text style={[styles.optional, { color: colors.muted }]}>Заавал биш</Text>
            </View>
            <TextInput
              multiline
              maxLength={1000}
              value={description}
              onChangeText={setDescription}
              placeholder="Бүлгийн зорилго, хэлэлцэх сэдвийг товч тайлбарлана уу"
              placeholderTextColor={colors.muted}
              cursorColor={colors.primary}
              selectionColor={colors.primary}
              style={[
                styles.input,
                styles.descriptionInput,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
            <Text style={[styles.characterCount, { color: colors.muted }]}>
              {description.length}/1000
            </Text>

            {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
            {submitting && cover && (
              <View style={styles.progress}>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSoft }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${uploadProgress}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.muted }]}>
                  Cover зураг хуулж байна · {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}

            <Pressable
              disabled={name.trim().length < 2 || submitting}
              onPress={() => void createGroup()}
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                (name.trim().length < 2 || submitting) && styles.submitDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text style={[styles.submitText, { color: colors.ink }]}>Бүлэг үүсгэх</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#020B0D' },
  keyboard: { flex: 1, minHeight: 0 },
  header: {
    height: 68,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#233D34',
  },
  backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#F4F7F6', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  headerSpacer: { width: 46 },
  scroll: { flex: 1, minHeight: 0 },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 50,
  },
  coverPicker: {
    width: '100%',
    height: 168,
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#25473B',
    backgroundColor: '#0C291F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPreview: { width: '100%', height: '100%' },
  coverGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#214C25',
    opacity: 0.55,
  },
  groupMark: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: '#173329',
    borderWidth: 2,
    borderColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupMarkText: { color: lime, fontSize: 23, fontWeight: '900' },
  coverAction: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: 'rgba(2, 13, 18, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverActionText: { color: '#F1F5F3', fontSize: 11, fontWeight: '800' },
  removeCover: { marginTop: 9, paddingVertical: 5, paddingHorizontal: 10 },
  removeCoverText: { color: '#FF817B', fontSize: 11, fontWeight: '700' },
  title: { color: '#F3F7F5', fontSize: 25, fontWeight: '900', marginTop: 16 },
  subtitle: {
    maxWidth: 440,
    color: '#84918B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    width: '100%',
    marginTop: 31,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3930',
    backgroundColor: '#071714',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#CAD3CF', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  optional: { color: '#65736D', fontSize: 10, marginBottom: 8 },
  input: {
    minHeight: 54,
    marginBottom: 19,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#1D3930',
    backgroundColor: '#0A1C19',
    color: '#F1F5F3',
    fontSize: 14,
  },
  descriptionInput: {
    minHeight: 126,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 6,
    textAlignVertical: 'top',
  },
  characterCount: { color: '#66756F', fontSize: 10, textAlign: 'right' },
  error: { color: '#FF817B', fontSize: 12, marginTop: 12 },
  progress: { marginTop: 16 },
  progressTrack: {
    height: 5,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: '#173029',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: lime },
  progressText: { color: '#84918B', fontSize: 10, marginTop: 7, textAlign: 'center' },
  submitButton: {
    height: 54,
    marginTop: 23,
    borderRadius: 15,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.38 },
  submitText: { color: '#142000', fontSize: 15, fontWeight: '900' },
});
