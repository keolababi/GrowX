import { router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const lime = '#8ee817';

type IconName = 'book' | 'person' | 'people' | 'chat' | 'home' | 'grid';

const icons: Record<IconName, string> = {
  book: '▣',
  person: '♙',
  people: '♧',
  chat: '◯',
  home: '⌂',
  grid: '⌘',
};

function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}
    >
      <Text style={styles.quickIcon}>{icons[icon]}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function BottomItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.bottomItem}>
      <Text style={[styles.bottomIcon, active && styles.bottomIconActive]}>{icons[icon]}</Text>
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.logoIcon}>✣</Text>
            </View>
            <Text style={styles.brandText}>GrowX</Text>
          </View>
          <Text style={styles.bell}>♧</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Бизнесээ{`\n`}дараагийн</Text>
            <Text style={styles.heroSubtitle}>
              түвшинд <Text style={styles.greenText}>хүргэе.</Text>
            </Text>
            <View style={styles.startButton}>
              <Text style={styles.startText}>Эхлэх</Text>
              <Text style={styles.darkArrow}>→</Text>
            </View>
          </View>
          <View style={styles.growthGraphic}>
            <View style={[styles.ring, styles.ringTop]} />
            <View style={[styles.ring, styles.ringBottom]} />
            <View style={styles.bars}>
              <View style={[styles.bar, { height: 28 }]} />
              <View style={[styles.bar, { height: 47 }]} />
              <View style={[styles.bar, { height: 69 }]} />
            </View>
            <Text style={styles.trendIcon}>↗</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <QuickLink icon="book" label="Мэдлэг" />
          <QuickLink icon="person" label="Ментор" onPress={() => router.push('/mentor')} />
          <QuickLink icon="people" label="Community" />
          <QuickLink icon="chat" label="Хэлэлцэх" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Санал болгох контент</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Бүх podcast үзэх"
            onPress={() => router.push('/podcast')}
            style={({ pressed }) => [styles.seeAll, pressed && styles.quickLinkPressed]}
          >
            <Text style={styles.seeAllText}>Бүгдийг үзэх</Text>
            <Text style={styles.greenArrow}>→</Text>
          </Pressable>
        </View>

        <View style={styles.cards}>
          <View style={styles.reelCard}>
            <View style={styles.reelGlow} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>REEL</Text>
            </View>
            <View style={styles.portrait}>
              <View style={styles.hair} />
              <View style={styles.face} />
              <View style={styles.bodyShape} />
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.reelTitle}>Стартап эхлэхэд{`\n`}анхаарах 3 зүйл</Text>
              <View style={styles.stats}>
                <Text style={styles.statIcon}>◉</Text>
                <Text style={styles.statText}>2.1K</Text>
                <Text style={styles.statIcon}>○</Text>
                <Text style={styles.statText}>128</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="BizTalk Podcast нээх"
            onPress={() => router.push('/podcast')}
            style={({ pressed }) => [styles.podcastCard, pressed && styles.cardPressed]}
          >
            <View style={styles.podcastGlow} />
            <View style={[styles.badge, styles.podcastBadge]}>
              <Text style={styles.badgeText}>PODCAST</Text>
            </View>
            <View style={styles.micWrap}>
              <Text style={styles.mic}>●</Text>
            </View>
            <Text style={styles.podcastTitle}>BizTalk{`\n`}Podcast</Text>
            <Text style={styles.episode}>#12</Text>
            <Text style={styles.host}>Стартапын нууц</Text>
            <Text style={styles.duration}>32:10</Text>
            <View style={styles.play}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomItem icon="home" label="Нүүр" active />
        <BottomItem icon="grid" label="Мэдлэг" />
        <View style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </View>
        <BottomItem icon="chat" label="Мессеж" onPress={() => router.push('/messages')} />
        <BottomItem icon="person" label="Профайл" onPress={() => router.push('/profile')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#031015' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 116 },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { transform: [{ rotate: '-25deg' }] },
  logoIcon: { color: lime, fontSize: 36, fontWeight: '900' },
  brandText: { color: lime, fontSize: 29, fontWeight: '800', letterSpacing: -1 },
  bell: { color: '#f2f4f5', fontSize: 32, transform: [{ rotate: '180deg' }] },
  hero: {
    height: 252,
    marginTop: 16,
    borderRadius: 23,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#0b2119',
    borderWidth: 1,
    borderColor: '#173126',
  },
  heroCopy: { width: '55%', paddingLeft: 26, justifyContent: 'center', zIndex: 2 },
  heroTitle: { color: '#f7f8f8', fontSize: 29, lineHeight: 39, fontWeight: '700' },
  heroSubtitle: { color: '#dbe0dd', fontSize: 16, marginTop: 2 },
  greenText: { color: lime, fontWeight: '700' },
  startButton: {
    width: 118,
    height: 46,
    borderRadius: 14,
    backgroundColor: lime,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  startText: { color: '#142000', fontSize: 16, fontWeight: '700' },
  darkArrow: { color: '#142000', fontSize: 20, fontWeight: '800' },
  growthGraphic: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 12,
    borderColor: lime,
  },
  ringTop: {
    top: 45,
    right: 22,
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-12deg' }],
  },
  ringBottom: {
    top: 74,
    right: 22,
    borderTopColor: 'transparent',
    transform: [{ rotate: '-20deg' }],
  },
  bars: {
    position: 'absolute',
    bottom: 58,
    right: 42,
    height: 75,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  bar: { width: 24, backgroundColor: '#4b9d1b' },
  trendIcon: {
    position: 'absolute',
    right: 15,
    top: 56,
    color: lime,
    fontSize: 90,
    fontWeight: '900',
  },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  quickLink: {
    flex: 1,
    height: 101,
    borderRadius: 17,
    backgroundColor: '#09161c',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#0d1c22',
  },
  quickLinkPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  quickIcon: { color: lime, fontSize: 31, lineHeight: 33 },
  quickLabel: { color: '#d9dcde', fontSize: 12, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 31,
    marginBottom: 17,
  },
  sectionTitle: { color: '#f4f5f5', fontSize: 19, fontWeight: '800' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  seeAllText: { color: lime, fontSize: 13, fontWeight: '600' },
  greenArrow: { color: lime, fontSize: 18, fontWeight: '800' },
  cards: { flexDirection: 'row', gap: 14 },
  reelCard: {
    flex: 1,
    height: 255,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#17191a',
  },
  reelGlow: {
    position: 'absolute',
    width: 150,
    height: 180,
    right: -30,
    top: -20,
    borderRadius: 80,
    backgroundColor: '#32231b',
    opacity: 0.75,
  },
  badge: {
    position: 'absolute',
    zIndex: 4,
    top: 14,
    left: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(65,67,68,0.85)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: { color: '#e6e6e6', fontSize: 10, fontWeight: '800' },
  portrait: { position: 'absolute', top: 38, right: 17, width: 110, height: 148 },
  hair: {
    position: 'absolute',
    top: 12,
    left: 29,
    width: 54,
    height: 33,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 24,
    backgroundColor: '#080808',
    zIndex: 3,
  },
  face: {
    position: 'absolute',
    top: 33,
    left: 36,
    width: 45,
    height: 57,
    borderRadius: 20,
    backgroundColor: '#ad765c',
    zIndex: 2,
  },
  bodyShape: {
    position: 'absolute',
    bottom: -18,
    left: 7,
    width: 104,
    height: 91,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    backgroundColor: '#090d0e',
  },
  cardBottom: { position: 'absolute', bottom: 13, left: 14 },
  reelTitle: { color: '#f4f5f5', fontSize: 15, lineHeight: 21, fontWeight: '700' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  statText: { color: '#b9bec1', fontSize: 11, marginRight: 9 },
  statIcon: { color: '#b9bec1', fontSize: 14 },
  podcastCard: {
    flex: 1,
    height: 255,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#38208b',
    paddingLeft: 18,
  },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  podcastGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -65,
    top: -28,
    backgroundColor: '#5937c7',
    opacity: 0.6,
  },
  podcastBadge: { left: 16, backgroundColor: '#5d43ad' },
  micWrap: { position: 'absolute', right: 7, top: 53 },
  mic: { color: '#06070b', fontSize: 74, lineHeight: 76, transform: [{ scaleX: 0.65 }] },
  podcastTitle: { color: '#fff', fontSize: 20, lineHeight: 25, fontWeight: '700', marginTop: 88 },
  episode: { color: '#ddd7ff', fontSize: 15, fontWeight: '700', marginTop: 17 },
  host: { color: '#b8ade7', fontSize: 11, marginTop: 3 },
  duration: { color: '#ddd7ff', fontSize: 12, marginTop: 8 },
  play: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  playIcon: { color: '#4530a3', fontSize: 18 },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 91,
    paddingBottom: 11,
    backgroundColor: '#07141a',
    borderTopWidth: 1,
    borderTopColor: '#142127',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  bottomItem: { width: 58, alignItems: 'center', gap: 5 },
  bottomIcon: { color: '#d7dadd', fontSize: 27, lineHeight: 29 },
  bottomIconActive: { color: lime },
  bottomLabel: { color: '#c7cacc', fontSize: 11, fontWeight: '600' },
  bottomLabelActive: { color: lime },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -27,
    borderWidth: 4,
    borderColor: '#07141a',
  },
  addIcon: { color: '#142000', fontSize: 40, lineHeight: 42, fontWeight: '300' },
});
