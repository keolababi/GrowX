import { useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
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
import { getApiError } from '@/utils/auth';

const lime = '#8EE817';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createGroup = async () => {
    const groupName = name.trim();
    if (groupName.length < 2 || submitting) {
      setError('Бүлгийн нэр хамгийн багадаа 2 тэмдэгт байна.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/communities', {
        name: groupName,
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      router.back();
    } catch (value) {
      setError(getApiError(value, 'Бүлэг үүсгэж чадсангүй.'));
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
          <Pressable disabled={submitting} onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Бүлэг үүсгэх</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.groupMark}>
            <Text style={styles.groupMarkText}>
              {(name.trim() || 'GX').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>Шинэ community бүлэг</Text>
          <Text style={styles.subtitle}>
            Нэг зорилго, сонирхолтой хүмүүсийг цуглуулж мэдлэг туршлагаа хуваалцаарай.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Бүлгийн нэр</Text>
            <TextInput
              autoFocus
              maxLength={100}
              value={name}
              onChangeText={setName}
              placeholder="Жишээ: Startup founders"
              placeholderTextColor="#65736D"
              style={styles.input}
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>Тайлбар</Text>
              <Text style={styles.optional}>Заавал биш</Text>
            </View>
            <TextInput
              multiline
              maxLength={1000}
              value={description}
              onChangeText={setDescription}
              placeholder="Бүлгийн зорилго, хэлэлцэх сэдвийг товч тайлбарлана уу"
              placeholderTextColor="#65736D"
              style={[styles.input, styles.descriptionInput]}
            />
            <Text style={styles.characterCount}>{description.length}/1000</Text>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              disabled={name.trim().length < 2 || submitting}
              onPress={() => void createGroup()}
              style={[
                styles.submitButton,
                (name.trim().length < 2 || submitting) && styles.submitDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#142000" />
              ) : (
                <Text style={styles.submitText}>Бүлэг үүсгэх</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020D12' },
  keyboard: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  back: { color: '#F2F6F4', fontSize: 38, lineHeight: 40 },
  headerTitle: { flex: 1, color: '#F4F7F6', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  headerSpacer: { width: 46 },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 50,
  },
  groupMark: {
    width: 84,
    height: 84,
    borderRadius: 27,
    backgroundColor: '#173329',
    borderWidth: 2,
    borderColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupMarkText: { color: lime, fontSize: 23, fontWeight: '900' },
  title: { color: '#F3F7F5', fontSize: 25, fontWeight: '900', marginTop: 20 },
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
