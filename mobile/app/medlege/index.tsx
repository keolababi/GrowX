import { useEffect, useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { NotificationBell } from '@/components/NotificationBell';
import { AppBottomNav } from '@/components/AppBottomNav';
import { AppPageHeader } from '@/components/AppPageHeader';
import { GlobalSearchButton } from '@/components/GlobalSearchButton';
import { GrowXMark } from '@/components/GrowXLogo';
import { Icon } from '@/components/ui/Icon';
import { lessons as fallbackLessons } from '@/data/lessons';
import { api } from '@/services/api';
import { useLearningStore } from '@/store/learningStore';
import type { Lesson, LessonCategory } from '@/types/learning';
import { useColorMode } from '@/providers/ColorModeProvider';

const lime = '#9AF000';
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

const webKnowledgeScrollStyle = {
  height: 'calc(100vh - 85px)',
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 'auto',
  overflowY: 'auto',
} as unknown as ViewStyle;

type Shortcut = {
  label: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  onPress: () => void;
};

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { iconAccent, colors } = useColorMode();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {!!action && !!onAction && (
        <Pressable onPress={onAction} style={styles.sectionAction}>
          <Text style={[styles.sectionActionText, { color: iconAccent }]}>{action}</Text>
          <Icon name="chevron-forward" size={16} color={iconAccent} />
        </Pressable>
      )}
    </View>
  );
}

function LessonCard({
  lesson,
  completed,
  started,
  featured = false,
  compact = false,
}: {
  lesson: Lesson;
  completed: boolean;
  started: boolean;
  featured?: boolean;
  compact?: boolean;
}) {
  const { iconAccent, colors } = useColorMode();
  return (
    <Pressable
      onPress={() => router.push(`/medlege/${lesson.id}`)}
      style={({ pressed }) => [
        featured ? styles.featuredLesson : styles.lessonCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        featured && compact && styles.featuredLessonCompact,
        pressed && styles.cardPressed,
      ]}
    >
      {featured && (
        <View
          style={[
            styles.lessonArtwork,
            { backgroundColor: colors.surfaceSoft },
            compact && styles.lessonArtworkCompact,
          ]}
        >
          <View style={[styles.targetOuter, { borderColor: colors.borderStrong }]}>
            <View style={[styles.targetMiddle, { borderColor: colors.primary }]}>
              <Icon name="trending-up" size={35} color={iconAccent} />
            </View>
          </View>
        </View>
      )}
      <View style={styles.lessonCopy}>
        <View style={styles.lessonBadges}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSoft }]}>
            <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
              {lesson.category}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: colors.surfaceRaised }]}>
            <Text style={[styles.difficultyBadgeText, { color: colors.muted }]}>
              {lesson.difficulty}
            </Text>
          </View>
          {completed && (
            <View style={[styles.completedBadge, { backgroundColor: colors.primary }]}>
              <Icon name="checkmark" size={12} color={colors.ink} />
              <Text style={[styles.completedBadgeText, { color: colors.ink }]}>Дууссан</Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={featured ? 2 : 1}
          style={[featured ? styles.featuredTitle : styles.lessonTitle, { color: colors.text }]}
        >
          {lesson.title}
        </Text>
        <Text numberOfLines={2} style={[styles.lessonDescription, { color: colors.muted }]}>
          {lesson.description}
        </Text>
        <View style={styles.lessonMeta}>
          <Icon name="time-outline" size={15} color={colors.muted} />
          <Text style={[styles.lessonMetaText, { color: colors.muted }]}>
            {lesson.durationMin} мин
          </Text>
          {started && !completed && (
            <Text style={[styles.startedText, { color: colors.primary }]}>· Үргэлжлүүлэх</Text>
          )}
        </View>
      </View>
      <View
        style={[
          featured ? styles.featuredPlay : styles.lessonArrow,
          { backgroundColor: colors.primary },
          featured && compact && styles.featuredPlayCompact,
        ]}
      >
        <Icon
          name={completed ? 'checkmark' : started ? 'play' : 'arrow-forward'}
          size={featured ? 22 : 18}
          color={colors.ink}
        />
      </View>
    </Pressable>
  );
}

export default function KnowledgeScreen() {
  const { iconAccent, colors } = useColorMode();
  const { width } = useWindowDimensions();
  const compact = width < 680;
  const [category, setCategory] = useState<(typeof categories)[number]>('Бүгд');
  const [lessonCatalog, setLessonCatalog] = useState<Lesson[]>(fallbackLessons);
  const completedIds = useLearningStore((state) => state.completedIds);
  const startedIds = useLearningStore((state) => state.startedIds);
  const hydrate = useLearningStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    let active = true;
    void api
      .get<{ lessons: Lesson[] }>('/lessons')
      .then(({ data }) => {
        if (active && data.lessons.length) setLessonCatalog(data.lessons);
      })
      .catch(() => {
        // Keep bundled lessons available when the API is temporarily offline.
      });
    return () => {
      active = false;
    };
  }, []);

  const completedCount = lessonCatalog.filter((lesson) => completedIds.has(lesson.id)).length;
  const progress = lessonCatalog.length
    ? Math.round((completedCount / lessonCatalog.length) * 100)
    : 0;
  const nextLesson =
    lessonCatalog.find((lesson) => startedIds.has(lesson.id) && !completedIds.has(lesson.id)) ??
    lessonCatalog.find((lesson) => !completedIds.has(lesson.id)) ??
    lessonCatalog[0];

  const visibleLessons = useMemo(
    () => lessonCatalog.filter((lesson) => category === 'Бүгд' || lesson.category === category),
    [category, lessonCatalog],
  );
  const recommendedLesson =
    visibleLessons.find((lesson) => !completedIds.has(lesson.id)) ?? visibleLessons[0];

  const shortcuts: Shortcut[] = [
    {
      label: 'Хичээл',
      icon: 'book-outline',
      onPress: () => nextLesson && router.push(`/medlege/${nextLesson.id}`),
    },
    {
      label: 'Podcast',
      icon: 'headset-outline',
      onPress: () => router.push('/podcast'),
    },
    {
      label: 'Ментор',
      icon: 'school-outline',
      onPress: () => router.push('/mentor'),
    },
    {
      label: 'Community',
      icon: 'people-outline',
      onPress: () => router.push('/community'),
    },
    {
      label: 'Feedback',
      icon: 'chatbox-ellipses-outline',
      onPress: () => router.push('/feedback'),
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={[styles.scroll, Platform.OS === 'web' && webKnowledgeScrollStyle]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <AppPageHeader
            title="Мэдлэг"
            maxWidth={900}
            actions={
              <>
                <GlobalSearchButton />
                <NotificationBell />
              </>
            }
          />

          <View
            style={[
              styles.progressHero,
              { backgroundColor: colors.surface, borderColor: colors.border },
              compact && styles.progressHeroCompact,
            ]}
          >
            <View style={styles.progressCopy}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>ТАНЫ СУРАЛЦАХ ЗАМ</Text>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                Бизнесийн сууриа бэхжүүлье
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
                <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress}%</Text>
              </View>
              <Text style={[styles.progressDescription, { color: colors.muted }]}>
                {lessonCatalog.length} хичээлээс {completedCount}-ыг дуусгасан
              </Text>
              <Pressable
                disabled={!nextLesson}
                onPress={() => nextLesson && router.push(`/medlege/${nextLesson.id}`)}
                style={[styles.continueButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.continueText, { color: colors.ink }]}>
                  {completedCount === lessonCatalog.length ? 'Дахин үзэх' : 'Үргэлжлүүлэх'}
                </Text>
                <Icon name="chevron-forward" size={18} color={colors.ink} />
              </Pressable>
            </View>
            <View style={[styles.progressVisual, compact && styles.progressVisualCompact]}>
              <View
                style={[
                  styles.progressCircle,
                  { backgroundColor: colors.surfaceSoft, borderColor: colors.primary },
                  compact && styles.progressCircleCompact,
                ]}
              >
                <View style={[styles.progressCircleInner, { backgroundColor: colors.surface }]}>
                  <GrowXMark size={compact ? 60 : 78} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.shortcutGrid}>
            {shortcuts.map((shortcut) => (
              <Pressable
                key={shortcut.label}
                onPress={shortcut.onPress}
                style={({ pressed }) => [
                  styles.shortcutCard,
                  compact && styles.shortcutCardCompact,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && styles.cardPressed,
                ]}
              >
                <Icon name={shortcut.icon} size={28} color={iconAccent} />
                <Text style={[styles.shortcutLabel, { color: colors.textSecondary }]}>
                  {shortcut.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {categories.map((item) => {
              const selected = category === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryChip,
                    !selected && { backgroundColor: colors.surface, borderColor: colors.border },
                    selected && [
                      styles.categoryChipSelected,
                      { backgroundColor: colors.primary, borderColor: colors.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      !selected && { color: colors.textSecondary },
                      selected && [styles.categoryTextSelected, { color: colors.ink }],
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {!!recommendedLesson && (
            <>
              <SectionHeader
                title="Танд санал болгох хичээл"
                action="Бүгдийг харах"
                onAction={() => setCategory('Бүгд')}
              />
              <LessonCard
                lesson={recommendedLesson}
                completed={completedIds.has(recommendedLesson.id)}
                started={startedIds.has(recommendedLesson.id)}
                featured
                compact={compact}
              />
            </>
          )}

          <SectionHeader
            title="Сонсож эхлэх"
            action="Бүгдийг харах"
            onAction={() => router.push('/podcast')}
          />
          <Pressable
            onPress={() => router.push('/podcast')}
            style={({ pressed }) => [
              styles.mediaCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.cardPressed,
            ]}
          >
            <View style={[styles.podcastArt, { backgroundColor: colors.surfaceSoft }]}>
              <Text style={[styles.podcastBrand, { color: colors.text }]}>GrowX</Text>
              <Icon name="mic" size={30} color={iconAccent} />
              <Text style={[styles.podcastWord, { color: colors.text }]}>PODCAST</Text>
            </View>
            <View style={styles.mediaCopy}>
              <Text numberOfLines={2} style={[styles.mediaTitle, { color: colors.text }]}>
                Санаанаас бодит бизнес хүртэл
              </Text>
              <Text style={[styles.mediaMeta, { color: colors.muted }]}>
                GrowX Podcast · Шинэ дугаарууд
              </Text>
            </View>
            <View style={[styles.roundAction, { backgroundColor: colors.primary }]}>
              <Icon name="play" size={20} color={colors.ink} />
            </View>
          </Pressable>

          <SectionHeader
            title="Ментороос асуух"
            action="Бүгдийг харах"
            onAction={() => router.push('/mentor')}
          />
          <Pressable
            onPress={() => router.push('/mentor')}
            style={({ pressed }) => [
              styles.mentorCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.cardPressed,
            ]}
          >
            <View
              style={[
                styles.mentorAvatar,
                { backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong },
              ]}
            >
              <Icon name="school-outline" size={28} color={iconAccent} />
            </View>
            <View style={styles.mediaCopy}>
              <Text style={[styles.mediaTitle, { color: colors.text }]}>
                Туршлагатай ментортой холбогдох
              </Text>
              <Text style={[styles.mediaMeta, { color: colors.muted }]}>
                Бизнес · Маркетинг · Санхүү · Бүтээгдэхүүн
              </Text>
            </View>
            <View style={[styles.profileButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.profileButtonText, { color: colors.ink }]}>Профайл харах</Text>
            </View>
          </Pressable>

          <SectionHeader title={category === 'Бүгд' ? 'Бүх хичээл' : `${category} хичээлүүд`} />
          <View style={styles.lessonList}>
            {visibleLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                completed={completedIds.has(lesson.id)}
                started={startedIds.has(lesson.id)}
              />
            ))}
            {!visibleLessons.length && (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderStrong },
                ]}
              >
                <Icon name="book-outline" size={29} color={iconAccent} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Хичээл олдсонгүй</Text>
                <Text style={[styles.emptyCopy, { color: colors.muted }]}>
                  Өөр ангилал сонгоод дахин үзээрэй.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#020B0D' },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { paddingBottom: 30 },
  page: { width: '100%', maxWidth: 900, alignSelf: 'center', paddingHorizontal: 20 },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1B17',
    borderWidth: 1,
    borderColor: '#263D35',
  },
  progressHero: {
    minHeight: 264,
    padding: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#204236',
    backgroundColor: '#08231A',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressHeroCompact: { minHeight: 0, padding: 20 },
  progressCopy: { flex: 1, minWidth: 0, zIndex: 2 },
  eyebrow: { color: lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  progressTitle: {
    color: '#F7FAF8',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 7,
    maxWidth: 430,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 21 },
  progressTrack: {
    flex: 1,
    maxWidth: 330,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#415049',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', minWidth: 5, borderRadius: 4, backgroundColor: lime },
  progressPercent: { color: lime, fontSize: 22, fontWeight: '900' },
  progressDescription: { color: '#91A099', fontSize: 13, marginTop: 11 },
  continueButton: {
    alignSelf: 'flex-start',
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  continueText: { color: '#071209', fontSize: 13, fontWeight: '900' },
  progressVisual: { width: '34%', alignItems: 'center', justifyContent: 'center' },
  progressVisualCompact: { width: 105, opacity: 0.92 },
  progressCircle: {
    width: 164,
    height: 164,
    maxWidth: '100%',
    aspectRatio: 1,
    borderRadius: 82,
    borderWidth: 15,
    borderColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12271F',
  },
  progressCircleInner: {
    width: '76%',
    height: '76%',
    borderRadius: 999,
    backgroundColor: '#071712',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleCompact: { width: 102, height: 102, borderRadius: 51, borderWidth: 10 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  shortcutCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 105,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#223A32',
    backgroundColor: '#0B1A17',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 5,
  },
  shortcutCardCompact: { flexBasis: '30%', minWidth: '30%' },
  shortcutLabel: { color: '#C8D1CD', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.993 }] },
  categoryList: { gap: 9, paddingVertical: 22 },
  categoryChip: {
    height: 40,
    paddingHorizontal: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#293B35',
    backgroundColor: '#0A1614',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipSelected: { backgroundColor: lime, borderColor: lime },
  categoryText: { color: '#AEB9B4', fontSize: 12, fontWeight: '800' },
  categoryTextSelected: { color: '#071209' },
  sectionHeader: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: { color: '#F4F8F6', fontSize: 19, fontWeight: '900', letterSpacing: -0.35 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 8 },
  sectionActionText: { color: lime, fontSize: 11, fontWeight: '800' },
  featuredLesson: {
    minHeight: 194,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#233D34',
    backgroundColor: '#0A1B17',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
    marginBottom: 14,
  },
  featuredLessonCompact: { gap: 10, padding: 12 },
  lessonArtwork: {
    width: 145,
    height: 154,
    borderRadius: 18,
    backgroundColor: '#112F23',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lessonArtworkCompact: { width: 92, height: 136 },
  targetOuter: {
    width: 105,
    height: 105,
    borderRadius: 53,
    borderWidth: 2,
    borderColor: '#345847',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetMiddle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCopy: { flex: 1, minWidth: 0 },
  lessonBadges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#183326',
  },
  categoryBadgeText: { color: lime, fontSize: 9, fontWeight: '900' },
  difficultyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#17221F',
  },
  difficultyBadgeText: { color: '#AAB5B0', fontSize: 9, fontWeight: '800' },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  completedBadgeText: { color: '#071209', fontSize: 8, fontWeight: '900' },
  featuredTitle: {
    color: '#F5F8F6',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginTop: 10,
  },
  lessonTitle: { color: '#F5F8F6', fontSize: 15, fontWeight: '900', marginTop: 8 },
  lessonDescription: { color: '#8C9A94', fontSize: 12, lineHeight: 18, marginTop: 5 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 11 },
  lessonMetaText: { color: '#91A09A', fontSize: 10, fontWeight: '700' },
  startedText: { color: lime, fontSize: 10, fontWeight: '800' },
  featuredPlay: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredPlayCompact: { width: 39, height: 39, borderRadius: 20 },
  lessonArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCard: {
    minHeight: 115,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#233D34',
    backgroundColor: '#0A1B17',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 14,
  },
  podcastArt: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: '#12311F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastBrand: { color: '#E9F1ED', fontSize: 9, fontWeight: '900' },
  podcastWord: { color: '#E9F1ED', fontSize: 10, fontWeight: '900', marginTop: 4 },
  mediaCopy: { flex: 1, minWidth: 0 },
  mediaTitle: { color: '#F4F8F6', fontSize: 15, lineHeight: 21, fontWeight: '900' },
  mediaMeta: { color: '#84928C', fontSize: 10, lineHeight: 15, marginTop: 5 },
  roundAction: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorCard: {
    minHeight: 104,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#233D34',
    backgroundColor: '#0A1B17',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 17,
  },
  mentorAvatar: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#163126',
    borderWidth: 1,
    borderColor: '#355849',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    height: 39,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: { color: '#071209', fontSize: 10, fontWeight: '900' },
  lessonList: { gap: 9 },
  lessonCard: {
    minHeight: 118,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#1E382F',
    backgroundColor: '#081713',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyCard: {
    minHeight: 190,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2A493D',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071511',
  },
  emptyTitle: { color: '#F1F5F3', fontSize: 16, fontWeight: '900', marginTop: 10 },
  emptyCopy: { color: '#82908A', fontSize: 12, marginTop: 5 },
});
