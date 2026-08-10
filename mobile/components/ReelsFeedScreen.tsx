import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import Slider from '@react-native-community/slider';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { NavigationBackButton } from '@/components/NavigationBackButton';
import { NotificationBell } from '@/components/NotificationBell';
import { Icon } from '@/components/ui/Icon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Loader } from '@/components/ui/Loader';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';
import type { Reel, ReelComment } from '@/types/reel';
import { useEngagementStore } from '@/store/engagementStore';
import { useColorMode } from '@/providers/ColorModeProvider';
import { useUser } from '@/providers/UserProvider';

const controlAccent = '#FFFFFF';

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase();
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}

function PlayerControls({
  playing,
  muted,
  currentTime,
  duration,
  onTogglePlay,
  onToggleMute,
  onSeek,
}: {
  playing: boolean;
  muted: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeek: (seconds: number) => void;
}) {
  return (
    <View className="absolute bottom-0 left-0 right-0 min-h-[56px] bg-black/80 px-s pb-2 pt-1">
      <Slider
        value={currentTime}
        minimumValue={0}
        maximumValue={Math.max(duration, 1)}
        onSlidingComplete={onSeek}
        minimumTrackTintColor={controlAccent}
        maximumTrackTintColor="rgba(255,255,255,0.4)"
        thumbTintColor={controlAccent}
        style={{ width: '100%', height: 20 }}
      />
      <View className="flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-s">
          <Pressable onPress={onTogglePlay} hitSlop={8} className="outline-none">
            <Icon name={playing ? 'pause' : 'play'} size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="text-[11px] font-semibold text-white">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
        <Pressable onPress={onToggleMute} hitSlop={8} className="outline-none">
          <Icon name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function NativeReelVideo({ videoUrl }: { videoUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = false;
  });
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(player.currentTime || 0);
      setDuration(player.duration || 0);
      setPlaying(player.playing);
      if (player.duration > 0 && player.currentTime >= player.duration - 0.1) setEnded(true);
    }, 250);
    return () => clearInterval(timer);
  }, [player]);
  const toggle = () => {
    if (ended) {
      player.currentTime = 0;
      setCurrentTime(0);
      setEnded(false);
      player.play();
    } else if (playing) player.pause();
    else player.play();
  };
  const toggleMute = () => {
    player.muted = !player.muted;
    setMuted(player.muted);
  };
  return (
    <View className="relative flex-1">
      <VideoView player={player} style={{ flex: 1 }} nativeControls={false} contentFit="contain" />
      <CenterPlayButton
        playing={playing}
        ended={ended}
        onPress={toggle}
        onBack={() => {
          player.currentTime = Math.max(0, player.currentTime - 10);
          setEnded(false);
        }}
        onForward={() => {
          player.currentTime = Math.min(
            player.duration || player.currentTime + 10,
            player.currentTime + 10,
          );
        }}
      />
      <PlayerControls
        playing={playing}
        muted={muted}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={toggle}
        onToggleMute={toggleMute}
        onSeek={(seconds) => {
          player.currentTime = seconds;
          setCurrentTime(seconds);
          if (seconds < player.duration) setEnded(false);
        }}
      />
    </View>
  );
}

function ReelVideo({ videoUrl }: { videoUrl: string }) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  if (Platform.OS === 'web') {
    if (failed) {
      return (
        <View className="flex-1 items-center justify-center gap-s bg-background-paper px-l">
          <Text className="text-center text-sm font-bold text-text-primary">
            Энэ MOV видеоны codec Chrome дээр дэмжигдэхгүй байна.
          </Text>
          <Text className="text-center text-xs leading-4 text-text-muted">
            Reel-ээ MP4 (H.264) эсвэл WebM форматаар оруулна уу.
          </Text>
          <Pressable
            onPress={() => void Linking.openURL(videoUrl)}
            className="rounded-btn bg-brand-primary px-m py-s"
          >
            <Text className="text-xs font-extrabold text-background-app">Видеог тусад нь нээх</Text>
          </Pressable>
        </View>
      );
    }
    const toggle = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.ended || ended) {
        video.currentTime = 0;
        setCurrentTime(0);
        setEnded(false);
        void video.play();
      } else if (video.paused) void video.play();
      else video.pause();
    };
    return (
      <View className="relative flex-1">
        {React.createElement('video', {
          ref: videoRef,
          src: videoUrl,
          controls: false,
          loop: false,
          playsInline: true,
          preload: 'metadata',
          onClick: toggle,
          onPlay: () => setPlaying(true),
          onPause: () => setPlaying(false),
          onEnded: () => {
            setPlaying(false);
            setEnded(true);
          },
          onTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) => {
            setCurrentTime(event.currentTarget.currentTime);
          },
          onLoadedMetadata: (event: React.SyntheticEvent<HTMLVideoElement>) => {
            setDuration(event.currentTarget.duration);
          },
          onError: () => setFailed(true),
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000',
            outline: 'none',
            cursor: 'pointer',
          },
        })}
        <CenterPlayButton
          playing={playing}
          ended={ended}
          onPress={toggle}
          onBack={() => {
            const video = videoRef.current;
            if (video) {
              video.currentTime = Math.max(0, video.currentTime - 10);
              setEnded(false);
            }
          }}
          onForward={() => {
            const video = videoRef.current;
            if (video)
              video.currentTime = Math.min(
                video.duration || video.currentTime + 10,
                video.currentTime + 10,
              );
          }}
        />
        <PlayerControls
          playing={playing}
          muted={muted}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={toggle}
          onToggleMute={() => {
            const video = videoRef.current;
            if (!video) return;
            video.muted = !video.muted;
            setMuted(video.muted);
          }}
          onSeek={(seconds) => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = seconds;
            setCurrentTime(seconds);
            if (seconds < video.duration) setEnded(false);
          }}
        />
      </View>
    );
  }
  return <NativeReelVideo videoUrl={videoUrl} />;
}

function CenterPlayButton({
  playing,
  ended,
  onPress,
  onBack,
  onForward,
}: {
  playing: boolean;
  ended: boolean;
  onPress: () => void;
  onBack: () => void;
  onForward: () => void;
}) {
  return (
    <View
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-row items-center gap-m ${playing && !ended ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
    >
      <SeekTenButton direction="back" onPress={onBack} />
      <Pressable
        accessibilityLabel={ended ? 'Дахин тоглуулах' : playing ? 'Түр зогсоох' : 'Тоглуулах'}
        onPress={onPress}
        className="h-14 w-14 items-center justify-center rounded-avatar bg-black/65 outline-none"
      >
        <Icon name={ended ? 'refresh' : playing ? 'pause' : 'play'} size={27} color="#FFFFFF" />
      </Pressable>
      <SeekTenButton direction="forward" onPress={onForward} />
    </View>
  );
}

function SeekTenButton({
  direction,
  onPress,
}: {
  direction: 'back' | 'forward';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={direction === 'back' ? '10 секунд ухраах' : '10 секунд урагшлуулах'}
      onPress={onPress}
      className="h-14 w-14 items-center justify-center rounded-avatar bg-black/65 outline-none"
    >
      <Icon
        name={direction === 'back' ? 'play-back-circle-outline' : 'play-forward-circle-outline'}
        size={40}
        color="#FFFFFF"
      />
    </Pressable>
  );
}

function ReelCard({
  reel,
  onToggleLike,
  onAddComment,
  onEditComment,
  onDeleteComment,
  saved,
  onToggleSave,
  videoHeight,
}: {
  reel: Reel;
  onToggleLike: () => void;
  onAddComment: (content: string) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  saved: boolean;
  onToggleSave: () => void;
  videoHeight: number;
}) {
  const { user } = useUser();
  const { colors } = useColorMode();
  const { height: windowHeight } = useWindowDimensions();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
  const [commentEditDraft, setCommentEditDraft] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [commentEditError, setCommentEditError] = useState('');

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

  const startEditingComment = (comment: ReelComment) => {
    setActiveCommentMenuId(null);
    setEditingCommentId(comment.id);
    setCommentEditDraft(comment.content);
    setCommentEditError('');
  };

  const cancelEditingComment = () => {
    if (savingCommentEdit) return;
    setEditingCommentId(null);
    setCommentEditDraft('');
    setCommentEditError('');
  };

  const saveCommentEdit = async () => {
    const content = commentEditDraft.trim();
    if (!editingCommentId || !content || savingCommentEdit) return;
    setSavingCommentEdit(true);
    setCommentEditError('');
    try {
      await onEditComment(editingCommentId, content);
      setEditingCommentId(null);
      setCommentEditDraft('');
    } catch (value) {
      setCommentEditError(getApiError(value, 'Сэтгэгдлийг засаж чадсангүй.'));
    } finally {
      setSavingCommentEdit(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setActiveCommentMenuId(null);
    const remove = async () => {
      setCommentEditError('');
      try {
        await onDeleteComment(commentId);
      } catch (value) {
        setCommentEditError(getApiError(value, 'Сэтгэгдлийг устгаж чадсангүй.'));
      }
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm('Сэтгэгдлээ устгах уу?')) await remove();
      return;
    }
    Alert.alert('Сэтгэгдэл устгах', 'Сэтгэгдлээ устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  const closeComments = () => {
    setCommentsOpen(false);
    setActiveCommentMenuId(null);
    setEditingCommentId(null);
    setCommentEditDraft('');
    setCommentEditError('');
  };

  return (
    <View className="overflow-hidden rounded-card border border-border bg-background-paper">
      <View className="relative w-full overflow-hidden bg-black" style={{ height: videoHeight }}>
        <ReelVideo videoUrl={reel.videoUrl} />
        <View className="absolute bottom-16 left-0 right-0 bg-gradient-to-t from-black/80 px-m pb-s pr-20 pt-l">
          <Pressable
            onPress={() => router.push(`/users/${reel.author.id}` as Href)}
            className="flex-row items-center gap-s"
          >
            {reel.author.avatarUrl ? (
              <Image source={{ uri: reel.author.avatarUrl }} className="h-8 w-8 rounded-avatar" />
            ) : (
              <View className="h-8 w-8 items-center justify-center rounded-avatar border border-white/30 bg-black/60">
                <Text className="text-xs font-extrabold text-brand-primary">
                  {initials(reel.author.displayName, reel.author.email)}
                </Text>
              </View>
            )}
            <Text className="text-sm font-extrabold text-white">
              {reel.author.displayName || reel.author.email.split('@')[0]}
            </Text>
          </Pressable>

          {!!reel.caption && (
            <Text numberOfLines={2} className="mt-1 text-sm leading-5 text-white/90">
              {reel.caption}
            </Text>
          )}
        </View>

        <View className="absolute bottom-32 right-m items-center gap-s">
          <Pressable onPress={onToggleLike} className="items-center gap-1 outline-none">
            <View className="h-9 w-9 items-center justify-center rounded-avatar bg-black/70">
              <Icon
                name={reel.likedByMe ? 'heart' : 'heart-outline'}
                size={22}
                color={reel.likedByMe ? '#EF4444' : '#FFFFFF'}
              />
            </View>
            <Text className="text-[11px] font-extrabold text-white">{reel.likeCount}</Text>
          </Pressable>
          <Pressable
            onPress={() => setCommentsOpen((open) => !open)}
            className="items-center gap-1 outline-none"
          >
            <View className="h-9 w-9 items-center justify-center rounded-avatar bg-black/70">
              <Icon name="chatbubble-outline" size={21} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-extrabold text-white">{reel.commentCount}</Text>
          </Pressable>
          <Pressable onPress={() => void share()} className="items-center gap-1 outline-none">
            <View className="h-9 w-9 items-center justify-center rounded-avatar bg-black/70">
              <Icon name="share-social-outline" size={21} color="#FFFFFF" />
            </View>
            <Text className="text-[10px] font-bold text-white">Хуваалцах</Text>
          </Pressable>
          <Pressable onPress={onToggleSave} className="items-center gap-1 outline-none">
            <View className="h-9 w-9 items-center justify-center rounded-avatar bg-black/70">
              <Icon
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={21}
                color={controlAccent}
              />
            </View>
            <Text className="text-[10px] font-bold text-white">Хадгалах</Text>
          </Pressable>
        </View>
      </View>

      <BottomSheet visible={commentsOpen} onClose={closeComments}>
        <View
          className="w-full max-w-[620px] self-center"
          style={{ height: Math.min(Math.max(windowHeight - 100, 480), 760) }}
        >
          <View className="mb-s h-1 w-10 self-center rounded-full bg-white/30" />
          <View className="mb-s flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-text-primary">
              Сэтгэгдэл ({reel.commentCount})
            </Text>
            <Pressable onPress={closeComments} className="p-s outline-none">
              <Icon name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView className="min-h-0 flex-1" showsVerticalScrollIndicator={false}>
            {reel.comments.map((comment: ReelComment) => (
              <View
                key={comment.id}
                className="relative mb-m flex-row items-start gap-s"
                style={{ zIndex: activeCommentMenuId === comment.id ? 30 : 0 }}
              >
                <View className="h-8 w-8 items-center justify-center rounded-avatar border border-border bg-background-app">
                  <Text className="text-[10px] font-extrabold text-brand-primary">
                    {initials(comment.author.displayName, comment.author.email)}
                  </Text>
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center justify-between gap-s">
                    <Text className="min-w-0 flex-1 text-xs font-extrabold text-text-primary">
                      {comment.author.displayName || comment.author.email.split('@')[0]}
                    </Text>
                    {comment.author.id === user?.id && editingCommentId !== comment.id && (
                      <Pressable
                        accessibilityLabel="Сэтгэгдлийн үйлдлүүд"
                        onPress={() =>
                          setActiveCommentMenuId((current) =>
                            current === comment.id ? null : comment.id,
                          )
                        }
                        hitSlop={8}
                        className="h-7 w-8 items-center justify-center outline-none"
                      >
                        <Icon name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
                      </Pressable>
                    )}
                  </View>
                  {activeCommentMenuId === comment.id && (
                    <View
                      className="absolute right-0 top-8 z-30 min-w-[132px] overflow-hidden rounded-btn border border-border bg-background-paper shadow-lg"
                      style={{ elevation: 10 }}
                    >
                      <Pressable
                        onPress={() => startEditingComment(comment)}
                        className="min-h-[42px] flex-row items-center gap-s border-b border-border px-s outline-none"
                      >
                        <Icon name="create-outline" size={17} color={colors.text} />
                        <Text className="text-xs font-extrabold text-text-primary">Засах</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void deleteComment(comment.id)}
                        className="min-h-[42px] flex-row items-center gap-s px-s outline-none"
                      >
                        <Icon name="trash-outline" size={17} color={colors.danger} />
                        <Text className="text-xs font-extrabold text-danger">Устгах</Text>
                      </Pressable>
                    </View>
                  )}
                  {editingCommentId === comment.id ? (
                    <View className="mt-xs">
                      <TextInput
                        autoFocus
                        multiline
                        maxLength={1000}
                        value={commentEditDraft}
                        onChangeText={setCommentEditDraft}
                        cursorColor={colors.primary}
                        selectionColor={colors.primary}
                        style={{
                          color: colors.text,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        }}
                        className="min-h-[72px] rounded-btn border border-border bg-background-app p-s text-sm leading-5 text-text-primary outline-none"
                      />
                      <View className="mt-s flex-row items-center justify-end gap-l">
                        <Pressable
                          disabled={savingCommentEdit}
                          onPress={cancelEditingComment}
                          hitSlop={8}
                          className="outline-none"
                        >
                          <Text className="text-xs font-bold text-text-muted">Цуцлах</Text>
                        </Pressable>
                        <Pressable
                          disabled={!commentEditDraft.trim() || savingCommentEdit}
                          onPress={() => void saveCommentEdit()}
                          hitSlop={8}
                          className="outline-none disabled:opacity-50"
                        >
                          <Text className="text-xs font-extrabold text-brand-primary">
                            {savingCommentEdit ? 'Хадгалж байна...' : 'Хадгалах'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Text className="mt-1 text-sm leading-5 text-text-secondary">
                      {comment.content}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            {!!commentEditError && (
              <Text className="pb-s text-center text-xs text-danger">{commentEditError}</Text>
            )}
            {!reel.comments.length && (
              <Text className="pt-xl text-center text-sm text-text-muted">
                Одоогоор сэтгэгдэл алга.
              </Text>
            )}
          </ScrollView>
          <View
            className="mt-s flex-row items-center rounded-card bg-background-app px-m"
            style={{ backgroundColor: colors.background }}
          >
            <TextInput
              value={commentDraft}
              onChangeText={setCommentDraft}
              onSubmitEditing={() => void submitComment()}
              placeholder="Сэтгэгдэл бичих..."
              placeholderTextColor={colors.muted}
              cursorColor={colors.primary}
              selectionColor={colors.primary}
              style={{ color: colors.text }}
              returnKeyType="send"
              className="h-12 flex-1 text-sm text-text-primary outline-none"
            />
            <Pressable onPress={() => void submitComment()} hitSlop={8} className="outline-none">
              <Text className="text-sm font-bold text-brand-primary">
                {sendingComment ? '...' : 'Илгээх'}
              </Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

export function ReelsFeedScreen({ mine = false }: { mine?: boolean }) {
  const { height } = useWindowDimensions();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const savedReelIds = useEngagementStore((state) => state.savedReelIds);
  const toggleSaveReel = useEngagementStore((state) => state.toggleSaveReel);
  const feedViewportHeight = Math.max(320, height - 156);
  const reelVideoHeight = Math.max(420, feedViewportHeight - 8);
  const reelItemHeight = feedViewportHeight;

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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

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

  const editComment = async (reel: Reel, commentId: string, content: string) => {
    const { data } = await api.patch<{ comment: ReelComment }>(
      `/media/reels/${reel.id}/comments/${commentId}`,
      { content },
    );
    setReels((current) =>
      current.map((item) =>
        item.id === reel.id
          ? {
              ...item,
              comments: item.comments.map((comment) =>
                comment.id === commentId ? data.comment : comment,
              ),
            }
          : item,
      ),
    );
  };

  const deleteComment = async (reel: Reel, commentId: string) => {
    await api.delete(`/media/reels/${reel.id}/comments/${commentId}`);
    setReels((current) =>
      current.map((item) =>
        item.id === reel.id
          ? {
              ...item,
              comments: item.comments.filter((comment) => comment.id !== commentId),
              commentCount: Math.max(0, item.commentCount - 1),
            }
          : item,
      ),
    );
  };

  return (
    <SafeAreaView className="min-h-0 flex-1 overflow-hidden bg-background-app">
      <View className="h-[76px] flex-row items-center justify-between border-b border-border px-l">
        <View className="w-[42px]">
          <NavigationBackButton />
        </View>
        <Text className="flex-1 text-center text-xl font-extrabold text-text-primary">
          {mine ? 'Миний Reel' : 'Reels'}
        </Text>
        <View className="w-[42px]">
          <NotificationBell />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loader size={32} />
        </View>
      ) : (
        <FlatList
          style={
            Platform.OS === 'web'
              ? ({
                  height: feedViewportHeight,
                  flexGrow: 0,
                  flexShrink: 0,
                  overflowY: 'auto',
                  overscrollBehaviorY: 'contain',
                } as never)
              : { flex: 1, minHeight: 0 }
          }
          data={reels}
          keyExtractor={(reel) => reel.id}
          renderItem={({ item: reel }) => (
            <View
              className="w-full justify-start px-[18px] pt-1"
              style={{ height: reelItemHeight }}
            >
              <ReelCard
                reel={reel}
                onToggleLike={() => void toggleLike(reel)}
                onAddComment={(content) => addComment(reel, content)}
                onEditComment={(commentId, content) => editComment(reel, commentId, content)}
                onDeleteComment={(commentId) => deleteComment(reel, commentId)}
                saved={savedReelIds.has(reel.id)}
                onToggleSave={() => toggleSaveReel(reel.id)}
                videoHeight={reelVideoHeight}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          decelerationRate="fast"
          pagingEnabled
          snapToAlignment="start"
          snapToInterval={reelItemHeight}
          disableIntervalMomentum
          refreshing={refreshing}
          onRefresh={() => void load(true)}
          ListHeaderComponent={error ? <Text className="pb-s text-danger">{error}</Text> : null}
          ListEmptyComponent={
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
          }
          contentContainerStyle={{
            width: '100%',
            maxWidth: 620,
            alignSelf: 'center',
          }}
        />
      )}
    </SafeAreaView>
  );
}
