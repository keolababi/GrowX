import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { AppPageHeader } from '@/components/AppPageHeader';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import type { FeedbackResponsesPayload } from '@/types/feedback';
import { useColorMode } from '@/providers/ColorModeProvider';

function QuestionSummary({
  question,
  responses,
}: {
  question: FeedbackResponsesPayload['questions'][number];
  responses: FeedbackResponsesPayload['responses'];
}) {
  const answers = responses
    .map((response) => response.answers.find((answer) => answer.questionId === question.id))
    .filter((answer): answer is NonNullable<typeof answer> => !!answer);

  const isChoice =
    question.type === 'MULTIPLE_CHOICE' ||
    question.type === 'CHECKBOXES' ||
    question.type === 'YES_NO';
  const isNumeric = question.type === 'RATING' || question.type === 'SCALE';

  const tally = useMemo(() => {
    if (!isChoice) return [];
    const counts = new Map<string, number>();
    const options = question.options ?? (question.type === 'YES_NO' ? ['Тийм', 'Үгүй'] : []);
    for (const option of options) counts.set(option, 0);
    for (const answer of answers) {
      for (const value of answer.optionsValue ?? (answer.textValue ? [answer.textValue] : [])) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries());
  }, [answers, isChoice, question.options, question.type]);

  const average = useMemo(() => {
    if (!isNumeric) return null;
    const values = answers
      .map((answer) => Number(answer.textValue))
      .filter((value) => !Number.isNaN(value));
    if (!values.length) return null;
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  }, [answers, isNumeric]);

  return (
    <View className="mt-m rounded-card border border-border bg-background-paper p-m">
      <Text className="text-sm font-bold text-text-primary">{question.label}</Text>
      <Text className="mt-1 text-xs text-text-muted">{answers.length} хариулт</Text>

      {isChoice && (
        <View className="mt-s gap-s">
          {tally.map(([option, count]) => {
            const pct = answers.length ? Math.round((count / answers.length) * 100) : 0;
            return (
              <View key={option}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-text-secondary">{option}</Text>
                  <Text className="text-xs font-bold text-text-muted">
                    {count} · {pct}%
                  </Text>
                </View>
                <View className="mt-1 h-2 overflow-hidden rounded-avatar bg-background-app">
                  <View
                    className="h-full rounded-avatar bg-brand-primary"
                    style={{ width: `${pct}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {isNumeric && (
        <Text className="mt-s text-2xl font-extrabold text-brand-primary">{average ?? '—'}</Text>
      )}

      {!isChoice && !isNumeric && (
        <View className="mt-s gap-s">
          {answers.map((answer, index) => (
            <View key={index} className="rounded-btn bg-background-app p-s">
              <Text className="text-sm text-text-primary">{answer.textValue || '—'}</Text>
            </View>
          ))}
          {!answers.length && <Text className="text-xs text-text-muted">Хариулт алга.</Text>}
        </View>
      )}
    </View>
  );
}

export default function FeedbackResponsesScreen() {
  const { iconAccent: lime } = useColorMode();
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const [data, setData] = useState<FeedbackResponsesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!formId) return;
    api
      .get<FeedbackResponsesPayload>(`/feedback-forms/${formId}/responses`)
      .then(({ data: payload }) => setData(payload))
      .catch((value) => setError(getApiError(value, 'Хариултуудыг ачаалж чадсангүй.')))
      .finally(() => setLoading(false));
  }, [formId]);

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <AppPageHeader title="Хариултууд" back />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={lime} size="large" />
        </View>
      ) : (
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
          {!!error && <Text className="text-danger">{error}</Text>}
          {data && (
            <>
              <Text className="text-sm text-text-muted">{data.responses.length} нийт хариулт</Text>
              {data.questions.map((question) => (
                <QuestionSummary key={question.id} question={question} responses={data.responses} />
              ))}
              {!data.questions.length && (
                <Text className="pt-20 text-center text-text-muted">Асуулт алга.</Text>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
