import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
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
import { useAppDialog } from '@/providers/AppDialogProvider';
import { EngagementUsersSheet } from '@/components/EngagementUsersSheet';

const controlAccent = '#FFFFFF';

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase();
}

// A thin, non-intrusive progress line -- the short-form-video convention
// (TikTok/Reels/Shorts) -- instead of a full opaque control bar with a
// scrubber, timestamp and transport buttons, which read as a legacy web
// video-player chrome rather than part of the reel itself. It's still
// touch-and-drag scrubbable like Instagram's, just via a generous invisible
// hit area around the thin visual line rather than a bulky slider control.
function ProgressBar({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}) {
  const { colors } = useColorMode();
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const trackWidthRef = useRef(0);
  const durationRef = useRef(0);
  trackWidthRef.current = trackWidth;
  durationRef.current = duration;

  const seekToLocationX = (locationX: number) => {
    if (trackWidthRef.current <= 0) return;
    const ratio = Math.min(1, Math.max(0, locationX / trackWidthRef.current));
    setDragRatio(ratio);
    if (durationRef.current > 0) onSeek(ratio * durationRef.current);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => seekToLocationX(event.nativeEvent.locationX),
      onPanResponderMove: (event) => seekToLocationX(event.nativeEvent.locationX),
      onPanResponderRelease: () => setDragRatio(null),
      onPanResponderTerminate: () => setDragRatio(null),
    }),
  ).current;

  const dragging = dragRatio !== null;
  const progress = dragRatio ?? (duration > 0 ? Math.min(1, currentTime / duration) : 0);

  return (
    <View
      style={feedStyles.progressHit}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={[feedStyles.progressTrack, dragging && feedStyles.progressTrackActive]}>
        <View
          style={[
            feedStyles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
      {dragging && (
        <View
          pointerEvents="none"
          style={[
            feedStyles.progressThumb,
            { left: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      )}
    </View>
  );
}

function MuteButton({ muted, onPress }: { muted: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={muted ? 'Дуу асаах' : 'Дуу хаах'}
      onPress={onPress}
      hitSlop={8}
      className={Platform.OS === 'web' ? 'outline-none' : undefined}
      style={feedStyles.muteButton}
    >
      <Icon name={muted ? 'volume-mute' : 'volume-high'} size={16} color="#FFFFFF" />
    </Pressable>
  );
}

function NativeReelVideo({ videoUrl, isActive }: { videoUrl: string; isActive: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = false;
    instance.muted = true;
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
  // Autoplay: start this reel from the top the moment it becomes the one
  // centered in the feed, pause it the moment it scrolls out of view.
  useEffect(() => {
    if (isActive) {
      player.currentTime = 0;
      setCurrentTime(0);
      setEnded(false);
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);
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
  const seek = (seconds: number) => {
    player.currentTime = seconds;
    setCurrentTime(seconds);
    if (seconds < player.duration) setEnded(false);
  };
  return (
    <Pressable
      style={feedStyles.videoRoot}
      onPress={toggle}
      accessibilityLabel={playing ? 'Түр зогсоох' : 'Тоглуулах'}
    >
      <VideoView
        player={player}
        style={feedStyles.videoView}
        nativeControls={false}
        contentFit="contain"
        pointerEvents="none"
      />
      <CenterPlayButton playing={playing} ended={ended} />
      <MuteButton muted={muted} onPress={toggleMute} />
      <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
    </Pressable>
  );
}

function ReelVideo({ videoUrl, isActive }: { videoUrl: string; isActive: boolean }) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  // Muted by default: browsers only allow programmatic/autoplay of video
  // with sound after a user gesture, so an unmuted autoplay would silently
  // fail to play at all on web.
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = 0;
      setCurrentTime(0);
      setEnded(false);
      void video.play();
    } else {
      video.pause();
    }
  }, [isActive]);
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
      <View style={feedStyles.videoRoot}>
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
          muted,
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000',
            outline: 'none',
            cursor: 'pointer',
          },
        })}
        <CenterPlayButton playing={playing} ended={ended} />
        <MuteButton
          muted={muted}
          onPress={() => {
            const video = videoRef.current;
            if (!video) return;
            video.muted = !video.muted;
            setMuted(video.muted);
          }}
        />
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
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
  return <NativeReelVideo videoUrl={videoUrl} isActive={isActive} />;
}

// Purely a visual flash of the play/pause state -- tapping anywhere on the
// video (handled by the Pressable/onClick wrapping it) is what toggles
// playback now, so this no longer needs to be its own hit target, and the
// old back/forward-10s buttons are gone entirely: short-form vertical video
// (TikTok/Reels/Shorts) doesn't offer scrubbing, only play/pause and swipe
// to the next clip.
function CenterPlayButton({ playing, ended }: { playing: boolean; ended: boolean }) {
  return (
    <View
      className={
        Platform.OS === 'web' ? (playing && !ended ? 'opacity-0' : 'opacity-100') : undefined
      }
      style={[
        feedStyles.centerControls,
        Platform.OS !== 'web' && { opacity: playing && !ended ? 0 : 1 },
      ]}
      pointerEvents="none"
    >
      <Icon name={ended ? 'refresh' : playing ? 'pause' : 'play'} size={24} color="#FFFFFF" />
    </View>
  );
}

function ReelCard({
  reel,
  onToggleLike,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onDeleteReel,
  saved,
  onToggleSave,
  videoHeight,
  isActive,
}: {
  reel: Reel;
  onToggleLike: () => void;
  onAddComment: (content: string) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onDeleteReel: () => Promise<void>;
  saved: boolean;
  onToggleSave: () => void;
  videoHeight: number;
  isActive: boolean;
}) {
  const { user } = useUser();
  const { confirm, alert } = useAppDialog();
  const { colors } = useColorMode();
  const { height: windowHeight } = useWindowDimensions();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [shareCount, setShareCount] = useState(reel.shareCount);
  const commentInputRef = useRef<TextInput>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
  const [commentEditDraft, setCommentEditDraft] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [commentEditError, setCommentEditError] = useState('');
  const [reelMenuOpen, setReelMenuOpen] = useState(false);

  useEffect(() => setShareCount(reel.shareCount), [reel.shareCount]);

  const openAuthorProfile = () => {
    if (reel.author.id === user?.id) {
      router.push('/profile');
      return;
    }
    router.push(`/users/${reel.author.id}` as Href);
  };

  const share = async () => {
    try {
      const result = await Share.share({ message: reel.caption || 'GrowX reel' });
      if (result.action === Share.dismissedAction) return;
      const { data } = await api.post<{ shareCount: number }>(`/media/reels/${reel.id}/share`);
      setShareCount(data.shareCount);
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

    const accepted = await confirm({
      title: 'Сэтгэгдэл устгах',
      message: 'Сэтгэгдлээ устгах уу?',
      confirmLabel: 'Устгах',
      variant: 'danger',
    });
    if (accepted) await remove();
  };

  const deleteReel = async () => {
    setReelMenuOpen(false);
    const accepted = await confirm({
      title: 'Reel устгах',
      message: 'Энэ Reel-ийг устгах уу? Буцаан сэргээх боломжгүй.',
      confirmLabel: 'Устгах',
      variant: 'danger',
    });
    if (!accepted) return;
    try {
      await onDeleteReel();
    } catch (value) {
      await alert({
        title: 'Reel устгаж чадсангүй',
        message: getApiError(value, 'Дахин оролдоно уу.'),
        variant: 'danger',
      });
    }
  };

  useEffect(() => {
    if (!commentsOpen) return;
    const timer = setTimeout(() => commentInputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, [commentsOpen]);

  const closeComments = () => {
    setCommentsOpen(false);
    setActiveCommentMenuId(null);
    setEditingCommentId(null);
    setCommentEditDraft('');
    setCommentEditError('');
  };

  return (
    <View
      style={[feedStyles.reelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[feedStyles.videoShell, { height: videoHeight }]}>
        <ReelVideo videoUrl={reel.videoUrl} isActive={isActive} />
        {reel.author.id === user?.id && (
          <View className="absolute right-m top-m" style={{ zIndex: 30, elevation: 30 }}>
            <Pressable
              accessibilityLabel="Reel-ийн үйлдлүүд"
              onPress={() => setReelMenuOpen((open) => !open)}
              className="h-9 w-9 items-center justify-center rounded-avatar bg-black/70 outline-none"
            >
              <Icon name="ellipsis-horizontal" size={21} color="#FFFFFF" />
            </Pressable>
            {reelMenuOpen && (
              <View className="absolute right-0 top-11 min-w-[142px] overflow-hidden rounded-btn border border-border bg-background-paper shadow-lg">
                <Pressable
                  onPress={() => {
                    setReelMenuOpen(false);
                    router.push(`/reels/${reel.id}/edit` as Href);
                  }}
                  className="min-h-[44px] flex-row items-center gap-s border-b border-border px-s outline-none"
                >
                  <Icon name="create-outline" size={17} color={colors.text} />
                  <Text className="text-xs font-extrabold text-text-primary">Засах</Text>
                </Pressable>
                <Pressable
                  onPress={() => void deleteReel()}
                  className="min-h-[44px] flex-row items-center gap-s px-s outline-none"
                >
                  <Icon name="trash-outline" size={17} color={colors.danger} />
                  <Text className="text-xs font-extrabold text-danger">Устгах</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        <View
          pointerEvents="box-none"
          className="absolute bottom-6 left-0 right-0 bg-gradient-to-t from-black/80 px-m pb-s pr-20 pt-l"
          style={{ zIndex: 20, elevation: 20 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${reel.author.displayName || reel.author.email.split('@')[0]} профайл нээх`}
            onPress={openAuthorProfile}
            className="flex-row items-center gap-s"
            style={{ alignSelf: 'flex-start', zIndex: 21 }}
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

        <View
          className="absolute bottom-32 right-m items-center gap-s"
          style={{ zIndex: 22, elevation: 22 }}
        >
          <View className="items-center gap-1">
            <Pressable onPress={onToggleLike} className="outline-none">
              <View className="h-9 w-9 items-center justify-center rounded-avatar bg-black/70">
                <Icon
                  name={reel.likedByMe ? 'heart' : 'heart-outline'}
                  size={22}
                  color={reel.likedByMe ? '#EF4444' : '#FFFFFF'}
                />
              </View>
            </Pressable>
            <Pressable onPress={() => reel.likeCount > 0 && setLikesOpen(true)}>
              <Text className="text-[11px] font-extrabold text-white">{reel.likeCount}</Text>
            </Pressable>
          </View>
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
            <Text className="text-[10px] font-bold text-white">
              {shareCount > 0 ? shareCount : 'Хуваалцах'}
            </Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <ScrollView
            className="min-h-0 flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
              ref={commentInputRef}
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
            <Pressable
              onPress={() => void submitComment()}
              disabled={!commentDraft.trim() || sendingComment}
              hitSlop={8}
              className="outline-none"
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
                backgroundColor: colors.primary,
                opacity: !commentDraft.trim() || sendingComment ? 0.35 : 1,
              }}
            >
              {sendingComment ? (
                <ActivityIndicator color={colors.ink} size="small" />
              ) : (
                <Icon name="send" size={16} color={colors.ink} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
      <EngagementUsersSheet
        visible={likesOpen}
        onClose={() => setLikesOpen(false)}
        endpoint={`/media/reels/${reel.id}/likes`}
      />
    </View>
  );
}

export function ReelsFeedScreen({ mine = false }: { mine?: boolean }) {
  const { colors } = useColorMode();
  const { height } = useWindowDimensions();
  const [measuredFeedHeight, setMeasuredFeedHeight] = useState(0);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const savedReelIds = useEngagementStore((state) => state.savedReelIds);
  const toggleSaveReel = useEngagementStore((state) => state.toggleSaveReel);
  const feedViewportHeight = Math.max(300, measuredFeedHeight || height - 168);
  const reelVideoHeight = Math.max(292, feedViewportHeight - 8);
  const reelItemHeight = feedViewportHeight;

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      setError('');
      try {
        const { data } = await api.get<{ reels: Reel[] }>(
          mine ? '/media/reels/mine' : '/media/reels',
        );
        setReels(Array.isArray(data.reels) ? data.reels : []);
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
      // Pause every reel the moment this screen is no longer focused
      // (navigated away from) -- resumes once viewability re-fires below.
      return () => setActiveReelId(null);
    }, [load]),
  );

  // Autoplay the reel that's actually visible: fall back to the first one
  // as soon as the list loads, in case the viewability callback below
  // hasn't fired yet (e.g. before the list has measured its layout).
  useEffect(() => {
    if (!activeReelId && reels.length > 0) setActiveReelId(reels[0].id);
  }, [reels, activeReelId]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: Reel; isViewable: boolean }> }) => {
      const visible = viewableItems.find((entry) => entry.isViewable);
      if (visible) setActiveReelId(visible.item.id);
    },
  ).current;

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

  const deleteReel = async (reel: Reel) => {
    await api.delete(`/media/reels/${reel.id}`);
    setReels((current) => current.filter((item) => item.id !== reel.id));
  };

  return (
    <SafeAreaView style={[feedStyles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[feedStyles.header, { borderBottomColor: colors.border }]}>
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

      <View
        style={feedStyles.viewport}
        onLayout={(event) => {
          const nextHeight = Math.round(event.nativeEvent.layout.height);
          if (nextHeight > 0 && nextHeight !== measuredFeedHeight)
            setMeasuredFeedHeight(nextHeight);
        }}
      >
        {loading ? (
          <View style={[feedStyles.centerState, feedStyles.loadingOverlay]}>
            <Loader size={32} />
            <Text className="text-sm text-text-muted">Reel-үүдийг ачаалж байна...</Text>
          </View>
        ) : error && reels.length === 0 ? (
          <View style={feedStyles.centerState}>
            <Text className="text-center text-sm text-danger">{error}</Text>
            <Pressable
              onPress={() => void load()}
              className="rounded-btn bg-brand-primary px-l py-s"
            >
              <Text className="text-xs font-extrabold text-background-app">Дахин оролдох</Text>
            </Pressable>
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
                  onDeleteReel={() => deleteReel(reel)}
                  saved={savedReelIds.has(reel.id)}
                  onToggleSave={() => toggleSaveReel(reel.id)}
                  videoHeight={reelVideoHeight}
                  isActive={reel.id === activeReelId}
                />
              </View>
            )}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            decelerationRate="fast"
            pagingEnabled
            snapToAlignment="start"
            snapToInterval={reelItemHeight}
            disableIntervalMomentum
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            ListHeaderComponent={
              error ? (
                <View className="mx-l my-s items-center gap-s rounded-btn border border-border bg-background-paper p-m">
                  <Text className="text-center text-sm text-danger">{error}</Text>
                  <Pressable
                    onPress={() => void load()}
                    className="rounded-btn bg-brand-primary px-l py-s"
                  >
                    <Text className="text-xs font-extrabold text-background-app">
                      Дахин оролдох
                    </Text>
                  </Pressable>
                </View>
              ) : null
            }
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
              flexGrow: reels.length === 0 ? 1 : undefined,
              width: '100%',
              maxWidth: 620,
              alignSelf: 'center',
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const feedStyles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: 0, overflow: 'hidden' },
  header: {
    height: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  viewport: { flex: 1, minHeight: 0, width: '100%' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject },
  centerState: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  centerControls: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 52,
    height: 52,
    marginLeft: -26,
    marginTop: -26,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  muteButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  progressHit: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
    justifyContent: 'flex-end',
  },
  progressTrack: {
    width: '100%',
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressTrackActive: { height: 4 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressThumb: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  reelCard: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
  },
  videoShell: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  videoRoot: {
    position: 'relative',
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  videoView: { width: '100%', height: '100%', backgroundColor: '#000000' },
});
