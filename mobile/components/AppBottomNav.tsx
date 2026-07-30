import { router, useGlobalSearchParams, useSegments } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MessageUnreadBadge } from './MessageUnreadBadge';

const lime = '#8EE817';

type NavSection = 'home' | 'knowledge' | 'messages' | 'profile';

function getActiveSection(firstSegment?: string): NavSection {
  if (firstSegment === 'medlege' || firstSegment === 'podcast') return 'knowledge';
  if (firstSegment === 'messages') return 'messages';
  if (firstSegment === 'profile' || firstSegment === 'users') return 'profile';
  return 'home';
}

export function AppBottomNav() {
  const segments = useSegments();
  const params = useGlobalSearchParams<{ communityId?: string }>();
  const active = getActiveSection(segments[0]);

  const openCreate = () => {
    if (segments[0] === 'community' && segments.length === 1) {
      router.push('/community/create-group');
      return;
    }
    if (segments[0] === 'community' && params.communityId) {
      router.push({
        pathname: '/posts/create',
        params: {
          type: 'post',
          communityId: params.communityId,
          communityKind: 'discussions',
        },
      });
      return;
    }
    router.push('/posts/create');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bar}>
        <NavItem
          active={active === 'home'}
          icon="⌂"
          label="Нүүр"
          onPress={() => router.replace('/home')}
        />
        <NavItem
          active={active === 'knowledge'}
          icon="⌘"
          label="Мэдлэг"
          onPress={() => router.replace('/medlege')}
        />
        <Pressable accessibilityLabel="Шинэ контент" onPress={openCreate} style={styles.addButton}>
          <Text style={styles.addIcon}>＋</Text>
        </Pressable>
        <NavItem
          active={active === 'messages'}
          icon="○"
          label="Мессеж"
          showUnread
          onPress={() => router.replace('/messages')}
        />
        <NavItem
          active={active === 'profile'}
          icon="♙"
          label="Профайл"
          onPress={() => router.replace('/profile')}
        />
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  active,
  icon,
  label,
  showUnread,
  onPress,
}: {
  active: boolean;
  icon: string;
  label: string;
  showUnread?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.item}
    >
      <Text style={[styles.icon, active && styles.active]}>{icon}</Text>
      {showUnread && <MessageUnreadBadge />}
      <Text style={[styles.label, active && styles.active]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flexShrink: 0,
    backgroundColor: '#061712',
    borderTopWidth: 1,
    borderTopColor: '#132822',
    zIndex: 20,
  },
  bar: {
    height: 85,
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    width: 69,
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    color: '#D8DFDC',
    fontSize: 29,
    lineHeight: 31,
  },
  label: {
    color: '#C8D0CD',
    fontSize: 12,
    fontWeight: '600',
  },
  active: { color: lime },
  addButton: {
    width: 61,
    height: 61,
    marginTop: -28,
    borderRadius: 31,
    borderWidth: 4,
    borderColor: '#061712',
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    color: '#142000',
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '300',
  },
});
