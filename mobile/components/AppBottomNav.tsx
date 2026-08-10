import { useState } from 'react';
import { router, useGlobalSearchParams, useSegments } from 'expo-router';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
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

  const goToTab = (section: NavSection, path: '/posts' | '/medlege' | '/messages' | '/profile') => {
    if (active === section) {
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
        className={`shrink-0 ${isDark ? 'bg-background-app' : 'bg-background-paper'}`}
        style={{ zIndex: 20, borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <View className="h-[82px] w-full max-w-[680px] self-center flex-row items-center justify-around px-xs pb-1">
          <NavItem
            active={active === 'home'}
            icon={active === 'home' ? 'home' : 'home-outline'}
            label="Нүүр"
            onPress={() => goToTab('home', '/posts')}
          />
          <NavItem
            active={active === 'knowledge'}
            icon={active === 'knowledge' ? 'school' : 'school-outline'}
            label="Мэдлэг"
            onPress={() => goToTab('knowledge', '/medlege')}
          />
          <View
            className={`-mt-7 h-[72px] w-[72px] items-center justify-center rounded-avatar ${isDark ? 'bg-background-app' : 'bg-background-paper'}`}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              boxShadow: '0 5px 14px rgba(0, 0, 0, 0.16)',
            }}
          >
            <Pressable
              accessibilityLabel="Шинэ контент"
              onPress={openCreate}
              className="h-[60px] w-[60px] items-center justify-center rounded-avatar bg-brand-primary active:opacity-80"
            >
              <Icon name="add" size={30} color={colors.ink} />
            </Pressable>
          </View>
          <NavItem
            active={active === 'messages'}
            icon={active === 'messages' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
            label="Мессеж"
            showUnread
            onPress={() => goToTab('messages', '/messages')}
          />
          <NavItem
            active={active === 'profile'}
            icon={active === 'profile' ? 'person' : 'person-outline'}
            label="Профайл"
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
  onPress,
}: {
  active: boolean;
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  showUnread?: boolean;
  onPress: () => void;
}) {
  const { iconAccent, colors } = useColorMode();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="w-[69px] items-center gap-1 active:opacity-60"
    >
      <Icon name={icon} size={27} color={active ? iconAccent : colors.textSecondary} />
      {showUnread && <MessageUnreadBadge />}
      <Text
        className={`text-xs font-semibold ${active ? 'text-brand-primary' : 'text-text-secondary'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
