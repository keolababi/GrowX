import { useCallback, useEffect, useRef, useState } from 'react';
import { router, Stack } from 'expo-router';
import { useTabPressStore } from '@/store/tabPressStore';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
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
import type { Lesson } from '@/types/learning';
import { useColorMode } from '@/providers/ColorModeProvider';

const lime = '#9AF000';
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

export default function KnowledgeScreen() {
  const { iconAccent, colors } = useColorMode();
  const { width } = useWindowDimensions();
  const compact = width < 680;
  const [lessonCatalog, setLessonCatalog] = useState<Lesson[]>(fallbackLessons);
  const completedIds = useLearningStore((state) => state.completedIds);
  const startedIds = useLearningStore((state) => state.startedIds);
  const hydrate = useLearningStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const loadLessons = useCallback(() => {
    return api
      .get<{ lessons: Lesson[] }>('/lessons')
      .then(({ data }) => {
        if (data.lessons.length) setLessonCatalog(data.lessons);
      })
      .catch(() => {
        // Keep bundled lessons available when the API is temporarily offline.
      });
  }, []);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const scrollRef = useRef<ScrollView>(null);
  const tabPress = useTabPressStore((state) => (state.section === 'knowledge' ? state.ts : 0));
  const isFirstTabPressRef = useRef(true);
  useEffect(() => {
    if (isFirstTabPressRef.current) {
      isFirstTabPressRef.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    void loadLessons();
  }, [tabPress, loadLessons]);

  const completedCount = lessonCatalog.filter((lesson) => completedIds.has(lesson.id)).length;
  const progress = lessonCatalog.length
    ? Math.round((completedCount / lessonCatalog.length) * 100)
    : 0;
  const nextLesson =
    lessonCatalog.find((lesson) => startedIds.has(lesson.id) && !completedIds.has(lesson.id)) ??
    lessonCatalog.find((lesson) => !completedIds.has(lesson.id)) ??
    lessonCatalog[0];

  const shortcuts: Shortcut[] = [
    {
      label: 'Хичээл',
      icon: 'book-outline',
      onPress: () => router.push('/medlege/lessons'),
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
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.page, compact && styles.pageCompact]}>
          <View
            style={[
              styles.progressHero,
              { backgroundColor: colors.surface, borderColor: colors.border },
              compact && styles.progressHeroCompact,
            ]}
          >
            <View style={styles.progressCopy}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>ТАНЫ СУРАЛЦАХ ЗАМ</Text>
              <Text
                style={[
                  styles.progressTitle,
                  compact && styles.progressTitleCompact,
                  { color: colors.text },
                ]}
              >
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
                <Text
                  style={[
                    styles.progressPercent,
                    compact && styles.progressPercentCompact,
                    { color: colors.primary },
                  ]}
                >
                  {progress}%
                </Text>
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
                <Icon name="chevron-forward" size={compact ? 16 : 18} color={colors.ink} />
              </Pressable>
            </View>
            <View style={[styles.progressVisual, compact && styles.progressVisualCompact]}>
              <View
                style={[
                  styles.progressCircle,
                  { backgroundColor: colors.surface, borderColor: colors.primary },
                  compact && styles.progressCircleCompact,
                ]}
              >
                <View style={[styles.progressCircleInner, { backgroundColor: colors.surface }]}>
                  <GrowXMark size={compact ? 46 : 78} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.shortcutGrid}>
            {shortcuts.map((shortcut) => (
              <Pressable
                key={shortcut.label}
                onPress={shortcut.onPress}
                style={[
                  styles.shortcutCard,
                  compact && styles.shortcutCardCompact,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Icon name={shortcut.icon} size={compact ? 21 : 27} color={iconAccent} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.shortcutLabel,
                    compact && styles.shortcutLabelCompact,
                    { color: colors.textSecondary },
                  ]}
                >
                  {shortcut.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <SectionHeader
            title="Сонсож эхлэх"
            action="Бүгдийг харах"
            onAction={() => router.push('/podcast')}
          />
          <Pressable
            onPress={() => router.push('/podcast')}
            style={[
              styles.mediaCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.podcastArt, { backgroundColor: colors.surfaceSoft }]}>
              <Text style={[styles.podcastBrand, { color: colors.text }]}>GrowX</Text>
              <Icon name="mic" size={compact ? 24 : 28} color={iconAccent} />
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
              <Icon name="play" size={compact ? 17 : 20} color={colors.ink} />
            </View>
          </Pressable>

          <SectionHeader
            title="Ментороос асуух"
            action="Бүгдийг харах"
            onAction={() => router.push('/mentor')}
          />
          <Pressable
            onPress={() => router.push('/mentor')}
            style={[
              styles.mentorCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.mentorAvatar,
                { backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong },
              ]}
            >
              <Icon name="school-outline" size={compact ? 23 : 27} color={iconAccent} />
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
  pageCompact: { paddingHorizontal: 16, paddingTop: 12 },
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
  progressHeroCompact: { minHeight: 218, padding: 16, borderRadius: 20 },
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
  progressTitleCompact: { fontSize: 20, lineHeight: 25, marginTop: 5 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
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
  progressPercentCompact: { fontSize: 18 },
  progressDescription: { color: '#91A099', fontSize: 12, marginTop: 10 },
  continueButton: {
    alignSelf: 'flex-start',
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  continueText: { color: '#071209', fontSize: 13, fontWeight: '900' },
  progressVisual: { width: '34%', alignItems: 'center', justifyContent: 'center' },
  progressVisualCompact: { width: 76, opacity: 0.92 },
  progressCircle: {
    width: 164,
    height: 164,
    maxWidth: '100%',
    aspectRatio: 1,
    borderRadius: 82,
    borderWidth: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleInner: {
    width: '76%',
    height: '76%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleCompact: { width: 72, height: 72, borderRadius: 36, borderWidth: 7 },
  shortcutGrid: { flexDirection: 'row', gap: 6, marginTop: 12 },
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
  shortcutCardCompact: { flex: 1, flexBasis: 0, minWidth: 0, minHeight: 68, borderRadius: 14 },
  shortcutLabel: { color: '#C8D1CD', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  shortcutLabelCompact: { width: '100%', fontSize: 9, lineHeight: 12 },
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
  targetMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    minHeight: 104,
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
    width: 76,
    height: 76,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorCard: {
    minHeight: 96,
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
    width: 58,
    height: 58,
    borderRadius: 29,
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
