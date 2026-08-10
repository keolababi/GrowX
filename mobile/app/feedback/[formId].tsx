import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { AppPageHeader } from '@/components/AppPageHeader';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import type { FeedbackAnswerInput, FeedbackFormDetail } from '@/types/feedback';
import { useColorMode } from '@/providers/ColorModeProvider';

const stars = [1, 2, 3, 4, 5];
const scaleValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function FeedbackFormScreen() {
  const { colors, iconAccent: lime } = useColorMode();
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const [form, setForm] = useState<FeedbackFormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<
    Record<string, { textValue?: string; optionsValue?: string[] }>
  >({});

  useEffect(() => {
    if (!formId) return;
    api
      .get<FeedbackFormDetail>(`/feedback-forms/${formId}`)
      .then(({ data }) => setForm(data))
      .catch((value) => setError(getApiError(value, 'Асуулга олдсонгүй.')))
      .finally(() => setLoading(false));
  }, [formId]);

  const setText = (questionId: string, textValue: string) => {
    setAnswers((current) => ({ ...current, [questionId]: { textValue } }));
  };

  const toggleOption = (questionId: string, option: string, multi: boolean) => {
    setAnswers((current) => {
      if (!multi) return { ...current, [questionId]: { optionsValue: [option] } };
      const existing = current[questionId]?.optionsValue ?? [];
      const next = existing.includes(option)
        ? existing.filter((item) => item !== option)
        : [...existing, option];
      return { ...current, [questionId]: { optionsValue: next } };
    });
  };

  const share = async () => {
    try {
      await Share.share({
        message: `${form?.title} — GrowX асуулга\nhttps://growx.app/feedback/${formId}`,
      });
    } catch {
      // User dismissed the native share sheet.
    }
  };

  const confirmDelete = () => {
    const message = 'Энэ асуулгыг устгах уу? Бүх хариултууд устна.';
    const remove = async () => {
      try {
        await api.delete(`/feedback-forms/${formId}`);
        router.replace('/feedback');
      } catch (value) {
        setError(getApiError(value, 'Устгаж чадсангүй.'));
      }
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) void remove();
      return;
    }
    Alert.alert('Устгах', message, [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  const submit = async () => {
    if (!form || submitting) return;
    const payload: FeedbackAnswerInput[] = form.questions.map((question) => ({
      questionId: question.id,
      ...answers[question.id],
    }));
    const missingRequired = form.questions.some((question) => {
      if (!question.required) return false;
      const answer = answers[question.id];
      return !answer?.textValue?.trim() && !answer?.optionsValue?.length;
    });
    if (missingRequired) {
      setError('Заавал бөглөх бүх асуултад хариулна уу.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/feedback-forms/${formId}/responses`, { answers: payload });
      setForm((current) => (current ? { ...current, respondedByMe: true } : current));
    } catch (value) {
      setError(getApiError(value, 'Илгээж чадсангүй.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-app">
        <Loader size={44} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <AppPageHeader
        title="Асуулга"
        back
        actions={
          <View className="flex-row items-center gap-s">
            <Pressable onPress={() => void share()} hitSlop={8}>
              <Icon name="share-social-outline" size={22} color={colors.text} />
            </Pressable>
            {form?.isOwner && (
              <Pressable onPress={confirmDelete} hitSlop={8}>
                <Icon name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            )}
          </View>
        }
      />

      {!!error && <Text className="px-l pt-s text-danger">{error}</Text>}

      {form && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            width: '100%',
            maxWidth: 900,
            alignSelf: 'center',
            padding: 20,
            paddingBottom: 48,
          }}
        >
          <Text className="text-2xl font-extrabold leading-8 text-text-primary">{form.title}</Text>
          {!!form.description && (
            <Text className="mt-s text-sm leading-5 text-text-secondary">{form.description}</Text>
          )}
          <Text className="mt-s text-xs text-text-muted">
            {form.author.displayName || form.author.email.split('@')[0]} · {form.responseCount}{' '}
            хариулт
          </Text>

          {form.isOwner ? (
            <Pressable
              onPress={() => router.push(`/feedback/${form.id}/responses`)}
              className="mt-l h-12 flex-row items-center justify-center gap-s rounded-btn bg-brand-primary"
            >
              <Icon name="stats-chart-outline" size={18} color={colors.ink} />
              <Text className="text-sm font-bold text-background-app">Хариултууд харах</Text>
            </Pressable>
          ) : form.respondedByMe ? (
            <View className="mt-l items-center rounded-card border border-border bg-background-paper p-l">
              <Icon name="checkmark-circle" size={32} color={lime} />
              <Text className="mt-s text-base font-bold text-text-primary">Баярлалаа!</Text>
              <Text className="mt-1 text-center text-sm text-text-muted">
                Та энэ асуулгад аль хэдийн хариулсан байна.
              </Text>
            </View>
          ) : (
            <>
              {form.questions.map((question, index) => (
                <View
                  key={question.id}
                  className="mt-m rounded-card border border-border bg-background-paper p-m"
                >
                  <Text className="text-sm font-bold text-text-primary">
                    {index + 1}. {question.label}
                    {question.required && <Text className="text-danger"> *</Text>}
                  </Text>

                  {question.type === 'SHORT_ANSWER' && (
                    <TextInput
                      value={answers[question.id]?.textValue ?? ''}
                      onChangeText={(value) => setText(question.id, value)}
                      placeholder="Хариулт бичих..."
                      placeholderTextColor={colors.muted}
                      cursorColor={colors.primary}
                      selectionColor={colors.primary}
                      style={{
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      }}
                      className="mt-s h-11 rounded-btn border border-border bg-background-app px-s text-sm text-text-primary"
                    />
                  )}

                  {question.type === 'LONG_ANSWER' && (
                    <TextInput
                      value={answers[question.id]?.textValue ?? ''}
                      onChangeText={(value) => setText(question.id, value)}
                      placeholder="Дэлгэрэнгүй хариулт..."
                      placeholderTextColor={colors.muted}
                      cursorColor={colors.primary}
                      selectionColor={colors.primary}
                      style={{
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      }}
                      multiline
                      className="mt-s min-h-20 rounded-btn border border-border bg-background-app p-s text-sm text-text-primary"
                    />
                  )}

                  {(question.type === 'MULTIPLE_CHOICE' || question.type === 'CHECKBOXES') && (
                    <View className="mt-s gap-s">
                      {(question.options ?? []).map((option) => {
                        const multi = question.type === 'CHECKBOXES';
                        const selected = (answers[question.id]?.optionsValue ?? []).includes(
                          option,
                        );
                        return (
                          <Pressable
                            key={option}
                            onPress={() => toggleOption(question.id, option, multi)}
                            className="flex-row items-center gap-s"
                          >
                            <Icon
                              name={
                                selected
                                  ? multi
                                    ? 'checkbox'
                                    : 'radio-button-on'
                                  : multi
                                    ? 'checkbox-outline'
                                    : 'radio-button-off-outline'
                              }
                              size={20}
                              color={selected ? lime : colors.muted}
                            />
                            <Text className="text-sm text-text-primary">{option}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {question.type === 'RATING' && (
                    <View className="mt-s flex-row gap-s">
                      {stars.map((value) => {
                        const selected = Number(answers[question.id]?.textValue ?? 0) >= value;
                        return (
                          <Pressable
                            key={value}
                            onPress={() => setText(question.id, String(value))}
                          >
                            <Icon
                              name={selected ? 'star' : 'star-outline'}
                              size={26}
                              color={lime}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {question.type === 'SCALE' && (
                    <View className="mt-s flex-row flex-wrap gap-s">
                      {scaleValues.map((value) => {
                        const selected = answers[question.id]?.textValue === String(value);
                        return (
                          <Pressable
                            key={value}
                            onPress={() => setText(question.id, String(value))}
                            className={`h-9 w-9 items-center justify-center rounded-avatar border ${
                              selected ? 'border-brand-primary bg-brand-primary' : 'border-border'
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${selected ? 'text-background-app' : 'text-text-secondary'}`}
                            >
                              {value}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {question.type === 'YES_NO' && (
                    <View className="mt-s flex-row gap-s">
                      {['Тийм', 'Үгүй'].map((option) => {
                        const selected = answers[question.id]?.textValue === option;
                        return (
                          <Pressable
                            key={option}
                            onPress={() => setText(question.id, option)}
                            className={`h-10 flex-1 items-center justify-center rounded-btn border ${
                              selected ? 'border-brand-primary bg-brand-primary' : 'border-border'
                            }`}
                          >
                            <Text
                              className={`text-sm font-bold ${selected ? 'text-background-app' : 'text-text-secondary'}`}
                            >
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}

              <Pressable
                disabled={submitting}
                onPress={() => void submit()}
                className="mt-l h-12 items-center justify-center rounded-btn bg-brand-primary"
              >
                <Text className="text-sm font-bold text-background-app">
                  {submitting ? 'Илгээж байна...' : 'Илгээх'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
