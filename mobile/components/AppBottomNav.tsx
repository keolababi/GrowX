import { useState } from 'react';
import { router, useGlobalSearchParams, useSegments } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MessageUnreadBadge } from './MessageUnreadBadge';
import { BottomSheet } from './ui/BottomSheet';
import { Icon } from './ui/Icon';
import { useColorMode } from '@/providers/ColorModeProvider';
import { useTabPressStore, type NavSection } from '@/store/tabPressStore';

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const { colors, isDark } = useColorMode();
  const inCommunity = segments[0] === 'community' && !!params.communityId;
  const pressActiveTab = useTabPressStore((state) => state.pressActiveTab);
  const { width } = useWindowDimensions();
  const compact = width <= 480;

  const goToTab = (section: NavSection, path: '/posts' | '/medlege' | '/messages' | '/profile') => {
    const targetSegment = path.slice(1);
    const isAtTabRoot = segments[0] === targetSegment && segments.length === 1;
    if (isAtTabRoot) {
      pressActiveTab(section);
      return;
    }
    router.replace(path);
  };

  const openCreate = () => {
    if (segments[0] === 'community' && segments.length === 1) {
      router.push('/community/create-group');
      return;
    }
    setPickerOpen(true);
  };

  const createPost = () => {
    setPickerOpen(false);
    router.push('/posts/create');
  };

  const createReel = () => {
    setPickerOpen(false);
    router.push({ pathname: '/posts/create', params: { type: 'reel' } });
  };

  const createPodcast = () => {
    setPickerOpen(false);
    router.push({ pathname: '/posts/create', params: { type: 'podcast' } });
  };

  const createDiscussion = () => {
    setPickerOpen(false);
    router.push({
      pathname: '/posts/create',
      params: { type: 'post', communityId: params.communityId, communityKind: 'discussions' },
    });
  };

  const createArticle = () => {
    setPickerOpen(false);
    router.push({
      pathname: '/posts/create',
      params: { type: 'post', communityId: params.communityId, communityKind: 'articles' },
    });
  };

  return (
    <>
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: isDark ? colors.background : colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={[styles.navRow, { height: compact ? 68 : 78 }]}>
          <NavItem
            active={active === 'home'}
            icon={active === 'home' ? 'home' : 'home-outline'}
            label="Нүүр"
            compact={compact}
            onPress={() => goToTab('home', '/posts')}
          />
          <NavItem
            active={active === 'knowledge'}
            icon={active === 'knowledge' ? 'school' : 'school-outline'}
            label="Мэдлэг"
            compact={compact}
            onPress={() => goToTab('knowledge', '/medlege')}
          />
          <View
            style={[
              styles.createShell,
              {
                width: compact ? 60 : 68,
                height: compact ? 60 : 68,
                marginTop: compact ? -20 : -25,
                borderColor: colors.border,
                backgroundColor: isDark ? colors.background : colors.surface,
              },
            ]}
          >
            <Pressable
              accessibilityLabel="Шинэ контент"
              onPress={openCreate}
              style={[
                styles.createButton,
                {
                  width: compact ? 50 : 56,
                  height: compact ? 50 : 56,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Icon name="add" size={compact ? 25 : 28} color={colors.ink} />
            </Pressable>
          </View>
          <NavItem
            active={active === 'messages'}
            icon={active === 'messages' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
            label="Мессеж"
            compact={compact}
            showUnread
            onPress={() => goToTab('messages', '/messages')}
          />
          <NavItem
            active={active === 'profile'}
            icon={active === 'profile' ? 'person' : 'person-outline'}
            label="Профайл"
            compact={compact}
            onPress={() => goToTab('profile', '/profile')}
          />
        </View>
      </SafeAreaView>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Text className="mb-m text-center text-lg font-extrabold text-text-primary">
          Юу үүсгэхийг хүсэж байна?
        </Text>
        <View className="flex-row flex-wrap justify-center gap-s">
          {inCommunity ? (
            <>
              <CreateOption
                icon="chatbubbles-outline"
                label="Хэлэлцүүлэг"
                onPress={createDiscussion}
              />
              <CreateOption icon="newspaper-outline" label="Нийтлэл" onPress={createArticle} />
            </>
          ) : (
            <CreateOption icon="create-outline" label="Пост" onPress={createPost} />
          )}
          <CreateOption icon="film-outline" label="Reel" onPress={createReel} />
          <CreateOption icon="mic-outline" label="Podcast" onPress={createPodcast} />
        </View>
      </BottomSheet>
    </>
  );
}

function CreateOption({
  icon,
  label,
  badge,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  badge?: string;
  onPress: () => void;
}) {
  const { iconAccent } = useColorMode();
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[112px] min-w-[96px] max-w-[164px] flex-1 basis-[30%] items-center justify-center gap-s rounded-card border border-border bg-background-paper px-s py-m active:opacity-70"
    >
      <View className="h-11 w-11 items-center justify-center rounded-avatar bg-background-paper">
        <Icon name={icon} size={22} color={iconAccent} />
      </View>
      <Text className="text-center text-xs font-bold text-text-primary">{label}</Text>
      {!!badge && <Text className="text-center text-[10px] text-text-muted">{badge}</Text>}
    </Pressable>
  );
}

function NavItem({
  active,
  icon,
  label,
  showUnread,
  compact,
  onPress,
}: {
  active: boolean;
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  showUnread?: boolean;
  compact: boolean;
  onPress: () => void;
}) {
  const { iconAccent, colors } = useColorMode();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.navItem, { width: compact ? 60 : 67 }]}
    >
      <Icon
        name={icon}
        size={compact ? 23 : 25}
        color={active ? iconAccent : colors.textSecondary}
      />
      {showUnread && <MessageUnreadBadge />}
      <Text
        style={[
          styles.navLabel,
          { fontSize: compact ? 11 : 12, color: active ? iconAccent : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flexShrink: 0,
    zIndex: 20,
    borderTopWidth: 1,
  },
  navRow: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  createShell: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  createButton: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navLabel: { fontWeight: '600', lineHeight: 16, textAlign: 'center' },
  pressed: { opacity: 0.68 },
});
