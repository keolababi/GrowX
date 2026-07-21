import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const lime = '#8EE817';
const categories = ['Бүгд', 'Маркетинг', 'Санхүү', 'Бизнес хөгжил'];

const mentors = [
  {
    id: 1,
    name: 'Г. Энхбаяр',
    role: 'Бизнес зөвлөх, Investor',
    rating: '4.9',
    reviews: 128,
    initials: 'ГЭ',
    tone: '#5B3829',
  },
  {
    id: 2,
    name: 'Д. Энхтуяа',
    role: 'Маркетингийн эксперт',
    rating: '4.8',
    reviews: 96,
    initials: 'ДЭ',
    tone: '#6D4A43',
  },
  {
    id: 3,
    name: 'М. Саруул',
    role: 'Санхүүгийн зөвлөх',
    rating: '4.9',
    reviews: 100,
    initials: 'МС',
    tone: '#554B49',
  },
  {
    id: 4,
    name: 'Б. Тамираа',
    role: 'Бизнесийн хөгжлийн зөвлөх',
    rating: '4.7',
    reviews: 80,
    initials: 'БТ',
    tone: '#4A382F',
  },
  {
    id: 5,
    name: 'А. Мөнхжаргал',
    role: 'Хуульч',
    rating: '4.6',
    reviews: 74,
    initials: 'АМ',
    tone: '#314D6E',
  },
];

export default function MentorScreen() {
  const [category, setCategory] = useState('Бүгд');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [following, setFollowing] = useState<number[]>([]);

  const visibleMentors = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return mentors.filter((mentor) => {
      const matchesCategory =
        category === 'Бүгд' ||
        (category === 'Маркетинг' && mentor.role.includes('Маркетинг')) ||
        (category === 'Санхүү' && mentor.role.includes('Санхүү')) ||
        (category === 'Бизнес хөгжил' && mentor.role.includes('Бизнес'));
      const matchesQuery =
        !normalizedQuery ||
        mentor.name.toLocaleLowerCase().includes(normalizedQuery) ||
        mentor.role.toLocaleLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const toggleFollow = (id: number) => {
    setFollowing((current) =>
      current.includes(id) ? current.filter((mentorId) => mentorId !== id) : [...current, id],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Менторууд</Text>
        <Pressable
          accessibilityLabel="Ментор хайх"
          hitSlop={12}
          onPress={() => {
            setSearching((current) => !current);
            if (searching) setQuery('');
          }}
        >
          <Text style={styles.searchIcon}>⌕</Text>
        </Pressable>
      </View>

      {searching && (
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Ментор хайх..."
          placeholderTextColor="#687278"
          style={styles.searchInput}
        />
      )}

      <ScrollView
        horizontal
        contentContainerStyle={styles.categories}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.category, category === item && styles.categoryActive]}
          >
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {visibleMentors.map((mentor) => {
          const isFollowing = following.includes(mentor.id);
          return (
            <View key={mentor.id} style={styles.mentorRow}>
              <View style={[styles.avatar, { backgroundColor: mentor.tone }]}>
                <View style={styles.avatarHead} />
                <View style={styles.avatarBody} />
                <Text style={styles.initials}>{mentor.initials}</Text>
              </View>
              <View style={styles.mentorInfo}>
                <Text style={styles.name}>{mentor.name}</Text>
                <Text numberOfLines={1} style={styles.role}>
                  {mentor.role}
                </Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.rating}>
                    {mentor.rating} ({mentor.reviews})
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => toggleFollow(mentor.id)}
                style={[styles.followButton, isFollowing && styles.followingButton]}
              >
                <Text style={[styles.followText, isFollowing && styles.followingText]}>
                  {isFollowing ? 'Дагаж буй' : 'Дагах'}
                </Text>
              </Pressable>
            </View>
          );
        })}
        {visibleMentors.length === 0 && <Text style={styles.empty}>Ментор олдсонгүй.</Text>}
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem icon="⌂" label="Нүүр" active onPress={() => router.replace('/home')} />
        <NavItem icon="⌘" label="Мэдлэг" />
        <Pressable style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </Pressable>
        <NavItem icon="◯" label="Мессеж" />
        <NavItem icon="♙" label="Профайл" onPress={() => router.push('/profile')} />
      </View>
    </SafeAreaView>
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
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020D12' },
  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#F6F7F7', fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  searchIcon: { color: '#F4F6F6', fontSize: 39, lineHeight: 40, transform: [{ rotate: '-20deg' }] },
  searchInput: {
    height: 46,
    marginHorizontal: 22,
    marginBottom: 9,
    paddingHorizontal: 15,
    borderRadius: 13,
    color: '#FFFFFF',
    backgroundColor: '#0A171D',
    borderWidth: 1,
    borderColor: '#1A292F',
    fontSize: 15,
  },
  categories: { height: 67, paddingHorizontal: 22, paddingVertical: 11, gap: 12 },
  category: {
    height: 43,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: '#0A171D',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0D1D23',
  },
  categoryActive: { backgroundColor: lime, borderColor: '#A2F733' },
  categoryText: { color: '#E4E7E8', fontSize: 14, fontWeight: '700' },
  categoryTextActive: { color: '#122000' },
  list: { paddingHorizontal: 22, paddingBottom: 120 },
  mentorRow: {
    minHeight: 125,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#122129',
  },
  avatar: {
    width: 75,
    height: 75,
    borderRadius: 38,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: '#25353A',
  },
  avatarHead: {
    position: 'absolute',
    top: 12,
    width: 30,
    height: 34,
    borderRadius: 16,
    backgroundColor: '#D5A486',
  },
  avatarBody: {
    width: 58,
    height: 34,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#121B20',
  },
  initials: { position: 'absolute', bottom: 7, color: '#F4F5F5', fontSize: 10, fontWeight: '800' },
  mentorInfo: { flex: 1, minWidth: 0, marginLeft: 16, marginRight: 10 },
  name: { color: '#F5F6F6', fontSize: 18, fontWeight: '800' },
  role: { color: '#9BA4A8', fontSize: 13, marginTop: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  star: { color: '#FFB51A', fontSize: 17 },
  rating: { color: '#D9DDDF', fontSize: 13, fontWeight: '700' },
  followButton: {
    minWidth: 91,
    height: 49,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#609E16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: { backgroundColor: lime, borderColor: lime },
  followText: { color: lime, fontSize: 15, fontWeight: '800' },
  followingText: { color: '#132000' },
  empty: { color: '#899399', textAlign: 'center', paddingTop: 50, fontSize: 15 },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 94,
    paddingBottom: 9,
    backgroundColor: '#071319',
    borderTopWidth: 1,
    borderTopColor: '#142229',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { width: 69, alignItems: 'center', gap: 4 },
  navIcon: { color: '#E7EAEA', fontSize: 29, lineHeight: 31 },
  navLabel: { color: '#D2D7D9', fontSize: 12, fontWeight: '600' },
  navActive: { color: lime },
  addButton: {
    width: 61,
    height: 61,
    borderRadius: 31,
    marginTop: -27,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: lime,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  addIcon: { color: '#142000', fontSize: 38, lineHeight: 40, fontWeight: '300' },
});
