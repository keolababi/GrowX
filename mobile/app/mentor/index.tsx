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
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { api } from '@/services/api';
import { useUser } from '@/providers/UserProvider';
import { getApiError } from '@/utils/auth';
import type { DiscoverUser } from '@/types/discover';
import type { CollaborationRequest } from '@/types/collaboration';

const lime = '#9AF000';
const categories = ['Бүгд', 'Ментор', 'Бизнес & Стартап'] as const;
type Category = (typeof categories)[number];

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
}: {
  user: DiscoverUser;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
  onRequestCollaboration: () => void;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/users/${user.id}` as Href)}
      className="mb-s rounded-card border border-border bg-background-paper p-m"
    >
      <View className="flex-row items-center">
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} className="h-12 w-12 rounded-avatar" />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-avatar border border-border bg-background-app">
            <Text className="font-extrabold text-brand-primary">
              {initials(user.displayName, user.email)}
            </Text>
          </View>
        )}
        <View className="ml-s min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-extrabold text-text-primary">
            {displayName(user)}
          </Text>
          <Text numberOfLines={1} className="mt-1 text-xs text-text-muted">
            {user.accountType === 'BUSINESS'
              ? user.industry || 'Бизнес'
              : user.bio || 'GrowX гишүүн'}
          </Text>
        </View>
        <Badge
          label={user.accountType === 'BUSINESS' ? 'Бизнес' : 'Ментор'}
          variant={user.accountType === 'BUSINESS' ? 'brand' : 'muted'}
        />
      </View>

      <View className="mt-s flex-row gap-s">
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggleFollow();
          }}
          className={`h-9 flex-1 items-center justify-center rounded-avatar border ${
            isFollowing ? 'border-border' : 'border-brand-primary bg-brand-primary'
          }`}
        >
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
          className="h-9 flex-1 items-center justify-center rounded-avatar border border-border"
        >
          <Text className="text-xs font-bold text-text-secondary">Мессеж</Text>
        </Pressable>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onRequestCollaboration();
          }}
          className="h-9 flex-1 items-center justify-center rounded-avatar border border-border"
        >
          <Text className="text-xs font-bold text-text-secondary">Хамтрах</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function statusLabel(status: CollaborationRequest['status']) {
  if (status === 'ACCEPTED') return 'Зөвшөөрсөн';
  if (status === 'DECLINED') return 'Татгалзсан';
  return 'Хүлээгдэж буй';
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
      className="mb-s rounded-card border border-border bg-background-paper p-m"
    >
      <View className="flex-row items-center">
        {request.user.avatarUrl ? (
          <Image source={{ uri: request.user.avatarUrl }} className="h-10 w-10 rounded-avatar" />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-avatar border border-border bg-background-app">
            <Text className="font-extrabold text-brand-primary">
              {initials(request.user.displayName, request.user.email)}
            </Text>
          </View>
        )}
        <View className="ml-s min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-extrabold text-text-primary">
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
        <View className="mt-s flex-row gap-s">
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onRespond?.(true);
            }}
            className="h-9 flex-1 items-center justify-center rounded-avatar border border-brand-primary bg-brand-primary"
          >
            <Text className="text-xs font-bold text-background-app">Зөвшөөрөх</Text>
          </Pressable>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onRespond?.(false);
            }}
            className="h-9 flex-1 items-center justify-center rounded-avatar border border-border"
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
          api.get<{ users: DiscoverUser[] }>('/conversations/users', { params: { q: search } }),
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
      if (category === 'Ментор') return item.accountType === 'PERSONAL';
      if (category === 'Бизнес & Стартап') return item.accountType === 'BUSINESS';
      return true;
    });
  }, [users, category]);

  const pendingReceivedCount = useMemo(
    () => received.filter((item) => item.status === 'PENDING').length,
    [received],
  );

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <View className="h-16 flex-row items-center justify-between px-l">
        <Text className="text-xl font-extrabold text-text-primary">Менторууд</Text>
        <NotificationBell />
      </View>

      <View className="px-l pb-s">
        <SegmentedControl
          options={[
            'Нээх',
            pendingReceivedCount > 0 ? `Хүсэлтүүд (${pendingReceivedCount})` : 'Хүсэлтүүд',
          ]}
          selectedIndex={section}
          onChange={setSection}
        />
      </View>

      {section === 0 ? (
        <>
          <View className="px-l pb-s">
            <SearchBar value={query} onChangeText={setQuery} placeholder="Ментор, бизнес хайх" />
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
              className="flex-1 px-l"
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
                />
              ))}
              {!visibleUsers.length && (
                <Text className="pt-20 text-center text-text-muted">Ментор олдсонгүй.</Text>
              )}
            </ScrollView>
          )}
        </>
      ) : (
        <View className="flex-1">
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
              className="flex-1 px-l"
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
                <Text className="pt-20 text-center text-text-muted">Ирсэн хүсэлт алга.</Text>
              )}
              {requestSection === 1 && !sent.length && (
                <Text className="pt-20 text-center text-text-muted">Илгээсэн хүсэлт алга.</Text>
              )}
            </ScrollView>
          )}
        </View>
      )}

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
