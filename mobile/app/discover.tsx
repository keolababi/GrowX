import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { AppBottomNav } from '@/components/AppBottomNav';
import { NotificationBell } from '@/components/NotificationBell';
import { SearchBar } from '@/components/ui/SearchBar';
import { Tag } from '@/components/ui/Tag';
import { api } from '@/services/api';
import { useUser } from '@/providers/UserProvider';
import { getApiError } from '@/utils/auth';
import type { DiscoverUser } from '@/types/discover';
import type { Community } from '@/types/community';

const lime = '#9AF000';
const categories = ['Бүгд', 'Хэрэглэгчид', 'Бизнес', 'Групп'] as const;
type Category = (typeof categories)[number];

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase();
}

function UserCard({
  user,
  isFollowing,
  onToggleFollow,
}: {
  user: DiscoverUser;
  isFollowing: boolean;
  onToggleFollow: () => void;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/users/${user.id}` as Href)}
      className="mr-s w-[180px] rounded-card border border-border bg-background-paper p-m"
    >
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} className="h-12 w-12 rounded-avatar" />
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-avatar border border-border bg-background-app">
          <Text className="font-extrabold text-brand-primary">
            {initials(user.displayName, user.email)}
          </Text>
        </View>
      )}
      <Text numberOfLines={1} className="mt-s text-sm font-extrabold text-text-primary">
        {user.accountType === 'BUSINESS' && user.company
          ? user.company
          : user.displayName || user.email.split('@')[0]}
      </Text>
      <Text numberOfLines={2} className="mt-1 h-9 text-xs leading-4 text-text-muted">
        {user.accountType === 'BUSINESS' ? user.industry || 'Бизнес' : user.bio || 'GrowX гишүүн'}
      </Text>
      <Pressable
        onPress={(event) => {
          event.stopPropagation();
          onToggleFollow();
        }}
        className={`mt-s h-8 items-center justify-center rounded-avatar border ${
          isFollowing ? 'border-border' : 'border-brand-primary bg-brand-primary'
        }`}
      >
        <Text
          className={`text-xs font-bold ${isFollowing ? 'text-text-secondary' : 'text-background-app'}`}
        >
          {isFollowing ? 'Дагаж буй' : 'Дагах'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function TopicCard({ community }: { community: Community }) {
  return (
    <Pressable
      onPress={() => router.push(`/community/${community.id}` as Href)}
      className="mr-s w-[150px] rounded-card border border-border bg-background-paper p-m"
    >
      {community.coverUrl ? (
        <Image source={{ uri: community.coverUrl }} className="h-16 w-full rounded-btn" />
      ) : (
        <View className="h-16 w-full items-center justify-center rounded-btn bg-background-app">
          <Text className="font-extrabold text-brand-primary">
            {community.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}
      <Text numberOfLines={1} className="mt-s text-sm font-extrabold text-text-primary">
        {community.name}
      </Text>
      <Text className="mt-1 text-xs text-text-muted">{community.memberCount} гишүүн</Text>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Бүгд');
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (search = '') => {
      setLoading(true);
      setError('');
      try {
        const [usersResponse, communitiesResponse, followingResponse] = await Promise.all([
          api.get<{ users: DiscoverUser[] }>('/conversations/users', { params: { q: search } }),
          api.get<{ communities: Community[] }>('/communities'),
          user?.id
            ? api.get<{ users: { id: string }[] }>(`/users/${user.id}/following`)
            : Promise.resolve(null),
        ]);
        setUsers(usersResponse.data.users);
        setCommunities(communitiesResponse.data.communities);
        if (followingResponse) {
          setFollowingIds(new Set(followingResponse.data.users.map((item) => item.id)));
        }
      } catch (value) {
        setError(getApiError(value, 'Нээх мэдээллийг ачаалж чадсангүй.'));
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    const timer = setTimeout(() => void load(query), 250);
    return () => clearTimeout(timer);
  }, [load, query]);

  const toggleFollow = async (targetId: string) => {
    const wasFollowing = followingIds.has(targetId);
    setFollowingIds((current) => {
      const next = new Set(current);
      if (wasFollowing) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
    try {
      await api.post(`/users/${targetId}/follow`);
    } catch (value) {
      setFollowingIds((current) => {
        const next = new Set(current);
        if (wasFollowing) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
      setError(getApiError(value, 'Дагах үйлдэл амжилтгүй боллоо.'));
    }
  };

  const mentors = useMemo(() => users.filter((item) => item.accountType === 'PERSONAL'), [users]);
  const businesses = useMemo(
    () => users.filter((item) => item.accountType === 'BUSINESS'),
    [users],
  );
  const trendingTopics = useMemo(
    () =>
      [...communities]
        .sort((a, b) => b.memberCount + b.postCount - (a.memberCount + a.postCount))
        .slice(0, 8),
    [communities],
  );
  const filteredCommunities = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return communities;
    return communities.filter((community) =>
      community.name.toLocaleLowerCase().includes(normalized),
    );
  }, [communities, query]);

  const showMentors = category === 'Бүгд' || category === 'Хэрэглэгчид';
  const showBusinesses = category === 'Бүгд' || category === 'Бизнес';
  const showGroups = category === 'Бүгд' || category === 'Групп';
  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <View className="h-16 flex-row items-center justify-between px-l">
        <Text className="text-xl font-extrabold text-text-primary">Нээх</Text>
        <NotificationBell />
      </View>

      <View className="px-l pb-s">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Хэрэглэгч, бизнес, групп хайх"
        />
      </View>

      <View className="flex-row gap-s px-l pb-s">
        {categories.map((item) => (
          <Tag
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={lime} size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {!!error && <Text className="px-l py-s text-danger">{error}</Text>}

          {!isSearching && !!trendingTopics.length && showGroups && (
            <View className="mt-m">
              <Text className="px-l text-lg font-extrabold text-text-primary">Тренд групп</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-s px-l">
                {trendingTopics.map((community) => (
                  <TopicCard key={community.id} community={community} />
                ))}
              </ScrollView>
            </View>
          )}

          {showMentors && !!mentors.length && (
            <View className="mt-l">
              <Text className="px-l text-lg font-extrabold text-text-primary">
                Санал болгож буй хэрэглэгчид
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-s px-l">
                {mentors.map((item) => (
                  <UserCard
                    key={item.id}
                    user={item}
                    isFollowing={followingIds.has(item.id)}
                    onToggleFollow={() => void toggleFollow(item.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {showBusinesses && !!businesses.length && (
            <View className="mt-l">
              <Text className="px-l text-lg font-extrabold text-text-primary">
                Бизнес, Стартапууд
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-s px-l">
                {businesses.map((item) => (
                  <UserCard
                    key={item.id}
                    user={item}
                    isFollowing={followingIds.has(item.id)}
                    onToggleFollow={() => void toggleFollow(item.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {isSearching && showGroups && !!filteredCommunities.length && (
            <View className="mt-l px-l">
              <Text className="text-lg font-extrabold text-text-primary">Групп</Text>
              {filteredCommunities.map((community) => (
                <Pressable
                  key={community.id}
                  onPress={() => router.push(`/community/${community.id}` as Href)}
                  className="mt-s flex-row items-center gap-s rounded-card border border-border bg-background-paper p-m"
                >
                  <View className="h-11 w-11 items-center justify-center rounded-btn bg-background-app">
                    <Text className="font-extrabold text-brand-primary">
                      {community.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="text-sm font-extrabold text-text-primary">
                      {community.name}
                    </Text>
                    <Text className="text-xs text-text-muted">{community.memberCount} гишүүн</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {!mentors.length && !businesses.length && !filteredCommunities.length && (
            <View className="items-center px-9 pt-20">
              <Text className="text-lg font-bold text-text-primary">Үр дүн олдсонгүй</Text>
              <Text className="mt-2 text-center text-sm text-text-muted">
                Өөр түлхүүр үгээр хайж үзнэ үү.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <AppBottomNav />
    </SafeAreaView>
  );
}
