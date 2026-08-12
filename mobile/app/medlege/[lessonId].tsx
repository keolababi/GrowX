import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { AppPageHeader } from '@/components/AppPageHeader';
import { lessons as fallbackLessons } from '@/data/lessons';
import { api } from '@/services/api';
import { useLearningStore } from '@/store/learningStore';
import type { Lesson } from '@/types/learning';
import { useColorMode } from '@/providers/ColorModeProvider';

// Same fix as profile/messages/posts/mentor/discover/feedback: nested
// `flex-1` via className doesn't reliably collapse to the remaining space
// on native Yoga, which was rendering this screen's content blank.
const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: 0, width: '100%' },
  centerState: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexMin0: { flex: 1, minHeight: 0 },
});

export default function LessonDetailScreen() {
  const { colors } = useColorMode();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const fallbackLesson = fallbackLessons.find((item) => item.id === lessonId);
  const [lesson, setLesson] = useState<Lesson | undefined>(fallbackLesson);
  const [loading, setLoading] = useState(true);
  const startedIds = useLearningStore((state) => state.startedIds);
  const completedIds = useLearningStore((state) => state.completedIds);
  const markStarted = useLearningStore((state) => state.markStarted);
  const toggleCompleted = useLearningStore((state) => state.toggleCompleted);
  const hydrate = useLearningStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    setLoading(true);
    setLesson(fallbackLesson);
    void api
      .get<{ lesson: Lesson }>(`/lessons/${lessonId}`)
      .then(({ data }) => {
        if (active) setLesson(data.lesson);
      })
      .catch(() => {
        // The bundled copy keeps existing lessons readable while offline.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fallbackLesson, lessonId]);

  useEffect(() => {
    if (lesson) markStarted(lesson.id);
  }, [lesson, markStarted]);

  if (loading && !lesson) {
    return (
      <SafeAreaView className="bg-background-app" style={styles.centerState}>
        <Loader size={44} />
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView className="bg-background-app" style={styles.centerState}>
        <Text className="text-text-muted">Хичээл олдсонгүй.</Text>
      </SafeAreaView>
    );
  }

  const completed = completedIds.has(lesson.id);
  const started = startedIds.has(lesson.id);

  return (
    <SafeAreaView className="bg-background-app" style={styles.safeArea}>
      <AppPageHeader title="Хичээл" back />

      <ScrollView
        style={styles.flexMin0}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 900,
          alignSelf: 'center',
          padding: 24,
          paddingBottom: 48,
        }}
      >
        <View className="flex-row items-center gap-s">
          <Badge label={lesson.category} variant="muted" />
          <Badge label={lesson.difficulty} variant="brand" />
        </View>

        <Text className="mt-m text-2xl font-extrabold leading-8 text-text-primary">
          {lesson.title}
        </Text>

        <View className="mt-s flex-row items-center gap-s">
          <Icon name="time-outline" size={16} color={colors.muted} />
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
          className={`mt-xl h-12 flex-row items-center justify-center gap-s rounded-btn ${
            completed ? 'border border-border' : 'bg-brand-primary'
          }`}
        >
          {completed && <Icon name="checkmark-circle" size={18} color={colors.textSecondary} />}
          <Text
            className={`text-sm font-bold ${completed ? 'text-text-secondary' : 'text-background-app'}`}
          >
            {completed ? 'Дуусгасан гэж тэмдэглэсэн' : 'Дуусгасан гэж тэмдэглэх'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
