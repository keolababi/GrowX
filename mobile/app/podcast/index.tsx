import { Stack } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const lime = '#8EE817';

const episodes = [
  {
    number: '12',
    title: 'Стартапын нууц',
    duration: '32:10',
    listens: '840 сонссон',
    tone: '#2d1688',
  },
  {
    number: '11',
    title: 'Хөрөнгө оруулалт татах нь',
    duration: '28:45',
    listens: '760 сонссон',
    tone: '#142870',
  },
  {
    number: '10',
    title: 'Маркетингийн стратеги',
    duration: '21:30',
    listens: '1.1K сонссон',
    tone: '#24160f',
  },
];

function Microphone({ small = false }: { small?: boolean }) {
  return (
    <View style={[styles.mic, small && styles.micSmall]}>
      <View style={[styles.micHead, small && styles.micHeadSmall]}>
        <View style={styles.micShine} />
      </View>
      <View style={[styles.micArms, small && styles.micArmsSmall]} />
      <View style={[styles.micStem, small && styles.micStemSmall]} />
      <View style={[styles.micBase, small && styles.micBaseSmall]} />
    </View>
  );
}

function Waveform() {
  const heights = [
    18, 32, 52, 34, 20, 16, 28, 44, 58, 42, 24, 18, 14, 26, 50, 34, 22, 31, 47, 61, 38, 27, 18, 24,
    41, 54, 37, 19, 13, 22, 34, 44, 29, 16,
  ];
  return (
    <View style={styles.waveform}>
      {heights.map((height, index) => (
        <View key={index} style={[styles.waveBar, { height }]} />
      ))}
    </View>
  );
}

function EpisodeRow({ episode }: { episode: (typeof episodes)[number] }) {
  return (
    <View style={styles.episodeRow}>
      <View style={[styles.thumbnail, { backgroundColor: episode.tone }]}>
        <View style={styles.thumbGlow} />
        <Microphone small />
      </View>
      <View style={styles.episodeCopy}>
        <Text style={styles.episodeTitle}>
          #{episode.number} {episode.title}
        </Text>
        <Text style={styles.episodeMeta}>
          {episode.duration} · {episode.listens}
        </Text>
      </View>
    </View>
  );
}

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={styles.navItem}>
      <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </View>
  );
}

export default function PodcastScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.heading}>Podcast</Text>
          <Text style={styles.search}>⌕</Text>
        </View>

        <View style={styles.categories}>
          <View style={[styles.category, styles.categoryActive]}>
            <Text style={styles.categoryActiveText}>Бүгд</Text>
          </View>
          <View style={styles.category}>
            <Text style={styles.categoryText}>BizTalk</Text>
          </View>
          <View style={[styles.category, styles.categoryWide]}>
            <Text style={styles.categoryText}>Business Voice</Text>
          </View>
          <View style={styles.category}>
            <Text style={styles.categoryText}>Startup</Text>
          </View>
        </View>

        <View style={styles.featured}>
          <View style={styles.featuredGlow} />
          <Text style={styles.featuredTitle}>BizTalk Podcast</Text>
          <Text style={styles.featuredSubtitle}>#12 Стартапын нууц</Text>
          <Waveform />
          <Text style={styles.featuredDuration}>32:10</Text>
          <View style={styles.largeMic}>
            <Microphone />
          </View>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>

        <Text style={styles.allTitle}>Бүх дугаар</Text>
        <View style={styles.episodeList}>
          {episodes.map((episode) => (
            <EpisodeRow key={episode.number} episode={episode} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem icon="⌂" label="Нүүр" active />
        <NavItem icon="⌘" label="Мэдлэг" />
        <View style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </View>
        <NavItem icon="○" label="Мессеж" />
        <NavItem icon="♙" label="Профайл" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020d12' },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 112 },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { color: '#f7f7f7', fontSize: 31, fontWeight: '800', letterSpacing: -0.7 },
  search: { color: '#f7f7f7', fontSize: 42, lineHeight: 44, transform: [{ rotate: '-20deg' }] },
  categories: { flexDirection: 'row', gap: 10, marginTop: 13, marginBottom: 31 },
  category: {
    flex: 1,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#0b171d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryWide: { flex: 1.65 },
  categoryActive: { backgroundColor: lime },
  categoryText: { color: '#e4e5e6', fontSize: 12, fontWeight: '700' },
  categoryActiveText: { color: '#152000', fontSize: 13, fontWeight: '800' },
  featured: {
    height: 292,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#2d177c',
    padding: 25,
  },
  featuredGlow: {
    position: 'absolute',
    right: -60,
    top: -90,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#4d28ab',
    opacity: 0.72,
  },
  featuredTitle: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  featuredSubtitle: { color: '#ece9ff', fontSize: 17, fontWeight: '700', marginTop: 15 },
  featuredDuration: {
    position: 'absolute',
    left: 25,
    bottom: 28,
    color: '#dad4f5',
    fontSize: 16,
    fontWeight: '700',
  },
  waveform: {
    position: 'absolute',
    left: 25,
    right: 113,
    top: 139,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: { width: 2, borderRadius: 2, backgroundColor: '#aa8eff' },
  largeMic: { position: 'absolute', right: 26, top: 41 },
  mic: { width: 90, height: 174, alignItems: 'center' },
  micSmall: { width: 44, height: 74, transform: [{ scale: 0.65 }] },
  micHead: {
    width: 53,
    height: 99,
    borderRadius: 27,
    backgroundColor: '#08090b',
    borderWidth: 3,
    borderColor: '#16171a',
    zIndex: 2,
    overflow: 'hidden',
  },
  micHeadSmall: { width: 40, height: 71, borderRadius: 20 },
  micShine: { width: 10, height: '100%', marginLeft: 9, backgroundColor: '#303136', opacity: 0.45 },
  micArms: {
    position: 'absolute',
    top: 65,
    width: 77,
    height: 52,
    borderWidth: 7,
    borderTopWidth: 0,
    borderColor: '#08090b',
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  micArmsSmall: { top: 44, width: 60, height: 42 },
  micStem: {
    position: 'absolute',
    top: 112,
    width: 9,
    height: 43,
    borderRadius: 5,
    backgroundColor: '#08090b',
  },
  micStemSmall: { top: 77, height: 25, width: 7 },
  micBase: {
    position: 'absolute',
    top: 150,
    width: 45,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#08090b',
  },
  micBaseSmall: { top: 99, width: 32, height: 6 },
  playButton: {
    position: 'absolute',
    right: 25,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#342181', fontSize: 25, marginLeft: 4 },
  allTitle: { color: '#f5f5f5', fontSize: 23, fontWeight: '800', marginTop: 36, marginBottom: 17 },
  episodeList: { gap: 12 },
  episodeRow: {
    height: 79,
    borderRadius: 15,
    backgroundColor: '#08151b',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
  },
  thumbnail: {
    width: 70,
    height: 65,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4c2ec4',
    opacity: 0.45,
  },
  episodeCopy: { flex: 1, marginLeft: 15 },
  episodeTitle: { color: '#f1f1f1', fontSize: 15, fontWeight: '700' },
  episodeMeta: { color: '#9ba2a7', fontSize: 12, marginTop: 8 },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 91,
    paddingBottom: 10,
    backgroundColor: '#07141a',
    borderTopWidth: 1,
    borderTopColor: '#132229',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { width: 59, alignItems: 'center', gap: 4 },
  navIcon: { color: '#d9dddf', fontSize: 28, lineHeight: 31 },
  navLabel: { color: '#d0d3d5', fontSize: 11, fontWeight: '600' },
  navActive: { color: lime },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -28,
    backgroundColor: lime,
    borderWidth: 4,
    borderColor: '#07141a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: '#152000', fontSize: 39, lineHeight: 41 },
});
