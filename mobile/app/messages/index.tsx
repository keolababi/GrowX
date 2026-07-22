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
const filters = ['Бүгд', 'Unread', 'Mentor', 'Community'];

type Conversation = {
  id: number;
  name: string;
  preview: string;
  time: string;
  type: 'Mentor' | 'Community';
  unread?: number;
  initials: string;
  tone: string;
};

const conversations: Conversation[] = [
  {
    id: 1,
    name: 'Г. Энхбаяр',
    preview: 'Сайн уу? Таны төсөлтэй танилцлаа.',
    time: '11:20',
    type: 'Mentor',
    unread: 2,
    initials: 'ГЭ',
    tone: '#5B3829',
  },
  {
    id: 2,
    name: 'Д. Энхтуяа',
    preview: 'Маркетингийн стратегийн талаар ярилцах уу?',
    time: '10:45',
    type: 'Mentor',
    initials: 'ДЭ',
    tone: '#6D4A43',
  },
  {
    id: 3,
    name: 'Startup Mongolia',
    preview: 'Шинэ арга хэмжээ зарлагдлаа 🎉',
    time: 'Өчигдөр',
    type: 'Community',
    initials: 'SM',
    tone: '#5B50A9',
  },
  {
    id: 4,
    name: 'Болд',
    preview: 'Төсөл дээр хамтран ажиллая!',
    time: 'Өчигдөр',
    type: 'Mentor',
    initials: 'Б',
    tone: '#4B4039',
  },
  {
    id: 5,
    name: 'Community Group',
    preview: 'Бат: Бүртгүүлэгчдийн шинэ санал...',
    time: '2 өдрийн өмнө',
    type: 'Community',
    initials: 'CG',
    tone: '#725140',
  },
];

export default function MessagesScreen() {
  const [filter, setFilter] = useState('Бүгд');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return conversations.filter((conversation) => {
      const matchesFilter =
        filter === 'Бүгд' ||
        (filter === 'Unread' && Boolean(conversation.unread)) ||
        conversation.type === filter;
      const matchesQuery =
        !normalizedQuery ||
        conversation.name.toLocaleLowerCase().includes(normalizedQuery) ||
        conversation.preview.toLocaleLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Мессеж</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Мессеж хайх"
            hitSlop={10}
            onPress={() => {
              setSearching((current) => !current);
              if (searching) setQuery('');
            }}
          >
            <Text style={styles.searchIcon}>⌕</Text>
          </Pressable>
          <Pressable accessibilityLabel="Шинэ мессеж" hitSlop={10}>
            <Text style={styles.composeIcon}>▧</Text>
          </Pressable>
        </View>
      </View>

      {searching && (
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Харилцагч хайх..."
          placeholderTextColor="#69747A"
          style={styles.searchInput}
        />
      )}

      <ScrollView
        horizontal
        contentContainerStyle={styles.filters}
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filter, filter === item && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {visibleConversations.map((conversation) => (
          <Pressable
            key={conversation.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Avatar
              initials={conversation.initials}
              tone={conversation.tone}
              community={conversation.type === 'Community'}
            />
            <View style={styles.messageInfo}>
              <Text numberOfLines={1} style={styles.name}>
                {conversation.name}
              </Text>
              <Text numberOfLines={2} style={styles.preview}>
                {conversation.preview}
              </Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.time}>{conversation.time}</Text>
              {conversation.unread ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{conversation.unread}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
        {visibleConversations.length === 0 && <Text style={styles.empty}>Мессеж олдсонгүй.</Text>}
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem icon="⌂" label="Нүүр" onPress={() => router.replace('/home')} />
        <NavItem icon="⌘" label="Мэдлэг" onPress={() => router.push('/medlege')} />
        <Pressable style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </Pressable>
        <NavItem icon="◉" label="Мессеж" active onPress={() => router.replace('/messages')} />
        <NavItem icon="♙" label="Профайл" onPress={() => router.push('/profile')} />
      </View>
    </SafeAreaView>
  );
}

function Avatar({
  initials,
  tone,
  community,
}: {
  initials: string;
  tone: string;
  community?: boolean;
}) {
  return (
    <View style={[styles.avatar, { backgroundColor: tone }]}>
      {community ? (
        <>
          <View style={styles.communityBubbleOne} />
          <View style={styles.communityBubbleTwo} />
        </>
      ) : (
        <>
          <View style={styles.avatarHead} />
          <View style={styles.avatarBody} />
        </>
      )}
      <Text style={styles.initials}>{initials}</Text>
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
    height: 72,
    paddingHorizontal: 22,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#F5F7F7', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 19 },
  searchIcon: { color: '#F3F6F6', fontSize: 38, lineHeight: 40, transform: [{ rotate: '-20deg' }] },
  composeIcon: { color: '#F3F6F6', fontSize: 29, lineHeight: 32 },
  searchInput: {
    height: 46,
    marginHorizontal: 22,
    marginBottom: 8,
    paddingHorizontal: 15,
    borderRadius: 13,
    color: '#FFFFFF',
    backgroundColor: '#0A171D',
    borderWidth: 1,
    borderColor: '#1A292F',
    fontSize: 15,
  },
  filters: { height: 67, paddingHorizontal: 22, paddingVertical: 11, gap: 12 },
  filter: {
    height: 43,
    minWidth: 91,
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: '#0A171D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0D1D23',
  },
  filterActive: { backgroundColor: lime, borderColor: '#A2F733' },
  filterText: { color: '#E2E6E7', fontSize: 14, fontWeight: '700' },
  filterTextActive: { color: '#132000' },
  list: { paddingHorizontal: 22, paddingBottom: 120 },
  row: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#112129',
    borderRadius: 10,
  },
  rowPressed: { backgroundColor: '#071820' },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: '#26363C',
  },
  avatarHead: {
    position: 'absolute',
    top: 10,
    width: 28,
    height: 32,
    borderRadius: 15,
    backgroundColor: '#D5A486',
  },
  avatarBody: {
    width: 53,
    height: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#111A20',
  },
  communityBubbleOne: {
    position: 'absolute',
    width: 35,
    height: 43,
    borderRadius: 20,
    top: 11,
    left: 8,
    backgroundColor: '#68A3D6',
    transform: [{ rotate: '-28deg' }],
  },
  communityBubbleTwo: {
    position: 'absolute',
    width: 33,
    height: 42,
    borderRadius: 18,
    top: 12,
    right: 7,
    backgroundColor: '#7256D4',
    transform: [{ rotate: '28deg' }],
  },
  initials: { position: 'absolute', bottom: 6, color: '#F5F6F6', fontSize: 9, fontWeight: '900' },
  messageInfo: { flex: 1, minWidth: 0, marginLeft: 15, marginRight: 8 },
  name: { color: '#F4F6F6', fontSize: 18, fontWeight: '800' },
  preview: { color: '#9CA6AA', fontSize: 13, lineHeight: 19, marginTop: 5 },
  meta: { minWidth: 70, alignSelf: 'stretch', alignItems: 'flex-end', paddingTop: 24 },
  time: { color: '#929CA1', fontSize: 12 },
  unreadBadge: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  unreadText: { color: '#152000', fontSize: 14, fontWeight: '900' },
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
  navIcon: { color: '#E0E5E6', fontSize: 29, lineHeight: 31 },
  navLabel: { color: '#C8CFD1', fontSize: 12, fontWeight: '600' },
  navActive: { color: lime },
  addButton: {
    width: 61,
    height: 61,
    borderRadius: 31,
    marginTop: -27,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#071319',
  },
  addIcon: { color: '#142000', fontSize: 38, lineHeight: 40, fontWeight: '300' },
});
