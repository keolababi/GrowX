import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppPageHeader } from '@/components/AppPageHeader';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { lessons as fallbackLessons } from '@/data/lessons';
import { useColorMode } from '@/providers/ColorModeProvider';
import { api } from '@/services/api';
import { useLearningStore } from '@/store/learningStore';
import type { Lesson, LessonCategory } from '@/types/learning';

const categories: Array<LessonCategory | 'Бүгд'> = [
  'Бүгд',
  'Стартап',
  'Бизнес',
  'Маркетинг',
  'Борлуулалт',
  'Санхүү',
  'Татвар',
  'Хууль',
  'Бүтээгдэхүүн',
  'Хөрөнгө оруулалт',
  'Манлайлал',
  'Багийн менежмент',
];

export default function LessonsScreen() {
  const { colors } = useColorMode();
  const [category, setCategory] = useState<(typeof categories)[number]>('Бүгд');
  const [lessons, setLessons] = useState<Lesson[]>(fallbackLessons);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const completedIds = useLearningStore((state) => state.completedIds);
  const startedIds = useLearningStore((state) => state.startedIds);
  const hydrate = useLearningStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ lessons: Lesson[] }>('/lessons');
      if (data.lessons.length) setLessons(data.lessons);
      setError('');
    } catch {
      setError('Сервертэй холбогдож чадсангүй. Хадгалсан хичээлүүдийг харуулж байна.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => category === 'Бүгд' || lesson.category === category),
    [category, lessons],
  );
  const completedCount = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const progress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <AppPageHeader title="Хичээлүүд" back maxWidth={900} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.heroIcon, { backgroundColor: colors.surfaceSoft }]}>
            <Icon name="book-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>GrowX хичээлүүд</Text>
            <Text style={[styles.heroDescription, { color: colors.muted }]}>
              Бизнесээ хөгжүүлэх богино, практик хичээлүүд
            </Text>
            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSoft }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.primary }]}>{progress}%</Text>
            </View>
            <Text style={[styles.progressHint, { color: colors.muted }]}>
              {lessons.length} хичээлээс {completedCount}-ыг дуусгасан
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {categories.map((item) => {
            const selected = category === item;
            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.category,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: selected ? colors.ink : colors.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.headingRow}>
          <Text style={[styles.heading, { color: colors.text }]}>
            {category === 'Бүгд' ? 'Бүх хичээл' : `${category} хичээлүүд`}
          </Text>
          <Text style={[styles.count, { color: colors.muted }]}>
            {visibleLessons.length} хичээл
          </Text>
        </View>

        {!!error && (
          <View style={[styles.notice, { backgroundColor: colors.surfaceSoft }]}>
            <Icon name="cloud-offline-outline" size={17} color={colors.muted} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{error}</Text>
          </View>
        )}

        {loading && !lessons.length ? (
          <Loader size={34} style={styles.loader} />
        ) : (
          <View style={styles.list}>
            {visibleLessons.map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                number={index + 1}
                completed={completedIds.has(lesson.id)}
                started={startedIds.has(lesson.id)}
              />
            ))}
            {!visibleLessons.length && (
              <View
                style={[
                  styles.empty,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Icon name="book-outline" size={32} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Хичээл олдсонгүй</Text>
                <Text style={{ color: colors.muted }}>Өөр ангилал сонгоод үзээрэй.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LessonRow({
  lesson,
  number,
  completed,
  started,
}: {
  lesson: Lesson;
  number: number;
  completed: boolean;
  started: boolean;
}) {
  const { colors } = useColorMode();
  return (
    <Pressable
      onPress={() => router.push(`/medlege/${lesson.id}`)}
      style={({ pressed }) => [
        styles.lesson,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.lessonNumber, { backgroundColor: colors.surfaceSoft }]}>
        {completed ? (
          <Icon name="checkmark" size={18} color={colors.primary} />
        ) : (
          <Text style={[styles.lessonNumberText, { color: colors.primary }]}>{number}</Text>
        )}
      </View>
      <View style={styles.lessonCopy}>
        <View style={styles.badges}>
          <Text
            style={[styles.badge, { color: colors.primary, backgroundColor: colors.surfaceSoft }]}
          >
            {lesson.category}
          </Text>
          <Text
            style={[styles.badge, { color: colors.muted, backgroundColor: colors.surfaceRaised }]}
          >
            {lesson.difficulty}
          </Text>
        </View>
        <Text numberOfLines={2} style={[styles.lessonTitle, { color: colors.text }]}>
          {lesson.title}
        </Text>
        <Text numberOfLines={2} style={[styles.lessonDescription, { color: colors.muted }]}>
          {lesson.description}
        </Text>
        <View style={styles.meta}>
          <Icon name="time-outline" size={14} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.muted }]}>{lesson.durationMin} мин</Text>
          {started && !completed && (
            <Text style={[styles.started, { color: colors.primary }]}>· Үргэлжлүүлэх</Text>
          )}
        </View>
      </View>
      <View style={[styles.openButton, { backgroundColor: colors.primary }]}>
        <Icon name={completed ? 'checkmark' : 'arrow-forward'} size={18} color={colors.ink} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 20, paddingBottom: 52 },
  hero: { borderWidth: 1, borderRadius: 22, padding: 20, flexDirection: 'row', gap: 16 },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { fontSize: 22, fontWeight: '900' },
  heroDescription: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  progressTrack: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', minWidth: 4, borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '900' },
  progressHint: { fontSize: 11, marginTop: 7 },
  categories: { gap: 8, paddingVertical: 20 },
  category: {
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: { fontSize: 12, fontWeight: '800' },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heading: { fontSize: 19, fontWeight: '900' },
  count: { fontSize: 12, fontWeight: '700' },
  notice: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  loader: { marginTop: 40 },
  list: { gap: 10 },
  lesson: {
    minHeight: 126,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonNumber: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberText: { fontSize: 15, fontWeight: '900' },
  lessonCopy: { flex: 1, minWidth: 0 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: '900',
  },
  lessonTitle: { fontSize: 15, lineHeight: 20, fontWeight: '900', marginTop: 7 },
  lessonDescription: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  metaText: { fontSize: 10, fontWeight: '700' },
  started: { fontSize: 10, fontWeight: '800' },
  openButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.994 }] },
  empty: {
    minHeight: 190,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
});
