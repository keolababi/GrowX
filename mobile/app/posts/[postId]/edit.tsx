import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
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
import type { SocialPost } from '@/types/post';
import { useColorMode } from '@/providers/ColorModeProvider';

const lime = '#9AF000';

export default function EditPostScreen() {
  const { iconAccent, colors } = useColorMode();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!postId) return;
    try {
      const { data } = await api.get<{ post: SocialPost }>(`/posts/${postId}`);
      setPost(data.post);
      setContent(data.post.content);
    } catch (value) {
      setError(getApiError(value, 'Post-ийг ачаалж чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!postId || !content.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/posts/${postId}`, { content: content.trim() });
      router.back();
    } catch (value) {
      setError(getApiError(value, 'Post-ийг хадгалж чадсангүй.'));
    } finally {
      setSaving(false);
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
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/posts'))}
          >
            <Text style={[styles.cancel, { color: colors.textSecondary }]}>Болих</Text>
          </Pressable>
          <Text style={[styles.heading, { color: colors.text }]}>Post засах</Text>
          <Pressable disabled={!content.trim() || saving} onPress={() => void save()}>
            <Text
              style={[
                styles.save,
                { color: colors.primary },
                (!content.trim() || saving) && [styles.saveDisabled, { color: colors.muted }],
              ]}
            >
              {saving ? '...' : 'Хадгалах'}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={iconAccent} size="large" />
          </View>
        ) : (
          <View style={styles.editor}>
            <TextInput
              autoFocus
              multiline
              maxLength={5000}
              value={content}
              onChangeText={setContent}
              placeholder="Post-ийн текст"
              placeholderTextColor={colors.muted}
              cursorColor={colors.primary}
              selectionColor={colors.primary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            />
            {!!post?.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.image} />}
            <Text style={[styles.hint, { color: colors.muted }]}>Зураг хэвээр хадгалагдана.</Text>
            <Text style={[styles.counter, { color: colors.muted }]}>{content.length}/5000</Text>
            {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020B0D' },
  keyboard: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#17272C',
  },
  cancel: { color: '#DCE3E0', fontSize: 14, fontWeight: '700' },
  heading: { color: '#F4F7F6', fontSize: 19, fontWeight: '900' },
  save: { color: lime, fontSize: 14, fontWeight: '900' },
  saveDisabled: { color: '#45633C' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  editor: { flex: 1, padding: 22 },
  input: {
    minHeight: 170,
    padding: 15,
    borderRadius: 13,
    borderWidth: 1,
    color: '#EDF2F0',
    backgroundColor: '#08191A',
    fontSize: 17,
    lineHeight: 25,
    textAlignVertical: 'top',
  },
  image: { width: '100%', aspectRatio: 1.6, borderRadius: 13, marginTop: 15 },
  hint: { color: '#71807A', fontSize: 11, marginTop: 8 },
  counter: { color: '#71807A', fontSize: 11, textAlign: 'right', marginTop: 10 },
  error: { color: '#FF817B', fontSize: 13, marginTop: 14 },
});
