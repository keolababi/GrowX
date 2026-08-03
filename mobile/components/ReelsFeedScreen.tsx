import { useCallback, useEffect, useState } from 'react';
import { router, type Href } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NavigationBackButton } from '@/components/NavigationBackButton';
import { NotificationBell } from '@/components/NotificationBell';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import type { Reel, ReelComment } from '@/types/reel';

const lime = '#9AF000';

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase();
}

function ReelCard({
  reel,
  onToggleLike,
  onAddComment,
}: {
  reel: Reel;
  onToggleLike: () => void;
  onAddComment: (content: string) => Promise<void>;
}) {
  const player = useVideoPlayer(reel.videoUrl, (instance) => {
    instance.loop = true;
  });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const share = async () => {
    try {
      await Share.share({ message: reel.caption || 'GrowX reel' });
    } catch {
      // User dismissed the native share sheet.
    }
  };

  const submitComment = async () => {
    const content = commentDraft.trim();
    if (!content || sendingComment) return;
    setSendingComment(true);
    try {
      await onAddComment(content);
      setCommentDraft('');
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <View className="overflow-hidden rounded-card border border-border bg-background-paper pb-m">
      <View className="w-full bg-black" style={{ aspectRatio: 9 / 14 }}>
        <VideoView player={player} style={{ flex: 1 }} nativeControls contentFit="cover" />
      </View>

      <Pressable
        onPress={() => router.push(`/users/${reel.author.id}` as Href)}
        className="mx-m mt-s flex-row items-center gap-s"
      >
        {reel.author.avatarUrl ? (
          <Image source={{ uri: reel.author.avatarUrl }} className="h-8 w-8 rounded-avatar" />
        ) : (
          <View className="h-8 w-8 items-center justify-center rounded-avatar border border-border bg-background-app">
            <Text className="text-xs font-extrabold text-brand-primary">
              {initials(reel.author.displayName, reel.author.email)}
            </Text>
          </View>
        )}
        <Text className="text-sm font-extrabold text-text-primary">
          {reel.author.displayName || reel.author.email.split('@')[0]}
        </Text>
      </Pressable>

      {!!reel.caption && (
        <Text className="mx-m mt-1 text-sm leading-5 text-text-secondary">{reel.caption}</Text>
      )}

      <View className="mx-m mt-s flex-row items-center gap-l">
        <Pressable onPress={onToggleLike} className="flex-row items-center gap-1">
          <Icon
            name={reel.likedByMe ? 'heart' : 'heart-outline'}
            size={22}
            color={reel.likedByMe ? '#EF4444' : '#D6DBDC'}
          />
          {reel.likeCount > 0 && (
            <Text
              className={`text-xs font-bold ${reel.likedByMe ? 'text-danger' : 'text-text-muted'}`}
            >
              {reel.likeCount}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => setCommentsOpen((open) => !open)}
          className="flex-row items-center gap-1"
        >
          <Icon name="chatbubble-outline" size={21} color="#D6DBDC" />
          {reel.commentCount > 0 && (
            <Text className="text-xs font-bold text-text-muted">{reel.commentCount}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => void share()}>
          <Icon name="arrow-redo-outline" size={22} color="#D6DBDC" />
        </Pressable>
      </View>

      {commentsOpen && (
        <View className="mx-m mt-s">
          {reel.comments.map((comment: ReelComment) => (
            <View key={comment.id} className="mt-s flex-row items-start gap-s">
              <View className="h-6 w-6 items-center justify-center rounded-avatar border border-border bg-background-app">
                <Text className="text-[10px] font-extrabold text-brand-primary">
                  {initials(comment.author.displayName, comment.author.email)}
                </Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-extrabold text-text-primary">
                  {comment.author.displayName || comment.author.email.split('@')[0]}
                </Text>
                <Text className="text-xs leading-4 text-text-secondary">{comment.content}</Text>
              </View>
            </View>
          ))}
          <View className="mt-s flex-row items-center rounded-card bg-background-app px-m">
            <TextInput
              value={commentDraft}
              onChangeText={setCommentDraft}
              onSubmitEditing={() => void submitComment()}
              placeholder="Сэтгэгдэл бичих..."
              placeholderTextColor="#A7AEB0"
              returnKeyType="send"
              className="h-11 flex-1 text-sm text-text-primary"
            />
            <Pressable onPress={() => void submitComment()} hitSlop={8}>
              <Text className="text-sm font-bold text-brand-primary">Илгээх</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export function ReelsFeedScreen({ mine = false }: { mine?: boolean }) {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      setError('');
      try {
        const { data } = await api.get<{ reels: Reel[] }>(
          mine ? '/media/reels/mine' : '/media/reels',
        );
        setReels(data.reels);
      } catch (value) {
        setError(getApiError(value, 'Reel-үүдийг ачаалж чадсангүй.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mine],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLike = async (reel: Reel) => {
    setReels((current) =>
      current.map((item) =>
        item.id === reel.id
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likeCount: Math.max(0, item.likeCount + (item.likedByMe ? -1 : 1)),
            }
          : item,
      ),
    );
    try {
      const { data } = await api.post<{ liked: boolean; likeCount: number }>(
        `/media/reels/${reel.id}/like`,
      );
      setReels((current) =>
        current.map((item) =>
          item.id === reel.id
            ? { ...item, likedByMe: data.liked, likeCount: data.likeCount }
            : item,
        ),
      );
    } catch {
      setReels((current) => current.map((item) => (item.id === reel.id ? reel : item)));
    }
  };

  const addComment = async (reel: Reel, content: string) => {
    const { data } = await api.post<{ comment: ReelComment }>(`/media/reels/${reel.id}/comments`, {
      content,
    });
    setReels((current) =>
      current.map((item) =>
        item.id === reel.id
          ? {
              ...item,
              comments: [...item.comments, data.comment],
              commentCount: item.commentCount + 1,
            }
          : item,
      ),
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <View className="h-[76px] flex-row items-center justify-between border-b border-border px-l">
        <NavigationBackButton />
        <Text className="text-xl font-extrabold text-text-primary">
          {mine ? 'Миний Reel' : 'Reels'}
        </Text>
        <View className="flex-row items-center gap-s">
          <NotificationBell />
          <Pressable
            onPress={() => router.push({ pathname: '/posts/create', params: { type: 'reel' } })}
            className="h-11 w-11 items-center justify-center rounded-avatar bg-brand-primary"
          >
            <Icon name="add" size={24} color="#020B0D" />
          </Pressable>
        </View>
      </View>

      {!mine && (
        <Pressable
          onPress={() => router.push('/reels/mine')}
          className="mx-l mt-s flex-row items-center justify-between rounded-card border border-border bg-background-paper px-m py-s"
        >
          <Text className="text-sm font-extrabold text-brand-primary">Миний оруулсан Reel</Text>
          <Icon name="chevron-forward" size={20} color="#9AF000" />
        </Pressable>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={lime} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            width: '100%',
            maxWidth: 620,
            alignSelf: 'center',
            padding: 18,
            gap: 20,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={lime}
            />
          }
        >
          {!!error && <Text className="pb-s text-danger">{error}</Text>}
          {reels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              onToggleLike={() => void toggleLike(reel)}
              onAddComment={(content) => addComment(reel, content)}
            />
          ))}
          {!reels.length && (
            <View className="items-center gap-l pt-16">
              <Text className="text-center text-text-muted">
                {mine ? 'Та одоогоор reel оруулаагүй байна.' : 'Одоогоор reel алга.'}
              </Text>
              {mine && (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/posts/create', params: { type: 'reel' } })
                  }
                  className="rounded-btn bg-brand-primary px-l py-s"
                >
                  <Text className="font-extrabold text-background-app">Reel оруулах</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
