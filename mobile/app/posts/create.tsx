import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
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
import { NotificationBell } from '@/components/NotificationBell';
import { getApiError } from '@/utils/auth';
import { useUser } from '@/providers/UserProvider';

type CreateMode = 'post' | 'reel' | 'podcast';
type SelectedMedia = LocalUploadAsset & { type: 'image' | 'video' };

const lime = '#8EE817';
const modes: Array<{ value: CreateMode; label: string }> = [
  { value: 'post', label: 'POST' },
  { value: 'reel', label: 'REEL' },
  { value: 'podcast', label: 'PODCAST' },
];

export default function CreateContentScreen() {
  const params = useLocalSearchParams<{ type?: string; communityId?: string }>();
  const { user } = useUser();
  const initialMode: CreateMode =
    params.type === 'reel' || params.type === 'podcast' ? params.type : 'post';
  const [mode, setMode] = useState<CreateMode>(initialMode);
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<SelectedMedia | null>(null);
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [podcastCover, setPodcastCover] = useState<LocalUploadAsset | null>(null);
  const [podcastAudio, setPodcastAudio] = useState<LocalUploadAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingLabel, setUploadingLabel] = useState('');
  const [error, setError] = useState('');

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'GrowX хэрэглэгч';
  const userInitial = (user?.displayName?.trim() || user?.email || 'G').slice(0, 2).toUpperCase();

  const selectMode = (nextMode: CreateMode) => {
    setMode(nextMode);
    setMedia(null);
    setError('');
    setUploadProgress(0);
  };

  const pickPostMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [mode === 'reel' ? 'videos' : 'images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const type = mode === 'reel' ? 'video' : 'image';
    setMedia({
      type,
      uri: asset.uri,
      name: asset.fileName || `${type}-${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`,
      mimeType: asset.mimeType || (type === 'image' ? 'image/jpeg' : 'video/mp4'),
      file: asset.file,
    });
  };

  const pickPodcastCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPodcastCover({
      uri: asset.uri,
      name: asset.fileName || `podcast-cover-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      file: asset.file,
    });
  };

  const pickPodcastAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPodcastAudio({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'audio/mpeg',
      file: asset.file,
    });
  };

  const canPublish =
    mode === 'post'
      ? Boolean(caption.trim())
      : mode === 'reel'
        ? Boolean(caption.trim() && media)
        : Boolean(podcastTitle.trim() && podcastCover && podcastAudio);

  const publish = async () => {
    if (!canPublish || submitting) return;
    setSubmitting(true);
    setError('');
    setUploadProgress(0);
    try {
      if (mode === 'podcast') {
        setUploadingLabel('Thumbnail');
        const coverBlob = await uploadMedia(podcastCover!, 'image', setUploadProgress);
        setUploadProgress(0);
        setUploadingLabel('Audio');
        const audioBlob = await uploadMedia(podcastAudio!, 'audio', setUploadProgress);
        await api.post('/media/podcasts', {
          title: podcastTitle.trim(),
          description: podcastDescription.trim() || undefined,
          coverUrl: coverBlob.url,
          audioUrl: audioBlob.url,
        });
        router.replace('/podcast');
        return;
      }

      let mediaUrl: string | undefined;
      if (media) {
        setUploadingLabel(mode === 'reel' ? 'Видео' : 'Зураг');
        const blob = await uploadMedia(media, media.type, setUploadProgress);
        mediaUrl = blob.url;
      }
      if (mode === 'reel' && mediaUrl) {
        await api.post('/media/reels', { caption: caption.trim(), videoUrl: mediaUrl });
        router.replace('/reels');
      } else {
        await api.post('/posts', {
          content: caption.trim(),
          ...(mediaUrl ? { imageUrl: mediaUrl } : {}),
          ...(params.communityId ? { communityId: params.communityId } : {}),
        });
        router.replace('/posts');
      }
    } catch (value) {
      setError(getApiError(value, value instanceof Error ? value.message : 'Нийтэлж чадсангүй.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Хаах" onPress={() => router.back()} style={styles.close}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Шинэ контент</Text>
          <View style={styles.headerActions}>
            <NotificationBell />
            <Pressable disabled={!canPublish || submitting} onPress={() => void publish()}>
              <Text style={[styles.share, (!canPublish || submitting) && styles.shareDisabled]}>
                {submitting ? `${Math.round(uploadProgress)}%` : 'Нийтлэх'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.tabs}>
          {modes.map((item) => {
            const active = mode === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => selectMode(item.value)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === 'podcast' ? (
            <View style={styles.podcastEditor}>
              <Pressable onPress={() => void pickPodcastCover()} style={styles.podcastCoverPicker}>
                {podcastCover ? (
                  <Image source={{ uri: podcastCover.uri }} style={styles.podcastCover} />
                ) : (
                  <>
                    <View style={styles.podcastDisc}>
                      <Text style={styles.podcastDiscIcon}>♫</Text>
                    </View>
                    <Text style={styles.pickerTitle}>Thumbnail сонгох</Text>
                    <Text style={styles.pickerHint}>Podcast cover зураг</Text>
                  </>
                )}
                <View style={styles.editBadge}>
                  <Text style={styles.editBadgeText}>＋</Text>
                </View>
              </Pressable>

              <TextInput
                value={podcastTitle}
                onChangeText={setPodcastTitle}
                placeholder="Podcast-ийн гарчиг"
                placeholderTextColor="#66736E"
                style={styles.titleInput}
              />
              <TextInput
                multiline
                value={podcastDescription}
                onChangeText={setPodcastDescription}
                placeholder="Энэ дугаарын тухай тайлбар..."
                placeholderTextColor="#66736E"
                style={styles.descriptionInput}
              />
              <Pressable onPress={() => void pickPodcastAudio()} style={styles.audioPicker}>
                <View style={styles.audioIconWrap}>
                  <Text style={styles.audioIcon}>♫</Text>
                </View>
                <View style={styles.audioCopy}>
                  <Text numberOfLines={1} style={styles.audioTitle}>
                    {podcastAudio?.name || 'Audio файл сонгох'}
                  </Text>
                  <Text style={styles.audioHint}>MP3, M4A, WAV, AAC, OGG</Text>
                </View>
                <Text style={styles.audioChevron}>›</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.postEditor}>
              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitial}</Text>
                </View>
                <Text style={styles.authorName}>{displayName}</Text>
              </View>

              {media ? (
                <Pressable onPress={() => void pickPostMedia()} style={styles.mediaPreview}>
                  {media.type === 'image' ? (
                    <Image source={{ uri: media.uri }} style={styles.selectedImage} />
                  ) : (
                    <View style={styles.videoSelected}>
                      <View style={styles.videoPlay}>
                        <Text style={styles.videoPlayText}>▶</Text>
                      </View>
                      <Text numberOfLines={1} style={styles.videoName}>
                        {media.name}
                      </Text>
                    </View>
                  )}
                  <Pressable onPress={() => setMedia(null)} style={styles.removeButton}>
                    <Text style={styles.removeText}>×</Text>
                  </Pressable>
                </Pressable>
              ) : (
                <Pressable onPress={() => void pickPostMedia()} style={styles.mediaPicker}>
                  <View style={styles.mediaPickerIcon}>
                    <Text style={styles.mediaPickerIconText}>{mode === 'reel' ? '▶' : '▧'}</Text>
                  </View>
                  <Text style={styles.pickerTitle}>
                    {mode === 'reel' ? 'Видео сонгох' : 'Зураг сонгох'}
                  </Text>
                  <Text style={styles.pickerHint}>
                    {mode === 'reel'
                      ? 'Босоо видео хамгийн тохиромжтой'
                      : 'Gallery-гаас зураг сонгоно'}
                  </Text>
                  <View style={styles.selectButton}>
                    <Text style={styles.selectButtonText}>Төхөөрөмжөөс сонгох</Text>
                  </View>
                </Pressable>
              )}

              <View style={styles.captionRow}>
                <TextInput
                  multiline
                  maxLength={5000}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder={mode === 'reel' ? 'Reel-ийн тайлбар бичих...' : 'Тайлбар бичих...'}
                  placeholderTextColor="#66736E"
                  style={styles.captionInput}
                />
                <Text style={styles.counter}>{caption.length}/5000</Text>
              </View>
            </View>
          )}

          {submitting && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              <Text style={styles.progressLabel}>
                {uploadingLabel} хуулж байна · {Math.round(uploadProgress)}%
              </Text>
            </View>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  safeArea: { flex: 1, backgroundColor: '#020D12' },
  keyboard: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#17272C',
  },
  close: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#F1F5F3', fontSize: 35, lineHeight: 37, fontWeight: '300' },
  headerTitle: { color: '#F4F7F6', fontSize: 19, fontWeight: '900' },
  share: { minWidth: 62, color: lime, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  shareDisabled: { color: '#45633C' },
  tabs: {
    height: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#17272C',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: lime },
  tabText: { color: '#687570', fontSize: 12, fontWeight: '800', letterSpacing: 0.7 },
  tabTextActive: { color: '#F0F4F2' },
  scrollContent: { padding: 22, paddingBottom: 50 },
  postEditor: { width: '100%' },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#173328',
    borderWidth: 1,
    borderColor: '#2B503F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: lime, fontSize: 12, fontWeight: '900' },
  authorName: { color: '#F1F4F3', fontSize: 14, fontWeight: '800', marginLeft: 11 },
  mediaPicker: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 520,
    borderRadius: 7,
    backgroundColor: '#08171C',
    borderWidth: 1,
    borderColor: '#1B3036',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPickerIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#DDE4E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPickerIconText: { color: '#EDF2F0', fontSize: 29 },
  pickerTitle: { color: '#F0F4F2', fontSize: 17, fontWeight: '800', marginTop: 17 },
  pickerHint: { color: '#7E8B86', fontSize: 12, marginTop: 7 },
  selectButton: {
    height: 39,
    paddingHorizontal: 17,
    borderRadius: 9,
    backgroundColor: lime,
    justifyContent: 'center',
    marginTop: 20,
  },
  selectButtonText: { color: '#142000', fontSize: 12, fontWeight: '900' },
  mediaPreview: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 520,
    overflow: 'hidden',
    borderRadius: 7,
    backgroundColor: '#071318',
  },
  selectedImage: { width: '100%', height: '100%' },
  videoSelected: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 },
  videoPlay: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayText: { color: '#142000', fontSize: 28, marginLeft: 4 },
  videoName: { color: '#DCE3E0', fontSize: 13, marginTop: 16 },
  removeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#FFF', fontSize: 24, lineHeight: 25 },
  captionRow: {
    minHeight: 105,
    marginTop: 15,
    padding: 14,
    borderRadius: 7,
    backgroundColor: '#07161A',
  },
  captionInput: {
    minHeight: 62,
    color: '#E8EDEB',
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  counter: { color: '#65726D', fontSize: 11, textAlign: 'right', marginTop: 5 },
  podcastEditor: { width: '100%' },
  podcastCoverPicker: {
    width: '100%',
    aspectRatio: 1.6,
    maxHeight: 430,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: '#08171C',
    borderWidth: 1,
    borderColor: '#1B3036',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastCover: { width: '100%', height: '100%' },
  podcastDisc: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#173328',
    borderWidth: 2,
    borderColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastDiscIcon: { color: lime, fontSize: 32 },
  editBadge: {
    position: 'absolute',
    right: 13,
    bottom: 13,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: { color: '#142000', fontSize: 27 },
  titleInput: {
    height: 55,
    marginTop: 16,
    paddingHorizontal: 15,
    borderRadius: 8,
    color: '#F1F4F3',
    backgroundColor: '#07161A',
    fontSize: 16,
    fontWeight: '700',
  },
  descriptionInput: {
    minHeight: 105,
    marginTop: 11,
    padding: 15,
    borderRadius: 8,
    color: '#E8EDEB',
    backgroundColor: '#07161A',
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  audioPicker: {
    height: 76,
    marginTop: 11,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: '#07161A',
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#173328',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioIcon: { color: lime, fontSize: 23 },
  audioCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  audioTitle: { color: '#EEF2F0', fontSize: 14, fontWeight: '800' },
  audioHint: { color: '#71807A', fontSize: 11, marginTop: 4 },
  audioChevron: { color: '#A7B2AE', fontSize: 31 },
  progressTrack: {
    height: 42,
    marginTop: 17,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#0A1C19',
    justifyContent: 'center',
  },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#244A1D' },
  progressLabel: { color: '#EAF0ED', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
  error: { color: '#FF817B', fontSize: 13, marginTop: 14 },
});
