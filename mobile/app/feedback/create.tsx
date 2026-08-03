import { useState } from 'react';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import type { FeedbackQuestionType } from '@/types/feedback';

const questionTypeLabels: Record<FeedbackQuestionType, string> = {
  SHORT_ANSWER: 'Богино хариулт',
  LONG_ANSWER: 'Урт хариулт',
  MULTIPLE_CHOICE: 'Нэг сонголт',
  CHECKBOXES: 'Олон сонголт',
  RATING: 'Үнэлгээ (од)',
  SCALE: 'Скал (1–10)',
  YES_NO: 'Тийм / Үгүй',
};

const questionTypeIcons: Record<FeedbackQuestionType, React.ComponentProps<typeof Icon>['name']> = {
  SHORT_ANSWER: 'text-outline',
  LONG_ANSWER: 'reader-outline',
  MULTIPLE_CHOICE: 'radio-button-on-outline',
  CHECKBOXES: 'checkbox-outline',
  RATING: 'star-outline',
  SCALE: 'options-outline',
  YES_NO: 'swap-horizontal-outline',
};

const hasOptions = (type: FeedbackQuestionType) =>
  type === 'MULTIPLE_CHOICE' || type === 'CHECKBOXES';

type DraftQuestion = {
  key: string;
  type: FeedbackQuestionType;
  label: string;
  options: string[];
  required: boolean;
};

function newQuestion(): DraftQuestion {
  return {
    key: Math.random().toString(36).slice(2),
    type: 'SHORT_ANSWER',
    label: '',
    options: ['', ''],
    required: true,
  };
}

export default function CreateFeedbackFormScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion()]);
  const [typePickerFor, setTypePickerFor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateQuestion = (key: string, patch: Partial<DraftQuestion>) => {
    setQuestions((current) => current.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (key: string) => {
    setQuestions((current) => current.filter((q) => q.key !== key));
  };

  const updateOption = (key: string, index: number, value: string) => {
    setQuestions((current) =>
      current.map((q) =>
        q.key === key ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) } : q,
      ),
    );
  };

  const addOption = (key: string) => {
    setQuestions((current) =>
      current.map((q) => (q.key === key ? { ...q, options: [...q.options, ''] } : q)),
    );
  };

  const removeOption = (key: string, index: number) => {
    setQuestions((current) =>
      current.map((q) =>
        q.key === key ? { ...q, options: q.options.filter((_, i) => i !== index) } : q,
      ),
    );
  };

  const canPublish =
    title.trim().length > 0 &&
    questions.length > 0 &&
    questions.every(
      (q) =>
        q.label.trim().length > 0 &&
        (!hasOptions(q.type) || q.options.filter((o) => o.trim()).length >= 2),
    );

  const publish = async () => {
    if (!canPublish || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post<{ form: { id: string } }>('/feedback-forms', {
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q) => ({
          type: q.type,
          label: q.label.trim(),
          required: q.required,
          ...(hasOptions(q.type)
            ? { options: q.options.map((o) => o.trim()).filter(Boolean) }
            : {}),
        })),
      });
      router.replace(`/feedback/${data.form.id}`);
    } catch (value) {
      setError(getApiError(value, 'Асуулга үүсгэж чадсангүй.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="h-16 flex-row items-center justify-between border-b border-border px-l">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-base font-extrabold text-text-primary">Асуулга үүсгэх</Text>
          <Pressable disabled={!canPublish || submitting} onPress={() => void publish()}>
            <Text
              className={`text-sm font-bold ${canPublish && !submitting ? 'text-brand-primary' : 'text-text-muted'}`}
            >
              {submitting ? '...' : 'Нийтлэх'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="rounded-card border border-border bg-background-paper p-m">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Асуулгын гарчиг"
              placeholderTextColor="#A7AEB0"
              className="text-lg font-extrabold text-text-primary"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Тайлбар (заавал биш)"
              placeholderTextColor="#A7AEB0"
              multiline
              className="mt-s text-sm text-text-secondary"
            />
          </View>

          {questions.map((question, index) => (
            <View
              key={question.key}
              className="mt-m rounded-card border border-border bg-background-paper p-m"
            >
              <View className="flex-row items-start gap-s">
                <TextInput
                  value={question.label}
                  onChangeText={(value) => updateQuestion(question.key, { label: value })}
                  placeholder={`Асуулт ${index + 1}`}
                  placeholderTextColor="#A7AEB0"
                  multiline
                  className="flex-1 text-base font-bold text-text-primary"
                />
                {questions.length > 1 && (
                  <Pressable onPress={() => removeQuestion(question.key)} hitSlop={8}>
                    <Icon name="trash-outline" size={18} color="#A7AEB0" />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => setTypePickerFor(question.key)}
                className="mt-s flex-row items-center gap-s self-start rounded-avatar border border-border bg-background-app px-m py-s"
              >
                <Icon name={questionTypeIcons[question.type]} size={16} color="#9AF000" />
                <Text className="text-xs font-bold text-text-secondary">
                  {questionTypeLabels[question.type]}
                </Text>
                <Icon name="chevron-down" size={14} color="#A7AEB0" />
              </Pressable>

              {hasOptions(question.type) && (
                <View className="mt-s gap-s">
                  {question.options.map((option, optionIndex) => (
                    <View key={optionIndex} className="flex-row items-center gap-s">
                      <Icon
                        name={
                          question.type === 'CHECKBOXES'
                            ? 'checkbox-outline'
                            : 'radio-button-off-outline'
                        }
                        size={16}
                        color="#A7AEB0"
                      />
                      <TextInput
                        value={option}
                        onChangeText={(value) => updateOption(question.key, optionIndex, value)}
                        placeholder={`Сонголт ${optionIndex + 1}`}
                        placeholderTextColor="#A7AEB0"
                        className="flex-1 text-sm text-text-primary"
                      />
                      {question.options.length > 2 && (
                        <Pressable
                          onPress={() => removeOption(question.key, optionIndex)}
                          hitSlop={8}
                        >
                          <Icon name="close" size={16} color="#A7AEB0" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                  <Pressable
                    onPress={() => addOption(question.key)}
                    className="flex-row items-center gap-s"
                  >
                    <Icon name="add" size={16} color="#9AF000" />
                    <Text className="text-xs font-bold text-brand-primary">Сонголт нэмэх</Text>
                  </Pressable>
                </View>
              )}

              <View className="mt-m flex-row items-center justify-between border-t border-border pt-s">
                <Text className="text-xs text-text-muted">Заавал бөглөх</Text>
                <Switch
                  value={question.required}
                  onValueChange={(value) => updateQuestion(question.key, { required: value })}
                  trackColor={{ false: '#263033', true: '#9AF000' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          ))}

          <Pressable
            onPress={() => setQuestions((current) => [...current, newQuestion()])}
            className="mt-m h-12 flex-row items-center justify-center gap-s rounded-btn border border-border"
          >
            <Icon name="add" size={18} color="#9AF000" />
            <Text className="text-sm font-bold text-brand-primary">Асуулт нэмэх</Text>
          </Pressable>

          {!!error && <Text className="mt-m text-danger">{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={!!typePickerFor} onClose={() => setTypePickerFor(null)}>
        <Text className="mb-m text-center text-base font-extrabold text-text-primary">
          Асуултын төрөл
        </Text>
        <View className="gap-1">
          {(Object.keys(questionTypeLabels) as FeedbackQuestionType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => {
                if (typePickerFor) {
                  updateQuestion(typePickerFor, {
                    type,
                    options: hasOptions(type) ? ['', ''] : [],
                  });
                }
                setTypePickerFor(null);
              }}
              className="flex-row items-center gap-s rounded-btn px-s py-s active:bg-background-app"
            >
              <Icon name={questionTypeIcons[type]} size={18} color="#9AF000" />
              <Text className="text-sm font-medium text-text-primary">
                {questionTypeLabels[type]}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
