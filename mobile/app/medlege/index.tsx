import { useEffect, useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { NotificationBell } from '@/components/NotificationBell';
import { AppBottomNav } from '@/components/AppBottomNav';
import { GrowXMark } from '@/components/GrowXLogo';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { lessons } from '@/data/lessons';
import { useLearningStore } from '@/store/learningStore';
import type { LessonCategory } from '@/types/learning';

const categories: (LessonCategory | 'Бүгд')[] = [
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

const knowledgeShortcuts = [
  { label: 'Ментор', icon: 'person-outline' as const, route: '/mentor' as const },
  { label: 'Community', icon: 'people-outline' as const, route: '/community' as const },
  {
    label: 'Feedback',
    icon: 'chatbox-ellipses-outline' as const,
    route: '/feedback' as const,
  },
  { label: 'Podcast', icon: 'mic-outline' as const, route: '/podcast' as const },
];

const webKnowledgeScrollStyle = {
  height: 'calc(100vh - 85px)',
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 'auto',
  overflowY: 'auto',
} as unknown as ViewStyle;

export default function KnowledgeScreen() {
  const [category, setCategory] = useState<(typeof categories)[number]>('Бүгд');
  const completedIds = useLearningStore((state) => state.completedIds);
  const startedIds = useLearningStore((state) => state.startedIds);
  const hydrate = useLearningStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const visibleLessons = useMemo(() => {
    return lessons.filter((lesson) => category === 'Бүгд' || lesson.category === category);
  }, [category]);

  const completedCount = lessons.filter((lesson) => completedIds.has(lesson.id)).length;

  return (
    <SafeAreaView className="min-h-0 flex-1 overflow-hidden bg-background-app">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="min-h-0 flex-1"
        style={Platform.OS === 'web' ? webKnowledgeScrollStyle : undefined}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="w-full max-w-[900px] self-center">
          <View className="h-16 flex-row items-center justify-between px-l">
            <Text className="text-3xl font-extrabold text-text-primary">Мэдлэг</Text>
            <View className="ml-m min-w-0 flex-1 flex-row items-center justify-end gap-s">
              <Pressable
                onPress={() => router.push('/discover')}
                accessibilityRole="button"
                accessibilityLabel="Хайлт нээх"
                className="h-10 w-10 items-center justify-center rounded-avatar border border-border bg-background-paper active:opacity-70"
              >
                <Icon name="search-outline" size={20} color="#9AF000" />
              </Pressable>
              <NotificationBell />
            </View>
          </View>

          <View className="mx-l mb-s min-h-[210px] overflow-hidden rounded-[22px] border border-[#173126] bg-[#0B2119] px-xl py-l">
            <View className="flex-1 flex-row items-center">
              <View className="flex-1">
                <Text className="text-[28px] font-bold leading-9 text-text-primary">
                  Бизнесээ{`\n`}дараагийн
                </Text>
                <Text className="mt-1 text-base text-text-secondary">
                  түвшинд <Text className="font-bold text-brand-primary">хүргэе.</Text>
                </Text>
                <Pressable
                  onPress={() => router.push(`/medlege/${lessons[0].id}`)}
                  className="mt-l h-11 w-[120px] flex-row items-center justify-center gap-s rounded-btn bg-brand-primary active:opacity-80"
                >
                  <Text className="font-bold text-background-app">Эхлэх</Text>
                  <Icon name="arrow-forward" size={18} color="#020B0D" />
                </Pressable>
              </View>
              <View className="w-[42%] items-center justify-center">
                <GrowXMark size={155} />
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-s px-l pb-s">
            {knowledgeShortcuts.map((shortcut) => (
              <Pressable
                key={shortcut.label}
                onPress={() => router.push(shortcut.route)}
                className="min-w-[150px] flex-1 basis-[20%] items-center justify-center gap-s rounded-card border border-border bg-background-paper py-l active:opacity-70"
              >
                <Icon name={shortcut.icon} size={25} color="#9AF000" />
                <Text className="text-xs font-bold text-text-secondary">{shortcut.label}</Text>
              </Pressable>
            ))}
          </View>

          {!!completedCount && (
            <Text className="px-l pb-s text-xs font-bold text-brand-primary">
              {completedCount}/{lessons.length} хичээл дуусгасан
            </Text>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 22, paddingBottom: 16 }}
          >
            {categories.map((item) => (
              <Tag
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
              />
            ))}
          </ScrollView>

          <View className="gap-s px-l">
            {visibleLessons.map((lesson) => {
              const completed = completedIds.has(lesson.id);
              const started = startedIds.has(lesson.id);
              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => router.push(`/medlege/${lesson.id}`)}
                  className="rounded-card border border-border bg-background-paper p-m"
                >
                  <View className="flex-row items-center gap-s">
                    <Badge label={lesson.category} variant="muted" />
                    <Badge label={lesson.difficulty} variant="brand" />
                    {completed && <Badge label="Дуусгасан" variant="success" />}
                  </View>
                  <Text className="mt-s text-base font-extrabold text-text-primary">
                    {lesson.title}
                  </Text>
                  <Text numberOfLines={2} className="mt-1 text-sm leading-5 text-text-muted">
                    {lesson.description}
                  </Text>
                  <View className="mt-s flex-row items-center gap-s">
                    <Icon name="time-outline" size={14} color="#A7AEB0" />
                    <Text className="text-xs text-text-muted">{lesson.durationMin} мин</Text>
                    {started && !completed && (
                      <Text className="text-xs font-bold text-brand-primary">· Эхэлсэн</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
            {!visibleLessons.length && (
              <Text className="pt-12 text-center text-text-muted">Хичээл олдсонгүй.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <AppBottomNav />
    </SafeAreaView>
  );
}
