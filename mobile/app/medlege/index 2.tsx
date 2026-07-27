import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const lime = '#8ee817';

type Category = 'Бүгд' | 'Видео' | 'Подкаст' | 'Нийтлэл' | 'Гарын авлага';

const categories: Category[] = ['Бүгд', 'Видео', 'Подкаст', 'Нийтлэл', 'Гарын авлага'];

const items = [
  {
    title: 'Бизнес эхлүүлэх 7 алхам',
    meta: 'Видео хичээл  ·  12 мин',
    kind: 'play',
    color: '#4522b3',
    category: 'Видео',
  },
  {
    title: 'Санхүүгийн үндэс',
    meta: 'Нийтлэл  ·  6 мин унших',
    kind: 'wallet',
    color: '#183d68',
    category: 'Нийтлэл',
  },
  {
    title: 'Борлуулалтаа нэмэгдүүлэх арга',
    meta: 'Подкаст  ·  18 мин',
    kind: 'mic',
    color: '#071746',
    category: 'Подкаст',
  },
  {
    title: 'Маркетингийн стратеги',
    meta: 'Видео хичээл  ·  15 мин',
    kind: 'phone',
    color: '#20486c',
    category: 'Видео',
  },
  {
    title: 'График дизайны хялбарчлал',
    meta: 'Гарын авлага  ·  8 мин',
    kind: 'design',
    color: '#283239',
    category: 'Гарын авлага',
  },
] as const;

function Thumbnail({ kind, color }: { kind: (typeof items)[number]['kind']; color: string }) {
  return (
    <View style={[styles.thumbnail, { backgroundColor: color }]}>
      <View style={styles.thumbGlow} />
      {kind === 'play' && (
        <View style={styles.playCircle}>
          <Text style={styles.playText}>▶</Text>
        </View>
      )}
      {kind === 'wallet' && (
        <View style={styles.wallet}>
          <View style={styles.walletFlap} />
          <View style={styles.walletButton} />
        </View>
      )}
      {kind === 'mic' && (
        <View style={styles.micWrap}>
          <View style={styles.micHead} />
          <View style={styles.micArm} />
          <View style={styles.micStem} />
          <View style={styles.micBase} />
        </View>
      )}
      {kind === 'phone' && (
        <View style={styles.phone}>
          <View style={styles.phoneScreen}>
            <Text style={styles.phonePlay}>▶</Text>
          </View>
        </View>
      )}
      {kind === 'design' && <Text style={styles.designIcon}>C</Text>}
    </View>
  );
}

function ContentRow({ item }: { item: (typeof items)[number] }) {
  return (
    <View style={styles.card}>
      <Thumbnail kind={item.kind} color={item.color} />
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.meta}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.navItem}>
      <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}

export default function KnowledgeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('Бүгд');
  const visibleItems =
    selectedCategory === 'Бүгд'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.heading}>Мэдлэг</Text>
          <Text style={styles.search}>⌕</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.category,
                  category === 'Гарын авлага' && styles.lastCategory,
                  active && styles.categoryActive,
                ]}
              >
                <Text style={[styles.categoryText, active && styles.categoryActiveText]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {visibleItems.map((item) => (
            <ContentRow key={item.title} item={item} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem icon="⌂" label="Нүүр" onPress={() => router.replace('/home')} />
        <NavItem icon="⌘" label="Мэдлэг" active onPress={() => router.replace('/medlege')} />
        <View style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </View>
        <NavItem icon="○" label="Мессеж" onPress={() => router.push('/messages')} />
        <NavItem icon="♙" label="Профайл" onPress={() => router.push('/profile')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020d12' },
  content: { paddingTop: 18, paddingBottom: 115 },
  header: {
    height: 64,
    paddingHorizontal: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { color: '#f5f6f6', fontSize: 33, fontWeight: '800', letterSpacing: -0.8 },
  search: { color: '#f4f5f5', fontSize: 43, lineHeight: 45, transform: [{ rotate: '-20deg' }] },
  categories: { gap: 11, paddingHorizontal: 23, paddingTop: 21, paddingBottom: 29 },
  category: {
    minWidth: 103,
    height: 47,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#0a171d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastCategory: { minWidth: 142 },
  categoryActive: { minWidth: 88, backgroundColor: lime },
  categoryText: { color: '#d8dadd', fontSize: 14, fontWeight: '700' },
  categoryActiveText: { color: '#152000', fontSize: 14, fontWeight: '800' },
  list: { paddingHorizontal: 23, gap: 12 },
  card: {
    height: 110,
    borderRadius: 19,
    backgroundColor: '#07141a',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  thumbnail: {
    width: 104,
    height: 90,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlow: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 58,
    backgroundColor: '#4975d2',
    opacity: 0.18,
  },
  cardCopy: { flex: 1, paddingLeft: 17 },
  cardTitle: { color: '#f0f1f1', fontSize: 17, lineHeight: 22, fontWeight: '700' },
  cardMeta: { color: '#9da4a8', fontSize: 13, marginTop: 9 },
  chevron: { color: '#a8afb2', fontSize: 37, lineHeight: 39, paddingHorizontal: 8 },
  playCircle: {
    width: 61,
    height: 61,
    borderRadius: 31,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: { color: '#352190', fontSize: 27, marginLeft: 4 },
  wallet: {
    width: 68,
    height: 42,
    borderRadius: 5,
    backgroundColor: '#5f8ebd',
    borderWidth: 3,
    borderColor: '#254d77',
  },
  walletFlap: {
    position: 'absolute',
    width: 43,
    height: 34,
    right: -13,
    top: 5,
    borderRadius: 5,
    backgroundColor: '#719fca',
    transform: [{ rotate: '12deg' }],
  },
  walletButton: {
    position: 'absolute',
    width: 13,
    height: 9,
    borderRadius: 6,
    right: 4,
    top: 18,
    backgroundColor: '#eef4fa',
  },
  micWrap: { width: 60, height: 82, alignItems: 'center' },
  micHead: {
    width: 27,
    height: 57,
    borderRadius: 14,
    backgroundColor: '#15120e',
    borderWidth: 3,
    borderColor: '#5d4d36',
    zIndex: 2,
  },
  micArm: {
    position: 'absolute',
    top: 35,
    width: 48,
    height: 35,
    borderWidth: 5,
    borderTopWidth: 0,
    borderColor: '#17130e',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  micStem: { position: 'absolute', top: 65, width: 6, height: 12, backgroundColor: '#17130e' },
  micBase: {
    position: 'absolute',
    top: 75,
    width: 31,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#17130e',
  },
  phone: {
    width: 48,
    height: 68,
    padding: 4,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#e7edf1',
    backgroundColor: '#163650',
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#1f5278',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePlay: { color: '#fff', fontSize: 23 },
  designIcon: {
    color: '#e6e8e9',
    fontSize: 54,
    fontWeight: '900',
    transform: [{ rotate: '-12deg' }],
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 94,
    paddingBottom: 11,
    backgroundColor: '#07141a',
    borderTopWidth: 1,
    borderTopColor: '#14232a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { width: 61, alignItems: 'center', gap: 4 },
  navIcon: { color: '#d8dcde', fontSize: 29, lineHeight: 31 },
  navLabel: { color: '#d0d3d5', fontSize: 11, fontWeight: '600' },
  navActive: { color: lime },
  addButton: {
    width: 61,
    height: 61,
    borderRadius: 31,
    marginTop: -28,
    backgroundColor: lime,
    borderWidth: 4,
    borderColor: '#07141a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: '#152000', fontSize: 40, lineHeight: 42 },
});
