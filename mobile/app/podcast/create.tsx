import { useState } from 'react';
import { router } from 'expo-router';
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
import { getApiError } from '@/utils/auth';

const lime = '#8EE817';

export default function CreatePodcastScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<LocalUploadAsset | null>(null);
  const [audio, setAudio] = useState<LocalUploadAsset | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadingLabel, setUploadingLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setCover({
      uri: asset.uri,
      name: asset.fileName || `podcast-cover-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      file: asset.file,
    });
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setAudio({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'audio/mpeg',
      file: asset.file,
    });
  };

  const submit = async () => {
    if (!title.trim() || !cover || !audio) {
      return setError('Гарчиг, thumbnail зураг, audio файлаа сонгоно уу.');
    }
    setSubmitting(true);
    setError('');
    try {
      setUploadingLabel('Thumbnail');
      const coverBlob = await uploadMedia(cover, 'image', setProgress);
      setProgress(0);
      setUploadingLabel('Audio');
      const audioBlob = await uploadMedia(audio, 'audio', setProgress);
      await api.post('/media/podcasts', {
        title: title.trim(),
        description: description.trim() || undefined,
        coverUrl: coverBlob.url,
        audioUrl: audioBlob.url,
      });
      router.replace('/podcast');
    } catch (value) {
      setError(
        getApiError(value, value instanceof Error ? value.message : 'Podcast оруулж чадсангүй.'),
      );
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
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Болих</Text>
          </Pressable>
          <Text style={styles.heading}>Podcast оруулах</Text>
          <Pressable
            disabled={submitting}
            onPress={() => void submit()}
            style={[styles.publish, submitting && styles.disabled]}
          >
            <Text style={styles.publishText}>Нийтлэх</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => void pickCover()} style={styles.coverPicker}>
            {cover ? (
              <Image source={{ uri: cover.uri }} style={styles.cover} />
            ) : (
              <>
                <Text style={styles.coverIcon}>▧</Text>
                <Text style={styles.coverText}>Thumbnail зураг сонгох</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.label}>Гарчиг</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Podcast-ийн гарчиг"
            placeholderTextColor="#71807A"
            style={styles.input}
          />
          <Text style={styles.label}>Тайлбар</Text>
          <TextInput
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Энэ дугаарын тухай..."
            placeholderTextColor="#71807A"
            style={[styles.input, styles.description]}
          />
          <Text style={styles.label}>Audio файл</Text>
          <Pressable onPress={() => void pickAudio()} style={styles.audioPicker}>
            <Text style={styles.audioIcon}>♫</Text>
            <View style={styles.audioCopy}>
              <Text style={styles.audioTitle}>{audio ? audio.name : 'Audio сонгох'}</Text>
              <Text style={styles.audioHint}>MP3, M4A, WAV, AAC, OGG</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          {submitting && (
            <View style={styles.progressWrap}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
              <Text style={styles.progressText}>
                {uploadingLabel} хуулж байна · {Math.round(progress)}%
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
  safeArea: { flex: 1, backgroundColor: '#020D12' },
  keyboard: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: {
    height: 76,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#13242A',
  },
  cancel: { color: '#DCE3E0', fontSize: 14, fontWeight: '700' },
  heading: { color: '#F4F7F6', fontSize: 19, fontWeight: '900' },
  publish: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: lime,
    justifyContent: 'center',
  },
  publishText: { color: '#132000', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  content: { padding: 22, paddingBottom: 50 },
  coverPicker: {
    width: '100%',
    aspectRatio: 1.8,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#091A20',
    borderWidth: 1,
    borderColor: '#1A3238',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: { width: '100%', height: '100%' },
  coverIcon: { color: lime, fontSize: 42 },
  coverText: { color: '#DDE4E1', fontSize: 14, fontWeight: '700', marginTop: 8 },
  label: { color: '#B9C3BF', fontSize: 13, fontWeight: '700', marginTop: 22, marginBottom: 8 },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 13,
    color: '#F1F4F3',
    backgroundColor: '#08191A',
    borderWidth: 1,
    borderColor: '#183029',
    fontSize: 15,
  },
  description: { minHeight: 110, paddingTop: 13, textAlignVertical: 'top' },
  audioPicker: {
    height: 72,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: '#08191A',
    borderWidth: 1,
    borderColor: '#183029',
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIcon: { color: lime, fontSize: 27 },
  audioCopy: { flex: 1, marginLeft: 13 },
  audioTitle: { color: '#EFF3F1', fontSize: 14, fontWeight: '800' },
  audioHint: { color: '#788681', fontSize: 11, marginTop: 4 },
  chevron: { color: '#AEB8B4', fontSize: 31 },
  progressWrap: {
    height: 42,
    marginTop: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#0B1C19',
    justifyContent: 'center',
  },
  progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#274C20' },
  progressText: { color: '#EAF0ED', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
  error: { color: '#FF817B', fontSize: 13, marginTop: 16 },
});
