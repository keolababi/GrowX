import { useEffect, useMemo, useState } from 'react';
import { router, type Href } from 'expo-router';
import axios from 'axios';
import { Image, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { AppBottomNav } from '@/components/AppBottomNav';
import { AppPageHeader } from '@/components/AppPageHeader';
import { NotificationBell } from '@/components/NotificationBell';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Tag } from '@/components/ui/Tag';
import { api } from '@/services/api';
import type {
  GlobalSearchResponse,
  SearchCommunity,
  SearchLesson,
  SearchPodcast,
  SearchPost,
} from '@/types/search';
import type { DiscoverUser } from '@/types/discover';
import type { Community } from '@/types/community';
import type { SocialPost } from '@/types/post';
import type { Lesson } from '@/types/learning';
import type { Podcast } from '@/types/media';
import { getApiError } from '@/utils/auth';
import { relativeTime } from '@/utils/relativeTime';
import { useColorMode } from '@/providers/ColorModeProvider';

const categories = ['Бүгд', 'Хүмүүс', 'Групп', 'Пост', 'Хичээл', 'Подкаст'] as const;
type Category = (typeof categories)[number];

const emptyResults: GlobalSearchResponse = {
  query: '',
  users: [],
  communities: [],
  posts: [],
  lessons: [],
  podcasts: [],
};

const webScreenStyle = {
  height: '100vh',
  minHeight: '100vh',
  maxHeight: '100vh',
} as never;

async function loadFromExistingRoutes(query: string): Promise<GlobalSearchResponse> {
  const [usersResponse, communitiesResponse, postsResponse, lessonsResponse, podcastsResponse] =
    await Promise.all([
      api.get<{ users: DiscoverUser[] }>('/conversations/users', { params: { q: query } }),
      api.get<{ communities: Community[] }>('/communities'),
      api.get<{ posts: SocialPost[] }>('/posts'),
      api.get<{ lessons: Lesson[] }>('/lessons'),
      api.get<{ podcasts: Podcast[] }>('/media/podcasts'),
    ]);
  const q = query.trim().toLocaleLowerCase();
  const includes = (...parts: Array<string | null | undefined>) =>
    !q || parts.filter(Boolean).join(' ').toLocaleLowerCase().includes(q);

  return {
    query: query.trim(),
    users: usersResponse.data.users.slice(0, 8),
    communities: communitiesResponse.data.communities
      .filter((item) => includes(item.name, item.description))
      .slice(0, 8),
    posts: postsResponse.data.posts
      .filter((item) =>
        includes(item.content, item.author.displayName, item.author.company, item.community?.name),
      )
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        content: item.content,
        imageUrl: item.imageUrl,
        createdAt: item.createdAt,
        community: item.community,
        author: item.author,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
      })),
    lessons: lessonsResponse.data.lessons
      .filter((item) => includes(item.title, item.description, item.content, item.category))
      .slice(0, 8),
    podcasts: podcastsResponse.data.podcasts
      .filter((item) => includes(item.title, item.description, item.author.displayName))
      .slice(0, 8),
  };
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (!count) return null;
  return (
    <View className="mt-xl">
      <View className="mb-s flex-row items-center gap-s">
        <Text className="text-lg font-black text-text-primary">{title}</Text>
        <View className="min-w-[24px] items-center rounded-avatar bg-background-soft px-2 py-1">
          <Text className="text-[10px] font-black text-brand-primary">{count}</Text>
        </View>
      </View>
      <View className="gap-s">{children}</View>
    </View>
  );
}

function ResultRow({
  icon,
  title,
  subtitle,
  meta,
  imageUrl,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  subtitle?: string | null;
  meta?: string;
  imageUrl?: string | null;
  onPress: () => void;
}) {
  const { colors, iconAccent } = useColorMode();
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[78px] flex-row items-center rounded-card border border-border bg-background-paper p-m active:opacity-70"
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="h-12 w-12 rounded-btn bg-background-soft" />
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-btn bg-background-soft">
          <Icon name={icon} size={22} color={iconAccent} />
        </View>
      )}
      <View className="ml-s min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-extrabold text-text-primary">
          {title}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={2} className="mt-1 text-xs leading-4 text-text-muted">
            {subtitle}
          </Text>
        )}
        {!!meta && <Text className="mt-1 text-[10px] font-bold text-brand-primary">{meta}</Text>}
      </View>
      <Icon name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function UserResult({ item }: { item: DiscoverUser }) {
  const title =
    item.accountType === 'BUSINESS' && item.company
      ? item.company
      : item.displayName || item.email.split('@')[0];
  return (
    <ResultRow
      icon={item.accountType === 'BUSINESS' ? 'business-outline' : 'person-outline'}
      title={title}
      subtitle={item.industry || item.bio || (item.isMentor ? 'GrowX ментор' : 'GrowX гишүүн')}
      meta={item.accountType === 'BUSINESS' ? 'БИЗНЕС' : item.isMentor ? 'МЕНТОР' : undefined}
      imageUrl={item.avatarUrl}
      onPress={() => router.push(`/users/${item.id}` as Href)}
    />
  );
}

function CommunityResult({ item }: { item: SearchCommunity }) {
  return (
    <ResultRow
      icon="people-outline"
      title={item.name}
      subtitle={item.description || 'GrowX групп'}
      meta={`${item.memberCount} гишүүн · ${item.postCount} пост`}
      imageUrl={item.coverUrl}
      onPress={() => router.push(`/community/${item.id}` as Href)}
    />
  );
}

function PostResult({ item }: { item: SearchPost }) {
  const author = item.author.displayName || item.author.company || item.author.email.split('@')[0];
  return (
    <ResultRow
      icon="document-text-outline"
      title={author}
      subtitle={item.content}
      meta={`${relativeTime(item.createdAt)} · ${item.likeCount} like · ${item.commentCount} comment`}
      imageUrl={item.imageUrl}
      onPress={() => router.push(`/posts/${item.id}`)}
    />
  );
}

function LessonResult({ item }: { item: SearchLesson }) {
  return (
    <ResultRow
      icon="book-outline"
      title={item.title}
      subtitle={item.description}
      meta={`${item.category} · ${item.difficulty} · ${item.durationMin} мин`}
      onPress={() => router.push(`/medlege/${item.id}`)}
    />
  );
}

function PodcastResult({ item }: { item: SearchPodcast }) {
  const host = item.author.displayName || item.author.email?.split('@')[0] || 'GrowX';
  return (
    <ResultRow
      icon="mic-outline"
      title={item.title}
      subtitle={item.description || `${host}-ийн подкаст`}
      meta={`${host} · ${item.episodes.length ? 'Шинэ дугаартай' : 'Дугаар хүлээгдэж байна'}`}
      imageUrl={item.coverUrl}
      onPress={() => router.push({ pathname: '/podcast', params: { podcastId: item.id } })}
    />
  );
}

export default function DiscoverScreen() {
  const { iconAccent } = useColorMode();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Бүгд');
  const [results, setResults] = useState<GlobalSearchResponse>(emptyResults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError('');
        try {
          const { data } = await api.get<GlobalSearchResponse>('/search', { params: { q: query } });
          if (active) setResults(data);
        } catch (value) {
          if (axios.isAxiosError(value) && value.response?.status === 404) {
            try {
              const fallback = await loadFromExistingRoutes(query);
              if (active) setResults(fallback);
            } catch (fallbackError) {
              if (active) setError(getApiError(fallbackError, 'Хайлтын үр дүнг авч чадсангүй.'));
            }
          } else if (active) {
            setError(getApiError(value, 'Хайлтын үр дүнг авч чадсангүй.'));
          }
        } finally {
          if (active) setLoading(false);
        }
      },
      query.trim() ? 280 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const count = useMemo(
    () =>
      results.users.length +
      results.communities.length +
      results.posts.length +
      results.lessons.length +
      results.podcasts.length,
    [results],
  );
  const visibleCount = useMemo(() => {
    if (category === 'Хүмүүс') return results.users.length;
    if (category === 'Групп') return results.communities.length;
    if (category === 'Пост') return results.posts.length;
    if (category === 'Хичээл') return results.lessons.length;
    if (category === 'Подкаст') return results.podcasts.length;
    return count;
  }, [category, count, results]);
  const show = (target: Category) => category === 'Бүгд' || category === target;
  const searching = query.trim().length > 0;

  return (
    <SafeAreaView
      className="min-h-0 flex-1 overflow-hidden bg-background-app"
      style={Platform.OS === 'web' ? webScreenStyle : undefined}
    >
      <AppPageHeader
        title="Нэгдсэн хайлт"
        back
        backFallback="/posts"
        actions={<NotificationBell />}
      />

      <View className="w-full max-w-[900px] self-center px-l pt-m">
        <View className="rounded-card border border-border bg-background-paper p-s">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Хүн, групп, пост, хичээл, подкаст хайх"
          />
          <View className="mt-s flex-row flex-wrap gap-xs px-1 pb-1">
            {categories.map((item) => (
              <Tag
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
              />
            ))}
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loader size={44} />
          <Text className="mt-s text-xs text-text-muted">Хайж байна...</Text>
        </View>
      ) : (
        <ScrollView
          className="min-h-0 flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: '100%',
            maxWidth: 900,
            alignSelf: 'center',
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
        >
          <View className="mt-m flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-black text-text-primary">
                {searching ? `“${query.trim()}”` : 'Танд санал болгох'}
              </Text>
              <Text className="mt-1 text-xs text-text-muted">
                {searching ? `${visibleCount} үр дүн олдлоо` : 'GrowX-ийн бүх хэсгээс нэг дор'}
              </Text>
            </View>
            {searching && (
              <Pressable
                onPress={() => setQuery('')}
                className="rounded-avatar bg-background-soft px-s py-xs"
              >
                <Text className="text-xs font-bold text-text-secondary">Цэвэрлэх</Text>
              </Pressable>
            )}
          </View>

          {!!error && (
            <View className="mt-m rounded-btn border border-danger/40 bg-danger/10 p-m">
              <Text className="text-sm font-semibold text-danger">{error}</Text>
            </View>
          )}

          {!error && visibleCount === 0 && (
            <View className="mt-xl items-center rounded-card border border-dashed border-border bg-background-paper px-l py-12">
              <View className="h-16 w-16 items-center justify-center rounded-avatar bg-background-soft">
                <Icon name="search-outline" size={30} color={iconAccent} />
              </View>
              <Text className="mt-m text-lg font-black text-text-primary">Илэрц олдсонгүй</Text>
              <Text className="mt-2 max-w-[360px] text-center text-sm leading-5 text-text-muted">
                Үгээ богиносгох эсвэл өөр ангиллаар хайж үзээрэй.
              </Text>
            </View>
          )}

          {show('Хүмүүс') && (
            <Section title="Хүмүүс ба бизнес" count={results.users.length}>
              {results.users.map((item) => (
                <UserResult key={item.id} item={item} />
              ))}
            </Section>
          )}
          {show('Групп') && (
            <Section title="Групп" count={results.communities.length}>
              {results.communities.map((item) => (
                <CommunityResult key={item.id} item={item} />
              ))}
            </Section>
          )}
          {show('Пост') && (
            <Section title="Пост" count={results.posts.length}>
              {results.posts.map((item) => (
                <PostResult key={item.id} item={item} />
              ))}
            </Section>
          )}
          {show('Хичээл') && (
            <Section title="Хичээл" count={results.lessons.length}>
              {results.lessons.map((item) => (
                <LessonResult key={item.id} item={item} />
              ))}
            </Section>
          )}
          {show('Подкаст') && (
            <Section title="Подкаст" count={results.podcasts.length}>
              {results.podcasts.map((item) => (
                <PodcastResult key={item.id} item={item} />
              ))}
            </Section>
          )}
        </ScrollView>
      )}

      <AppBottomNav />
    </SafeAreaView>
  );
}
