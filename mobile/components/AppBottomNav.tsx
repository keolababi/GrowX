import { useState } from 'react';
import { router, useGlobalSearchParams, useSegments } from 'expo-router';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { MessageUnreadBadge } from './MessageUnreadBadge';
import { BottomSheet } from './ui/BottomSheet';
import { Icon } from './ui/Icon';

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const inCommunity = segments[0] === 'community' && !!params.communityId;

  const openCreate = () => {
    if (segments[0] === 'community' && segments.length === 1) {
      router.push('/community/create-group');
      return;
    }
    setPickerOpen(true);
  };

  const createPost = () => {
    setPickerOpen(false);
    if (inCommunity) {
      router.push({
        pathname: '/posts/create',
        params: { type: 'post', communityId: params.communityId, communityKind: 'discussions' },
      });
      return;
    }
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

  return (
    <SafeAreaView
      className="shrink-0 border-t border-border bg-background-app"
      style={{ zIndex: 20 }}
    >
      <View className="h-[78px] w-full max-w-[680px] self-center flex-row items-center justify-around px-xs pb-1">
        <NavItem
          active={active === 'home'}
          icon={active === 'home' ? 'home' : 'home-outline'}
          label="Нүүр"
          onPress={() => router.replace('/posts')}
        />
        <NavItem
          active={active === 'knowledge'}
          icon={active === 'knowledge' ? 'book' : 'book-outline'}
          label="Мэдлэг"
          onPress={() => router.replace('/medlege')}
        />
        <Pressable
          accessibilityLabel="Шинэ контент"
          onPress={openCreate}
          className="-mt-6 h-[58px] w-[58px] items-center justify-center rounded-avatar border-4 border-background-app bg-brand-primary active:opacity-80"
        >
          <Icon name="add" size={30} color="#020B0D" />
        </Pressable>
        <NavItem
          active={active === 'messages'}
          icon={active === 'messages' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
          label="Мессеж"
          showUnread
          onPress={() => router.replace('/messages')}
        />
        <NavItem
          active={active === 'profile'}
          icon={active === 'profile' ? 'person' : 'person-outline'}
          label="Профайл"
          onPress={() => router.replace('/profile')}
        />
      </View>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Text className="mb-m text-center text-lg font-extrabold text-text-primary">
          Юу үүсгэхийг хүсэж байна?
        </Text>
        <View className="flex-row flex-wrap gap-s">
          <CreateOption icon="create-outline" label="Пост" onPress={createPost} />
          <CreateOption icon="film-outline" label="Reel" onPress={createReel} />
          <CreateOption icon="mic-outline" label="Podcast" onPress={createPodcast} />
          {inCommunity && (
            <CreateOption
              icon="chatbubbles-outline"
              label="Хэлэлцүүлэг"
              onPress={createDiscussion}
            />
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
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
  return (
    <Pressable
      onPress={onPress}
      className="min-w-[96px] flex-1 items-center gap-s rounded-card border border-border bg-background-paper px-s py-m active:opacity-70"
    >
      <View className="h-11 w-11 items-center justify-center rounded-avatar bg-background-paper">
        <Icon name={icon} size={22} color="#9AF000" />
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="w-[69px] items-center gap-1 active:opacity-60"
    >
      <Icon name={icon} size={26} color={active ? '#9AF000' : '#D8DFDC'} />
      {showUnread && <MessageUnreadBadge />}
      <Text
        className={`text-xs font-semibold ${active ? 'text-brand-primary' : 'text-text-secondary'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
