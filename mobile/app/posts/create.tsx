import { useState } from 'react';
import { router } from 'expo-router';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import { useUser } from '@/providers/UserProvider';
import type { SocialPost } from '@/types/post';

const lime = '#8EE817';

export default function CreatePostScreen() {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return setError('Post-ийн агуулгаа бичнэ үү.');
    setSubmitting(true);
    setError('');
    try {
      await api.post<{ post: SocialPost }>('/posts', {
        content: trimmedContent,
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      });
      router.replace('/posts');
    } catch (value) {
      setError(getApiError(value, 'Post оруулж чадсангүй.'));
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
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.cancel}>Болих</Text>
          </Pressable>
          <Text style={styles.title}>Шинэ post</Text>
          <Pressable
            disabled={submitting || !content.trim()}
            onPress={() => void submit()}
            style={[styles.submit, (!content.trim() || submitting) && styles.submitDisabled]}
          >
            <Text style={styles.submitText}>{submitting ? '...' : 'Нийтлэх'}</Text>
          </Pressable>
        </View>

        <View style={styles.composer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.displayName?.trim() || user?.email || 'G').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.copy}>
            <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0]}</Text>
            <TextInput
              autoFocus
              multiline
              maxLength={5000}
              value={content}
              onChangeText={setContent}
              placeholder="Юу бодож байна?"
              placeholderTextColor="#73807B"
              style={styles.contentInput}
            />
            {!!imageUrl.trim() && (
              <Image source={{ uri: imageUrl.trim() }} resizeMode="cover" style={styles.preview} />
            )}
          </View>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {showImageInput && (
          <TextInput
            autoCapitalize="none"
            keyboardType="url"
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="Зургийн URL оруулах"
            placeholderTextColor="#71807A"
            style={styles.imageInput}
          />
        )}

        <View style={styles.toolbar}>
          <Pressable onPress={() => setShowImageInput((visible) => !visible)} style={styles.tool}>
            <Text style={styles.toolIcon}>▧</Text>
            <Text style={styles.toolText}>Зураг</Text>
          </Pressable>
          <Text style={styles.counter}>{content.length}/5000</Text>
        </View>
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
  cancel: { color: '#DCE3E0', fontSize: 15, fontWeight: '700' },
  title: { color: '#F4F7F6', fontSize: 20, fontWeight: '900' },
  submit: {
    minWidth: 78,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#132000', fontSize: 14, fontWeight: '900' },
  composer: { flexDirection: 'row', paddingHorizontal: 22, paddingTop: 22 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#183127',
    borderWidth: 1,
    borderColor: '#2B4D3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: lime, fontSize: 14, fontWeight: '900' },
  copy: { flex: 1, minWidth: 0, marginLeft: 13 },
  name: { color: '#F2F5F4', fontSize: 16, fontWeight: '800' },
  contentInput: {
    minHeight: 150,
    color: '#EBEFED',
    fontSize: 18,
    lineHeight: 27,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  preview: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: 17,
    marginTop: 12,
    backgroundColor: '#0A171D',
  },
  error: { color: '#FF817B', fontSize: 13, paddingHorizontal: 22, paddingTop: 12 },
  imageInput: {
    height: 48,
    marginHorizontal: 22,
    marginTop: 18,
    paddingHorizontal: 14,
    borderRadius: 13,
    color: '#F1F4F3',
    backgroundColor: '#08191A',
    borderWidth: 1,
    borderColor: '#183029',
  },
  toolbar: {
    height: 66,
    marginTop: 'auto',
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#13242A',
  },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toolIcon: { color: lime, fontSize: 25 },
  toolText: { color: '#DDE4E1', fontSize: 14, fontWeight: '700' },
  counter: { color: '#71807A', fontSize: 12 },
});
