import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';
import type { FeedbackFormSummary } from '@/types/feedback';

const lime = '#9AF000';

export default function FeedbackFormsScreen() {
  const [forms, setForms] = useState<FeedbackFormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<{ forms: FeedbackFormSummary[] }>('/feedback-forms');
      setForms(data.forms);
    } catch (value) {
      setError(getApiError(value, 'Асуулгуудыг ачаалж чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <View className="h-16 flex-row items-center justify-between px-l">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="text-xl font-extrabold text-text-primary">Миний асуулгууд</Text>
        <Pressable
          onPress={() => router.push('/feedback/create')}
          className="h-10 w-10 items-center justify-center rounded-avatar bg-brand-primary"
        >
          <Icon name="add" size={22} color="#020B0D" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={lime} size="large" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {!!error && <Text className="pb-s text-danger">{error}</Text>}

          {forms.map((form) => (
            <Pressable
              key={form.id}
              onPress={() => router.push(`/feedback/${form.id}`)}
              className="mb-s rounded-card border border-border bg-background-paper p-m"
            >
              <Text className="text-base font-extrabold text-text-primary">{form.title}</Text>
              {!!form.description && (
                <Text numberOfLines={2} className="mt-1 text-sm text-text-muted">
                  {form.description}
                </Text>
              )}
              <View className="mt-s flex-row items-center gap-l">
                <Text className="text-xs text-text-muted">{form.questionCount} асуулт</Text>
                <Text className="text-xs text-text-muted">{form.responseCount} хариулт</Text>
                <Text className="text-xs text-text-muted">{relativeTime(form.createdAt)}</Text>
              </View>
            </Pressable>
          ))}

          {!forms.length && !error && (
            <View className="items-center pt-24">
              <Icon name="clipboard-outline" size={40} color="#A7AEB0" />
              <Text className="mt-m text-lg font-bold text-text-primary">Асуулга алга</Text>
              <Text className="mt-2 text-center text-sm text-text-muted">
                Санал асуулга үүсгэж, GrowX хамт олонтойгоо хуваалцаарай.
              </Text>
              <Pressable
                onPress={() => router.push('/feedback/create')}
                className="mt-l h-12 items-center justify-center rounded-btn bg-brand-primary px-l"
              >
                <Text className="text-sm font-bold text-background-app">Асуулга үүсгэх</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
