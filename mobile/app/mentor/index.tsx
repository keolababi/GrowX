import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { AppBottomNav } from '@/components/AppBottomNav';
import { NotificationBell } from '@/components/NotificationBell';
import { AppPageHeader } from '@/components/AppPageHeader';
import { GlobalSearchButton } from '@/components/GlobalSearchButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/services/api';
import { useUser } from '@/providers/UserProvider';
import { getApiError } from '@/utils/auth';
import type { DiscoverUser } from '@/types/discover';
import type { CollaborationRequest } from '@/types/collaboration';

const lime = '#9AF000';
const categories = ['Бүгд', 'Ментор', 'Бизнес & Стартап'] as const;
type Category = (typeof categories)[number];

const webScreenStyle = {
  height: '100vh',
  minHeight: '100vh',
  maxHeight: '100vh',
} as unknown as ViewStyle;

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase();
}

function displayName(user: {
  displayName: string | null;
  email: string;
  company: string | null;
  accountType: string;
}) {
  if (user.accountType === 'BUSINESS' && user.company) return user.company;
  return user.displayName || user.email.split('@')[0];
}

function MentorRow({
  user,
  isFollowing,
  onToggleFollow,
  onMessage,
  onRequestCollaboration,
  isSelf,
}: {
  user: DiscoverUser;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
  onRequestCollaboration: () => void;
  isSelf: boolean;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/users/${user.id}` as Href)}
      className="mb-s overflow-hidden rounded-[20px] border border-[#254238] bg-[#081915] p-m active:opacity-80"
    >
      <View className="flex-row items-center">
        <View className="relative">
          {user.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              className="h-14 w-14 rounded-avatar border border-[#345448]"
            />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-avatar border border-[#345448] bg-[#102921]">
              <Text className="text-base font-black text-brand-primary">
                {initials(user.displayName, user.email)}
              </Text>
            </View>
          )}
          <View className="absolute bottom-0 right-0 h-4 w-4 rounded-avatar border-[3px] border-[#081915] bg-brand-primary" />
        </View>
        <View className="ml-m min-w-0 flex-1">
          <Text numberOfLines={1} className="text-base font-black text-text-primary">
            {displayName(user)}
          </Text>
          <Text numberOfLines={2} className="mt-1 text-xs leading-5 text-text-muted">
            {user.accountType === 'BUSINESS'
              ? user.industry || 'Бизнес'
              : user.bio || 'GrowX гишүүн'}
          </Text>
        </View>
        <Badge
          label={
            user.accountType === 'BUSINESS'
              ? 'Бизнес'
              : user.isMentor
                ? 'Ментор'
                : 'Энгийн хэрэглэгч'
          }
          variant={user.accountType === 'BUSINESS' ? 'brand' : 'muted'}
        />
      </View>

      {isSelf ? (
        <View className="mt-m h-10 flex-row items-center justify-center gap-s rounded-avatar border border-brand-primary/40 bg-[#10271F]">
          <Icon name="checkmark-circle" size={16} color={lime} />
          <Text className="text-xs font-bold text-brand-primary">Таны ментор профайл</Text>
        </View>
      ) : (
        <View className="mt-m flex-row gap-s border-t border-[#1E382F] pt-m">
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onToggleFollow();
            }}
            className={`h-10 flex-1 flex-row items-center justify-center gap-1 rounded-avatar border ${
              isFollowing ? 'border-border' : 'border-brand-primary bg-brand-primary'
            }`}
          >
            <Icon
              name={isFollowing ? 'checkmark' : 'person-add-outline'}
              size={15}
              color={isFollowing ? '#A7AEB0' : '#020B0D'}
            />
            <Text
              className={`text-xs font-bold ${isFollowing ? 'text-text-secondary' : 'text-background-app'}`}
            >
              {isFollowing ? 'Холбогдсон' : 'Холбогдох'}
            </Text>
          </Pressable>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onMessage();
            }}
            className="h-10 flex-1 flex-row items-center justify-center gap-1 rounded-avatar border border-[#30483F] bg-[#0D211B]"
          >
            <Icon name="chatbubble-outline" size={15} color="#D8DFDC" />
            <Text className="text-xs font-bold text-text-secondary">Мессеж</Text>
          </Pressable>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onRequestCollaboration();
            }}
            className="h-10 flex-1 flex-row items-center justify-center gap-1 rounded-avatar border border-[#30483F] bg-[#0D211B]"
          >
            <Icon name="people-outline" size={15} color="#D8DFDC" />
            <Text className="text-xs font-bold text-text-secondary">Хамтрах</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function statusLabel(status: CollaborationRequest['status']) {
  if (status === 'ACCEPTED') return 'Зөвшөөрсөн';
  if (status === 'DECLINED') return 'Татгалзсан';
  return 'Хүлээгдэж буй';
}

function EmptyState({
  icon,
  title,
  copy,
}: {
  icon: 'search' | 'mail';
  title: string;
  copy: string;
}) {
  return (
    <View className="mt-l items-center rounded-[20px] border border-dashed border-[#315143] bg-[#071915] px-l py-xl">
      <View className="h-14 w-14 items-center justify-center rounded-avatar bg-[#123025]">
        <Icon name={icon === 'search' ? 'search-outline' : 'mail-outline'} size={25} color={lime} />
      </View>
      <Text className="mt-m text-base font-black text-text-primary">{title}</Text>
      <Text className="mt-1 max-w-[380px] text-center text-xs leading-5 text-text-muted">
        {copy}
      </Text>
    </View>
  );
}

function RequestRow({
  request,
  showActions,
  onRespond,
}: {
  request: CollaborationRequest;
  showActions: boolean;
  onRespond?: (accept: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/users/${request.user.id}` as Href)}
      className="mb-s rounded-[20px] border border-[#254238] bg-[#081915] p-m active:opacity-80"
    >
      <View className="flex-row items-center">
        {request.user.avatarUrl ? (
          <Image
            source={{ uri: request.user.avatarUrl }}
            className="h-12 w-12 rounded-avatar border border-[#345448]"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-avatar border border-[#345448] bg-[#102921]">
            <Text className="font-extrabold text-brand-primary">
              {initials(request.user.displayName, request.user.email)}
            </Text>
          </View>
        )}
        <View className="ml-m min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-black text-text-primary">
            {displayName(request.user)}
          </Text>
          <Text numberOfLines={2} className="mt-1 text-xs text-text-muted">
            {request.message}
          </Text>
        </View>
        {!showActions && (
          <Badge
            label={statusLabel(request.status)}
            variant={
              request.status === 'ACCEPTED'
                ? 'success'
                : request.status === 'DECLINED'
                  ? 'danger'
                  : 'muted'
            }
          />
        )}
      </View>
      {showActions && request.status === 'PENDING' && (
        <View className="mt-m flex-row gap-s border-t border-[#1E382F] pt-m">
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onRespond?.(true);
            }}
            className="h-10 flex-1 items-center justify-center rounded-avatar border border-brand-primary bg-brand-primary"
          >
            <Text className="text-xs font-bold text-background-app">Зөвшөөрөх</Text>
          </Pressable>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onRespond?.(false);
            }}
            className="h-10 flex-1 items-center justify-center rounded-avatar border border-[#30483F] bg-[#0D211B]"
          >
            <Text className="text-xs font-bold text-text-secondary">Татгалзах</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

export default function MentorScreen() {
  const { user } = useUser();
  const [section, setSection] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Бүгд');
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [requestSection, setRequestSection] = useState(0);
  const [received, setReceived] = useState<CollaborationRequest[]>([]);
  const [sent, setSent] = useState<CollaborationRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [composerUser, setComposerUser] = useState<DiscoverUser | null>(null);
  const [composerMessage, setComposerMessage] = useState('');
  const [composerSending, setComposerSending] = useState(false);
  const [composerError, setComposerError] = useState('');

  const loadUsers = useCallback(
    async (search = '') => {
      setLoading(true);
      setError('');
      try {
        const [usersResponse, followingResponse] = await Promise.all([
          api.get<{ users: DiscoverUser[] }>('/conversations/users', {
            params: { q: search, includeSelf: true },
          }),
          user?.id
            ? api.get<{ users: { id: string }[] }>(`/users/${user.id}/following`)
            : Promise.resolve(null),
        ]);
        setUsers(usersResponse.data.users);
        if (followingResponse) {
          setFollowingIds(new Set(followingResponse.data.users.map((item) => item.id)));
        }
      } catch (value) {
        setError(getApiError(value, 'Менторын мэдээллийг ачаалж чадсангүй.'));
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        api.get<{ requests: CollaborationRequest[] }>('/collaborations/received'),
        api.get<{ requests: CollaborationRequest[] }>('/collaborations/sent'),
      ]);
      setReceived(receivedResponse.data.requests);
      setSent(sentResponse.data.requests);
    } catch {
      // silently ignore; requests tab shows empty state
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadUsers(query), 250);
    return () => clearTimeout(timer);
  }, [loadUsers, query]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useFocusEffect(
    useCallback(() => {
      void loadUsers(query);
      void loadRequests();
    }, [loadRequests, loadUsers, query]),
  );

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
      setError(getApiError(value, 'Холбогдох үйлдэл амжилтгүй боллоо.'));
    }
  };

  const startConversation = async (targetId: string) => {
    try {
      const { data } = await api.post<{ conversationId: string }>('/conversations', {
        recipientId: targetId,
      });
      router.push(`/messages/${data.conversationId}` as Href);
    } catch (value) {
      setError(getApiError(value, 'Мессеж эхлүүлж чадсангүй.'));
    }
  };

  const submitCollaborationRequest = async () => {
    if (!composerUser || !composerMessage.trim()) return;
    setComposerSending(true);
    setComposerError('');
    try {
      await api.post(`/collaborations/${composerUser.id}`, { message: composerMessage.trim() });
      setComposerUser(null);
      setComposerMessage('');
      void loadRequests();
    } catch (value) {
      setComposerError(getApiError(value, 'Хүсэлт илгээж чадсангүй.'));
    } finally {
      setComposerSending(false);
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    setReceived((current) =>
      current.map((item) =>
        item.id === requestId ? { ...item, status: accept ? 'ACCEPTED' : 'DECLINED' } : item,
      ),
    );
    try {
      await api.patch(`/collaborations/${requestId}/respond`, { accept });
    } catch (value) {
      setError(getApiError(value, 'Хариу илгээж чадсангүй.'));
      void loadRequests();
    }
  };

  const visibleUsers = useMemo(() => {
    return users.filter((item) => {
      if (category === 'Ментор') return item.isMentor;
      if (category === 'Бизнес & Стартап') return item.accountType === 'BUSINESS';
      return item.isMentor || item.accountType === 'BUSINESS';
    });
  }, [users, category]);

  const pendingReceivedCount = useMemo(
    () => received.filter((item) => item.status === 'PENDING').length,
    [received],
  );

  return (
    <SafeAreaView
      className="min-h-0 flex-1 overflow-hidden bg-background-app"
      style={Platform.OS === 'web' ? webScreenStyle : undefined}
    >
      <View className="min-h-0 w-full max-w-[900px] flex-1 self-center">
        <AppPageHeader
          maxWidth={900}
          actions={
            <>
              <GlobalSearchButton />
              <NotificationBell />
            </>
          }
        />

        <View className="mx-l mb-m mt-m shrink-0 overflow-hidden rounded-[24px] border border-[#1E4938] bg-[#08271D] px-l py-m">
          <View className="flex-row items-center justify-between gap-m">
            <View className="min-w-0 flex-1">
              <Text className="text-[10px] font-black tracking-[2px] text-brand-primary">
                GROWX MENTOR NETWORK
              </Text>
              <Text className="mt-1 text-[25px] font-black leading-8 tracking-[-0.8px] text-text-primary">
                Зөв хүнтэйгээ холбогд.
              </Text>
              <Text className="mt-1 max-w-[520px] text-xs leading-5 text-[#8FA099]">
                Туршлагатай ментор, бизнес эрхлэгчидтэй холбогдож дараагийн алхмаа хурдан хий.
              </Text>
            </View>
            <View className="h-14 w-14 shrink-0 items-center justify-center rounded-avatar border border-[#3C5B4E] bg-[#102F24]">
              <Icon name="people" size={26} color={lime} />
            </View>
          </View>
          <View className="mt-m flex-row gap-s border-t border-[#204436] pt-m">
            <View className="flex-1">
              <Text className="text-lg font-black text-text-primary">{visibleUsers.length}</Text>
              <Text className="text-[10px] font-bold text-text-muted">Нээлттэй профайл</Text>
            </View>
            <View className="w-px bg-[#28493C]" />
            <View className="flex-1 pl-m">
              <Text className="text-lg font-black text-brand-primary">{pendingReceivedCount}</Text>
              <Text className="text-[10px] font-bold text-text-muted">Шинэ хүсэлт</Text>
            </View>
          </View>
        </View>

        <View className="shrink-0 px-l pb-s">
          <SegmentedControl
            options={[
              'Ментор хайх',
              pendingReceivedCount > 0 ? `Хүсэлтүүд (${pendingReceivedCount})` : 'Хүсэлтүүд',
            ]}
            selectedIndex={section}
            onChange={setSection}
          />
        </View>

        {section === 0 ? (
          <View className="min-h-0 flex-1">
            <View className="shrink-0 px-l pb-s">
              <SearchBar value={query} onChangeText={setQuery} placeholder="Ментор, бизнес хайх" />
            </View>
            <ScrollView
              horizontal
              className="max-h-12 shrink-0"
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'flex-start',
                gap: 8,
                paddingHorizontal: 22,
                paddingBottom: 8,
              }}
              showsHorizontalScrollIndicator={false}
            >
              {categories.map((item) => (
                <Tag
                  key={item}
                  label={item}
                  selected={category === item}
                  onPress={() => setCategory(item)}
                />
              ))}
            </ScrollView>

            {loading ? (
              <View className="min-h-0 flex-1 items-center justify-center">
                <ActivityIndicator color={lime} size="large" />
              </View>
            ) : (
              <ScrollView
                className="min-h-0 flex-1 px-l"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {!!error && <Text className="pb-s text-danger">{error}</Text>}
                {visibleUsers.map((item) => (
                  <MentorRow
                    key={item.id}
                    user={item}
                    isFollowing={followingIds.has(item.id)}
                    onToggleFollow={() => void toggleFollow(item.id)}
                    onMessage={() => void startConversation(item.id)}
                    onRequestCollaboration={() => {
                      setComposerUser(item);
                      setComposerMessage('');
                      setComposerError('');
                    }}
                    isSelf={item.id === user?.id}
                  />
                ))}
                {!visibleUsers.length && (
                  <EmptyState
                    icon="search"
                    title="Ментор олдсонгүй"
                    copy="Хайлтын үг эсвэл сонгосон ангиллаа өөрчлөөд дахин оролдоорой."
                  />
                )}
              </ScrollView>
            )}
          </View>
        ) : (
          <View className="min-h-0 flex-1">
            <View className="px-l pb-s">
              <SegmentedControl
                options={['Ирсэн', 'Илгээсэн']}
                selectedIndex={requestSection}
                onChange={setRequestSection}
              />
            </View>
            {requestsLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={lime} size="large" />
              </View>
            ) : (
              <ScrollView
                className="min-h-0 flex-1 px-l"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {requestSection === 0
                  ? received.map((request) => (
                      <RequestRow
                        key={request.id}
                        request={request}
                        showActions
                        onRespond={(accept) => void respondToRequest(request.id, accept)}
                      />
                    ))
                  : sent.map((request) => (
                      <RequestRow key={request.id} request={request} showActions={false} />
                    ))}
                {requestSection === 0 && !received.length && (
                  <EmptyState
                    icon="mail"
                    title="Ирсэн хүсэлт алга"
                    copy="Танд ирсэн хамтын ажиллагааны хүсэлтүүд энд харагдана."
                  />
                )}
                {requestSection === 1 && !sent.length && (
                  <EmptyState
                    icon="mail"
                    title="Илгээсэн хүсэлт алга"
                    copy="Менторын профайлаас хамтрах хүсэлт илгээж эхлээрэй."
                  />
                )}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      <Modal visible={!!composerUser} onClose={() => setComposerUser(null)}>
        <Text className="text-lg font-extrabold text-text-primary">
          {composerUser ? displayName(composerUser) : ''}-д хамтран ажиллах хүсэлт
        </Text>
        <View className="mt-m">
          <TextInput
            value={composerMessage}
            onChangeText={setComposerMessage}
            placeholder="Хамтын ажиллагааны талаар товч бичнэ үү..."
            multiline
            numberOfLines={4}
          />
        </View>
        {!!composerError && <Text className="mt-s text-danger">{composerError}</Text>}
        <View className="mt-m flex-row gap-s">
          <Button title="Цуцлах" variant="secondary" onPress={() => setComposerUser(null)} />
          <Button
            title="Илгээх"
            onPress={() => void submitCollaborationRequest()}
            loading={composerSending}
            disabled={!composerMessage.trim()}
          />
        </View>
      </Modal>

      <AppBottomNav />
    </SafeAreaView>
  );
}
