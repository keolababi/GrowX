import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';
import type { FeedbackFormSummary } from '@/types/feedback';
import { AppPageHeader } from '@/components/AppPageHeader';
import { useColorMode } from '@/providers/ColorModeProvider';

export default function FeedbackFormsScreen() {
  const { colors, iconAccent: lime } = useColorMode();
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

  const totalResponses = forms.reduce((sum, form) => sum + form.responseCount, 0);

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <AppPageHeader
        title="Feedback"
        back
        actions={
          forms.length > 0 || !!error ? (
            <Pressable
              onPress={() => router.push('/feedback/create')}
              accessibilityRole="button"
              accessibilityLabel="Шинэ асуулга нэмэх"
              className="h-10 flex-row items-center justify-center gap-1 rounded-btn bg-brand-primary px-m active:opacity-80"
            >
              <Icon name="add" size={19} color={colors.ink} />
              <Text className="text-xs font-extrabold text-background-app">Шинэ асуулга</Text>
            </Pressable>
          ) : undefined
        }
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loader size={44} />
          <Text className="mt-s text-sm text-text-muted">Асуулгуудыг ачаалж байна...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          <View className="w-full max-w-[900px] self-center px-l pt-l">
            <View className="relative min-h-[190px] overflow-hidden rounded-[24px] border border-border bg-background-paper p-l">
              <View className="absolute -right-10 -top-16 h-48 w-48 rounded-avatar bg-background-soft opacity-60" />
              <View className="absolute -bottom-20 right-20 h-40 w-40 rounded-avatar bg-background-raised opacity-80" />
              <View className="relative max-w-[560px]">
                <View className="mb-m h-12 w-12 items-center justify-center rounded-card bg-brand-primary">
                  <Icon name="chatbox-ellipses" size={25} color={colors.ink} />
                </View>
                <Text className="text-2xl font-extrabold text-text-primary">
                  Санал хүсэлтээс илүү сайн шийдвэр төрнө.
                </Text>
                <Text className="mt-s max-w-[500px] text-sm leading-5 text-text-secondary">
                  Асуулга үүсгэж, хариултуудыг нэг дороос хянаж, хэрэглэгчдийнхээ бодлыг ойлгоорой.
                </Text>
              </View>
            </View>

            <View className="mt-m flex-row gap-s">
              <View className="flex-1 rounded-card border border-border bg-background-paper p-m">
                <View className="flex-row items-center justify-between">
                  <View className="h-9 w-9 items-center justify-center rounded-avatar bg-background-soft">
                    <Icon name="documents-outline" size={18} color={lime} />
                  </View>
                  <Text className="text-2xl font-extrabold text-text-primary">{forms.length}</Text>
                </View>
                <Text className="mt-s text-xs font-bold text-text-muted">Нийт асуулга</Text>
              </View>
              <View className="flex-1 rounded-card border border-border bg-background-paper p-m">
                <View className="flex-row items-center justify-between">
                  <View className="h-9 w-9 items-center justify-center rounded-avatar bg-background-soft">
                    <Icon name="people-outline" size={18} color={lime} />
                  </View>
                  <Text className="text-2xl font-extrabold text-text-primary">
                    {totalResponses}
                  </Text>
                </View>
                <Text className="mt-s text-xs font-bold text-text-muted">Нийт хариулт</Text>
              </View>
            </View>

            {!!error && (
              <View className="mt-m rounded-btn border border-danger/40 bg-danger/10 p-m">
                <Text className="text-sm font-semibold text-danger">{error}</Text>
                <Pressable onPress={() => void load()} className="mt-s self-start">
                  <Text className="text-xs font-bold text-brand-primary">Дахин оролдох</Text>
                </Pressable>
              </View>
            )}

            <View className="mb-s mt-l flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-text-primary">Миний асуулгууд</Text>
              {!!forms.length && (
                <View className="rounded-avatar border border-border bg-background-paper px-s py-1">
                  <Text className="text-[11px] font-bold text-text-secondary">
                    {forms.length} асуулга
                  </Text>
                </View>
              )}
            </View>

            {forms.map((form) => (
              <Pressable
                key={form.id}
                onPress={() => router.push(`/feedback/${form.id}`)}
                className="mb-s flex-row items-center rounded-card border border-border bg-background-paper p-m active:border-brand-primary active:opacity-80"
              >
                <View className="mr-m h-12 w-12 shrink-0 items-center justify-center rounded-card bg-background-soft">
                  <Icon name="clipboard-outline" size={23} color={lime} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-base font-extrabold text-text-primary">
                    {form.title}
                  </Text>
                  {!!form.description && (
                    <Text numberOfLines={1} className="mt-1 text-xs text-text-muted">
                      {form.description}
                    </Text>
                  )}
                  <View className="mt-s flex-row flex-wrap items-center gap-s">
                    <View className="flex-row items-center gap-1">
                      <Icon name="help-circle-outline" size={13} color={colors.muted} />
                      <Text className="text-[11px] text-text-muted">
                        {form.questionCount} асуулт
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Icon name="people-outline" size={13} color={colors.muted} />
                      <Text className="text-[11px] text-text-muted">
                        {form.responseCount} хариулт
                      </Text>
                    </View>
                    <Text className="text-[11px] text-text-muted">
                      · {relativeTime(form.createdAt)}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.muted} />
              </Pressable>
            ))}

            {!forms.length && !error && (
              <View className="items-center rounded-[24px] border border-dashed border-border bg-background-paper px-l py-12">
                <View className="h-16 w-16 items-center justify-center rounded-avatar bg-background-soft">
                  <Icon name="clipboard-outline" size={30} color={lime} />
                </View>
                <Text className="mt-m text-lg font-extrabold text-text-primary">
                  Анхны асуулгаа үүсгээрэй
                </Text>
                <Text className="mt-2 max-w-[420px] text-center text-sm leading-5 text-text-muted">
                  Богино асуулга үүсгээд хэрэглэгч, баг эсвэл хамт олныхоо санал хүсэлтийг
                  цуглуулаарай.
                </Text>
                <Pressable
                  onPress={() => router.push('/feedback/create')}
                  className="mt-l h-11 flex-row items-center justify-center gap-s rounded-btn bg-brand-primary px-l active:opacity-80"
                >
                  <Icon name="add" size={18} color={colors.ink} />
                  <Text className="text-sm font-extrabold text-background-app">Асуулга үүсгэх</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
