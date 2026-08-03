import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { lessons } from '@/data/lessons';
import { useLearningStore } from '@/store/learningStore';

export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = lessons.find((item) => item.id === lessonId);
  const startedIds = useLearningStore((state) => state.startedIds);
  const completedIds = useLearningStore((state) => state.completedIds);
  const markStarted = useLearningStore((state) => state.markStarted);
  const toggleCompleted = useLearningStore((state) => state.toggleCompleted);
  const hydrate = useLearningStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (lesson) markStarted(lesson.id);
  }, [lesson, markStarted]);

  if (!lesson) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-app">
        <Text className="text-text-muted">Хичээл олдсонгүй.</Text>
      </SafeAreaView>
    );
  }

  const completed = completedIds.has(lesson.id);
  const started = startedIds.has(lesson.id);

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <View className="h-16 flex-row items-center justify-between border-b border-border px-l">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="text-base font-extrabold text-text-primary">Хичээл</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <View className="flex-row items-center gap-s">
          <Badge label={lesson.category} variant="muted" />
          <Badge label={lesson.difficulty} variant="brand" />
        </View>

        <Text className="mt-m text-2xl font-extrabold leading-8 text-text-primary">
          {lesson.title}
        </Text>

        <View className="mt-s flex-row items-center gap-s">
          <Icon name="time-outline" size={16} color="#A7AEB0" />
          <Text className="text-sm text-text-muted">{lesson.durationMin} минут</Text>
          {started && (
            <Text className="text-sm font-bold text-brand-primary">
              {completed ? '· Дуусгасан' : '· Эхэлсэн'}
            </Text>
          )}
        </View>

        <Text className="mt-l text-base leading-6 text-text-secondary">{lesson.content}</Text>

        <Pressable
          onPress={() => toggleCompleted(lesson.id)}
          className={`mt-xl h-12 items-center justify-center rounded-btn ${
            completed ? 'border border-border' : 'bg-brand-primary'
          }`}
        >
          <Text
            className={`text-sm font-bold ${completed ? 'text-text-secondary' : 'text-background-app'}`}
          >
            {completed ? 'Дуусгасан гэж тэмдэглэсэн ✓' : 'Дуусгасан гэж тэмдэглэх'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
