import { useRef, useState } from 'react';
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
import { AppPageHeader } from '@/components/AppPageHeader';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import type { FeedbackQuestionType } from '@/types/feedback';
import { useColorMode } from '@/providers/ColorModeProvider';

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
  const { iconAccent } = useColorMode();
  const titleInputRef = useRef<TextInput>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion()]);
  const [typePickerFor, setTypePickerFor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateQuestion = (key: string, patch: Partial<DraftQuestion>) => {
    setError('');
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

  const getValidationError = () => {
    if (!title.trim()) return 'Асуулгын гарчиг оруулна уу.';
    if (!questions.length) return 'Хамгийн багадаа нэг асуулт нэмнэ үү.';

    const emptyQuestionIndex = questions.findIndex((question) => !question.label.trim());
    if (emptyQuestionIndex >= 0) return `Асуулт ${emptyQuestionIndex + 1}-ийн текстийг оруулна уу.`;

    const invalidOptionsIndex = questions.findIndex(
      (question) =>
        hasOptions(question.type) && question.options.filter((option) => option.trim()).length < 2,
    );
    if (invalidOptionsIndex >= 0) {
      return `Асуулт ${invalidOptionsIndex + 1}-д хамгийн багадаа хоёр сонголт оруулна уу.`;
    }

    return '';
  };

  const publish = async () => {
    if (submitting) return;
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      if (!title.trim()) titleInputRef.current?.focus();
      return;
    }
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
        <AppPageHeader
          title="Асуулга үүсгэх"
          back
          actions={
            <Pressable
              disabled={submitting}
              onPress={() => void publish()}
              accessibilityRole="button"
              accessibilityLabel="Асуулга нийтлэх"
              hitSlop={10}
            >
              <Text
                className={`text-sm font-bold ${submitting ? 'text-text-muted' : 'text-brand-primary'}`}
              >
                {submitting ? '...' : 'Нийтлэх'}
              </Text>
            </Pressable>
          }
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            width: '100%',
            maxWidth: 900,
            alignSelf: 'center',
            padding: 20,
            paddingBottom: 48,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {!!error && (
            <View className="mb-m rounded-btn border border-danger/40 bg-danger/10 px-m py-s">
              <Text className="text-sm font-semibold text-danger">{error}</Text>
            </View>
          )}

          <View className="rounded-card border border-border bg-background-paper p-m">
            <Text className="mb-2 text-xs font-bold text-text-secondary">
              Гарчиг <Text className="text-danger">*</Text>
            </Text>
            <TextInput
              ref={titleInputRef}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setError('');
              }}
              placeholder="Жишээ: Үйлчилгээний санал хүсэлт"
              placeholderTextColor="#A7AEB0"
              className="text-lg font-extrabold text-text-primary"
            />
            <View className="my-s h-px bg-border" />
            <Text className="mb-1 text-xs font-bold text-text-secondary">
              Тайлбар <Text className="font-normal text-text-muted">(заавал биш)</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Асуулгынхаа талаар товч тайлбар бичнэ үү"
              placeholderTextColor="#A7AEB0"
              multiline
              className="text-sm text-text-primary"
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
                <Icon name={questionTypeIcons[question.type]} size={16} color={iconAccent} />
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
                    <Icon name="add" size={16} color={iconAccent} />
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
            <Icon name="add" size={18} color={iconAccent} />
            <Text className="text-sm font-bold text-brand-primary">Асуулт нэмэх</Text>
          </Pressable>
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
              <Icon name={questionTypeIcons[type]} size={18} color={iconAccent} />
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
