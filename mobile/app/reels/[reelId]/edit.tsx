import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
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
import { Loader } from '@/components/ui/Loader';
import { Icon } from '@/components/ui/Icon';
import { useColorMode } from '@/providers/ColorModeProvider';
import { useUser } from '@/providers/UserProvider';
import { getApiError } from '@/utils/auth';
import type { Reel } from '@/types/reel';

export default function EditReelScreen() {
  const { reelId } = useLocalSearchParams<{ reelId: string }>();
  const { user } = useUser();
  const { colors } = useColorMode();
  const [reel, setReel] = useState<Reel | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!reelId || !user?.id) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ reels: Reel[] }>('/media/reels/mine');
      const current = data.reels.find((item) => item.id === reelId) ?? null;
      if (!current) {
        setError('Энэ Reel-ийг засах эрхгүй байна.');
        return;
      }
      setReel(current);
      setCaption(current.caption ?? '');
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Reel-ийг ачаалж чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [reelId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!reel || saving) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/media/reels/${reel.id}`, { caption: caption.trim() });
      router.back();
    } catch (value) {
      setError(getApiError(value, 'Reel-ийг хадгалж чадсангүй.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.textSecondary }}>Болих</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Reel засах</Text>
          <Pressable disabled={saving} onPress={() => void save()}>
            <Text style={{ color: saving ? colors.muted : colors.primary, fontWeight: '900' }}>
              {saving ? '...' : 'Хадгалах'}
            </Text>
          </Pressable>
        </View>
        {loading ? (
          <View style={styles.center}>
            <Loader size={40} />
          </View>
        ) : reel ? (
          <View style={styles.content}>
            <Text style={[styles.label, { color: colors.text }]}>Тайлбар</Text>
            <TextInput
              autoFocus
              multiline
              maxLength={1000}
              value={caption}
              onChangeText={setCaption}
              placeholder="Reel-ийн тайлбар"
              placeholderTextColor={colors.muted}
              cursorColor={colors.primary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            />
            <Text style={[styles.counter, { color: colors.muted }]}>{caption.length}/1000</Text>
            {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}
          </View>
        ) : (
          <View style={styles.center}>
            <Icon name="lock-closed-outline" size={36} color={colors.muted} />
            <Text style={[styles.error, { color: colors.text }]}>{error}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  title: { fontSize: 19, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { padding: 22 },
  label: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    fontSize: 16,
    lineHeight: 23,
    textAlignVertical: 'top',
  },
  counter: { marginTop: 8, textAlign: 'right', fontSize: 12 },
  error: { textAlign: 'center', fontWeight: '700' },
});
