import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { api } from '@/services/api';
import type { ChatMessage, ChatUser } from '@/types/chat';
import { getApiError } from '@/utils/auth';
import { useUser } from '@/providers/UserProvider';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { getSocket } from '@/services/socket';
import { useColorMode } from '@/providers/ColorModeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { uploadMedia, type LocalUploadAsset } from '@/services/blob';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { GrowXMark } from '@/components/GrowXLogo';

const lime = '#9AF000';
const MESSAGE_ACTION_WINDOW_MS = 10 * 60 * 1000;
const GROWX_WELCOME_EMAIL = 'welcome@growx.mn';

type DeliveryMessage = ChatMessage & {
  deliveryStatus?: 'sending' | 'failed';
};

type SelectedMedia = LocalUploadAsset & { type: 'image' | 'video' | 'audio' };

type SendAck = { ok: boolean; message?: ChatMessage; error?: string };

function displayName(user: ChatUser | null) {
  return user?.displayName || user?.email.split('@')[0] || 'GrowX хэрэглэгч';
}

function messageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function canModifyMessage(message: ChatMessage) {
  return Date.now() - new Date(message.createdAt).getTime() <= MESSAGE_ACTION_WINDOW_MS;
}

function audioTime(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(safeValue / 60)}:${String(safeValue % 60).padStart(2, '0')}`;
}

function VoiceMessage({ source, mine }: { source: string; mine: boolean }) {
  const { colors } = useColorMode();
  const player = useAudioPlayer(source, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const duration = Number.isFinite(status.duration) ? status.duration : 0;
  const currentTime = Number.isFinite(status.currentTime) ? status.currentTime : 0;
  const [seeking, setSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const displayedTime = seeking ? seekTime : currentTime;

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (duration > 0 && currentTime >= duration - 0.1) void player.seekTo(0);
    player.play();
  };

  return (
    <View style={styles.voiceMessage}>
      <Pressable
        accessibilityLabel={status.playing ? 'Дуут мессежийг түр зогсоох' : 'Дуут мессеж тоглуулах'}
        onPress={togglePlayback}
        style={[
          styles.voicePlayButton,
          { backgroundColor: mine ? 'rgba(3, 15, 10, 0.16)' : colors.surfaceSoft },
        ]}
      >
        <Icon name={status.playing ? 'pause' : 'play'} size={18} color={mine ? colors.ink : lime} />
      </Pressable>
      <View style={styles.voiceProgressArea}>
        <Slider
          accessibilityLabel="Дуут мессежийн хугацааг урагш, хойшлуулах"
          disabled={duration <= 0}
          maximumTrackTintColor={mine ? 'rgba(3, 15, 10, 0.2)' : colors.borderStrong}
          maximumValue={Math.max(duration, 1)}
          minimumTrackTintColor={mine ? colors.ink : lime}
          minimumValue={0}
          onSlidingComplete={(value) => {
            setSeekTime(value);
            void player
              .seekTo(value)
              .catch(() => undefined)
              .finally(() => setSeeking(false));
          }}
          onSlidingStart={() => {
            setSeekTime(currentTime);
            setSeeking(true);
          }}
          onValueChange={setSeekTime}
          step={0.1}
          style={styles.voiceSlider}
          thumbTintColor={mine ? colors.ink : lime}
          value={Math.min(displayedTime, Math.max(duration, 1))}
        />
        <Text style={[styles.voiceDuration, { color: mine ? colors.ink : colors.muted }]}>
          {audioTime(displayedTime)} / {audioTime(duration)}
        </Text>
      </View>
      <Icon name="mic" size={17} color={mine ? colors.ink : lime} />
    </View>
  );
}

export default function ConversationScreen() {
  const { iconAccent, colors, isDark } = useColorMode();
  const { confirm } = useAppDialog();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useUser();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const recordingBusyRef = useRef(false);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [messages, setMessages] = useState<DeliveryMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachment, setAttachment] = useState<SelectedMedia | null>(null);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [unsendingId, setUnsendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const latestOutgoingStatus = useMemo(() => {
    if (!user?.id) return null;
    const message = [...messages].reverse().find((item) => item.senderId === user.id);
    if (!message) return null;
    const readAt = otherLastReadAt ? new Date(otherLastReadAt).getTime() : 0;
    return {
      messageId: message.id,
      read: new Date(message.createdAt).getTime() <= readAt,
    };
  }, [messages, otherLastReadAt, user?.id]);

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!conversationId) return;
      try {
        const { data } = await api.get<{
          otherUser: ChatUser | null;
          otherLastReadAt: string | null;
          messages: ChatMessage[];
        }>(`/conversations/${conversationId}/messages`);
        setOtherUser((current) =>
          JSON.stringify(current) === JSON.stringify(data.otherUser) ? current : data.otherUser,
        );
        setOtherLastReadAt((current) =>
          current === data.otherLastReadAt ? current : data.otherLastReadAt,
        );
        setMessages((current) => {
          const serverClientIds = new Set(
            data.messages.map((message) => message.clientMessageId).filter(Boolean),
          );
          const localOnly = current.filter(
            (message) =>
              message.deliveryStatus &&
              message.clientMessageId &&
              !serverClientIds.has(message.clientMessageId),
          );
          const next = [...data.messages, ...localOnly].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          return JSON.stringify(current) === JSON.stringify(next) ? current : next;
        });
        setError('');
        void api.patch(`/conversations/${conversationId}/read`).catch(() => undefined);
      } catch (value) {
        if (!silent) setError(getApiError(value, 'Мессежүүдийг авч чадсангүй.'));
      } finally {
        setLoading(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const timer = setInterval(() => {
      void loadMessages(true);
    }, 3_000);
    return () => clearInterval(timer);
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    let connectedSocket: Awaited<ReturnType<typeof getSocket>> | null = null;
    const joinConversation = () => {
      connectedSocket?.emit('conversation:join', { conversationId });
    };

    const mergeMessage = (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((items) => {
        const next = items.filter(
          (item) =>
            item.id !== message.id &&
            (!message.clientMessageId || item.clientMessageId !== message.clientMessageId),
        );
        return [...next, message].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      if (message.senderId !== user?.id) {
        connectedSocket?.emit('message:read', { conversationId });
        void api.patch(`/conversations/${conversationId}/read`).catch(() => undefined);
      }
    };
    const handleRead = (payload: { conversationId: string; userId: string; readAt: string }) => {
      if (payload.conversationId === conversationId && payload.userId !== user?.id) {
        setOtherLastReadAt(payload.readAt);
      }
    };

    void getSocket()
      .then((socket) => {
        if (!active) return;
        connectedSocket = socket;
        socket.on('connect', joinConversation);
        socket.on('message:new', mergeMessage);
        socket.on('message:read', handleRead);
        joinConversation();
        socket.emit('message:read', { conversationId });
      })
      .catch(() => undefined);

    return () => {
      active = false;
      if (!connectedSocket) return;
      connectedSocket.emit('conversation:leave', { conversationId });
      connectedSocket.off('connect', joinConversation);
      connectedSocket.off('message:new', mergeMessage);
      connectedSocket.off('message:read', handleRead);
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (!messages.length) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages.length]);

  useEffect(() => {
    if (!editingMessage) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [editingMessage]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, [loading]);

  const deliverMessage = async (pending: DeliveryMessage) => {
    if (!conversationId || !pending.clientMessageId) return;
    setSending(true);
    setMessages((items) =>
      items.map((item) =>
        item.clientMessageId === pending.clientMessageId
          ? { ...item, deliveryStatus: 'sending' }
          : item,
      ),
    );
    try {
      let delivered: ChatMessage | undefined;
      try {
        const socket = await getSocket();
        const ack = await new Promise<SendAck>((resolve, reject) => {
          socket.timeout(7_000).emit(
            'message:send',
            {
              conversationId,
              content: pending.content,
              clientMessageId: pending.clientMessageId,
              mediaType: pending.mediaType ?? undefined,
              mediaUrl: pending.mediaUrl ?? undefined,
            },
            (timeoutError: Error | null, response: SendAck) => {
              if (timeoutError) reject(timeoutError);
              else resolve(response);
            },
          );
        });
        if (ack.ok) delivered = ack.message;
        else throw new Error(ack.error || 'Socket send failed');
      } catch {
        const { data } = await api.post<{ message: ChatMessage }>(
          `/conversations/${conversationId}/messages`,
          {
            content: pending.content,
            clientMessageId: pending.clientMessageId,
            mediaType: pending.mediaType ?? undefined,
            mediaUrl: pending.mediaUrl ?? undefined,
          },
        );
        delivered = data.message;
      }
      if (!delivered) throw new Error('Message acknowledgement missing');
      setMessages((items) =>
        items.map((item) => (item.clientMessageId === pending.clientMessageId ? delivered! : item)),
      );
      setError('');
    } catch (value) {
      setMessages((items) =>
        items.map((item) =>
          item.clientMessageId === pending.clientMessageId
            ? { ...item, deliveryStatus: 'failed' }
            : item,
        ),
      );
      setError(getApiError(value, 'Мессеж илгээгдсэнгүй. Дахин оролдоно уу.'));
    } finally {
      setSending(false);
    }
  };

  const send = async (selectedAttachment: SelectedMedia | null = attachment) => {
    const content = draft.trim();
    if ((!content && !selectedAttachment) || sending || uploading || !conversationId || !user)
      return;

    let mediaUrl: string | null = null;
    let mediaType: ChatMessage['mediaType'] = null;
    if (selectedAttachment) {
      setUploading(true);
      setUploadProgress(0);
      setError('');
      try {
        const blob = await uploadMedia(
          selectedAttachment,
          selectedAttachment.type,
          setUploadProgress,
        );
        mediaUrl = blob.url;
        mediaType =
          selectedAttachment.type === 'video'
            ? 'VIDEO'
            : selectedAttachment.type === 'audio'
              ? 'AUDIO'
              : 'IMAGE';
      } catch (value) {
        setAttachment(selectedAttachment);
        setError(getApiError(value, 'Файл байршуулж чадсангүй. Дахин оролдоно уу.'));
        return;
      } finally {
        setUploading(false);
      }
    }

    const clientMessageId = `gx-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const pending: DeliveryMessage = {
      id: `pending:${clientMessageId}`,
      clientMessageId,
      conversationId,
      senderId: user.id,
      content,
      mediaType,
      mediaUrl,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      sender: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        lastSeenAt: new Date().toISOString(),
      },
      deliveryStatus: 'sending',
    };
    setDraft('');
    setAttachment(null);
    setUploadProgress(0);
    setMessages((items) => [...items, pending]);
    await deliverMessage(pending);
  };

  const pickAttachment = async () => {
    if (sending || uploading || editingMessage || isRecording) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Зураг, видео сонгохын тулд gallery хандах эрх өгнө үү.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.9,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const type: SelectedMedia['type'] =
        asset.type === 'video' || asset.mimeType?.startsWith('video/') ? 'video' : 'image';
      const unsupportedWebVideo =
        Platform.OS === 'web' &&
        type === 'video' &&
        (asset.mimeType === 'video/quicktime' || /\.mov$/i.test(asset.fileName || asset.uri));
      if (unsupportedWebVideo) {
        setError('Chrome дээр MOV видео тоглохгүй. MP4 (H.264) эсвэл WebM файл сонгоно уу.');
        return;
      }
      setAttachment({
        type,
        uri: asset.uri,
        name: asset.fileName || `message-${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
        mimeType: asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
        file: asset.file,
      });
      setUploadProgress(0);
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Зураг, видео сонгож чадсангүй.'));
    }
  };

  const finishRecording = useCallback(
    async (discard = false, keepPreview = true): Promise<SelectedMedia | null> => {
      if (recordingBusyRef.current) return null;
      recordingBusyRef.current = true;
      let recordedMedia: SelectedMedia | null = null;
      try {
        if (recorder.isRecording || recordingPaused) await recorder.stop();
        const status = recorder.getStatus();
        const uri = recorder.uri ?? status.url;
        if (!discard && uri) {
          const webRecording = Platform.OS === 'web';
          recordedMedia = {
            type: 'audio',
            uri,
            name: `voice-${Date.now()}.${webRecording ? 'webm' : 'm4a'}`,
            mimeType: webRecording ? 'audio/webm' : 'audio/mp4',
          };
          if (keepPreview) setAttachment(recordedMedia);
          setUploadProgress(0);
          setError('');
        } else if (!discard) {
          setError('Дуут бичлэг хадгалагдсангүй. Дахин бичнэ үү.');
        }
      } catch (value) {
        if (!discard) setError(getApiError(value, 'Дуут бичлэгийг хадгалж чадсангүй.'));
      } finally {
        setIsRecording(false);
        setRecordingPaused(false);
        recordingBusyRef.current = false;
        void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      }
      return recordedMedia;
    },
    [recorder, recordingPaused],
  );

  const startRecording = async () => {
    if (sending || uploading || editingMessage || isRecording || recordingBusyRef.current) return;
    recordingBusyRef.current = true;
    setError('');
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('Дуут мессеж бичихийн тулд микрофоны эрх өгнө үү.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      setAttachment(null);
      setUploadProgress(0);
      recorder.record({ forDuration: 30 });
      setIsRecording(true);
      setRecordingPaused(false);
    } catch (value) {
      setError(getApiError(value, 'Дуут бичлэг эхлүүлж чадсангүй.'));
      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    } finally {
      recordingBusyRef.current = false;
    }
  };

  const toggleRecordingPause = () => {
    if (!isRecording || recordingBusyRef.current) return;
    if (recordingPaused) {
      const remainingSeconds = Math.max(1, (30_000 - recorderState.durationMillis) / 1000);
      recorder.record({ forDuration: remainingSeconds });
      setRecordingPaused(false);
      return;
    }
    recorder.pause();
    setRecordingPaused(true);
  };

  const sendRecording = async () => {
    const recordedMedia = await finishRecording(false, false);
    if (recordedMedia) await send(recordedMedia);
  };

  useEffect(() => {
    if (!isRecording || recordingPaused) return;
    const remainingMs = Math.max(0, 30_000 - recorderState.durationMillis);
    if (remainingMs === 0) {
      void finishRecording();
      return;
    }
    const timer = setTimeout(() => void finishRecording(), remainingMs + 100);
    return () => clearTimeout(timer);
  }, [finishRecording, isRecording, recorderState.durationMillis, recordingPaused]);

  useEffect(
    () => () => {
      if (recorder.isRecording) void recorder.stop();
    },
    [recorder],
  );

  const unsend = async (messageId: string) => {
    if (!conversationId || unsendingId) return;
    setUnsendingId(messageId);
    setSelectedMessage(null);
    setMessages((items) => items.filter((message) => message.id !== messageId));
    setError('');
    try {
      await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
    } catch (value) {
      setError(getApiError(value, 'Мессежийг буцааж чадсангүй.'));
      await loadMessages(true);
    } finally {
      setUnsendingId(null);
    }
  };

  const confirmUnsend = async (messageId: string) => {
    const message = 'Энэ мессежийг хүн бүрийн чатаас устгах уу?';
    const accepted = await confirm({
      title: 'Илгээснийг буцаах',
      message,
      confirmLabel: 'Буцаах',
      variant: 'danger',
    });
    if (accepted) await unsend(messageId);
  };

  const beginEdit = (message: ChatMessage) => {
    if (!canModifyMessage(message) || !message.content.trim()) return;
    setSelectedMessage(null);
    setEditingMessage(message);
    setEditDraft(message.content);
  };

  const openMessageMenu = (
    message: ChatMessage,
    event: { nativeEvent: { pageX: number; pageY: number } },
  ) => {
    const menuWidth = 154;
    const menuHeight = 130;
    setMenuAnchor({
      x: Math.max(12, Math.min(event.nativeEvent.pageX - menuWidth, windowWidth - menuWidth - 12)),
      y: Math.max(
        12,
        Math.min(event.nativeEvent.pageY - menuHeight, windowHeight - menuHeight - 12),
      ),
    });
    setSelectedMessage(message);
  };

  const saveEdit = async () => {
    const content = editDraft.trim();
    if (!conversationId || !editingMessage || !content || savingEdit) return;
    setSavingEdit(true);
    setError('');
    try {
      const { data } = await api.patch<{ message: ChatMessage }>(
        `/conversations/${conversationId}/messages/${editingMessage.id}`,
        { content },
      );
      setMessages((items) =>
        items.map((message) => (message.id === data.message.id ? data.message : message)),
      );
      setEditingMessage(null);
      setEditDraft('');
    } catch (value) {
      setError(getApiError(value, 'Мессежийг засаж чадсангүй.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelEdit = () => {
    if (savingEdit) return;
    setEditingMessage(null);
    setEditDraft('');
  };

  const sendDisabled = editingMessage
    ? !editDraft.trim() || savingEdit
    : (!draft.trim() && !attachment) || sending || uploading;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <Pressable
            accessibilityLabel="Мессежийн жагсаалт руу буцах"
            onPress={() => router.replace('/messages')}
            style={[
              styles.backButton,
              { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
            ]}
          >
            <Icon name="chevron-back" size={27} color={colors.text} />
          </Pressable>
          <Pressable
            disabled={!otherUser}
            onPress={() =>
              otherUser?.email !== GROWX_WELCOME_EMAIL &&
              otherUser &&
              router.push(`/users/${otherUser.id}` as Href)
            }
            style={styles.profileLink}
          >
            {otherUser?.email === GROWX_WELCOME_EMAIL ? (
              <View
                style={[
                  styles.headerAvatar,
                  styles.growxHeaderAvatar,
                  { backgroundColor: colors.surfaceSoft, borderColor: colors.primary },
                ]}
              >
                <GrowXMark size={38} />
              </View>
            ) : otherUser?.avatarUrl ? (
              <Image
                source={{ uri: otherUser.avatarUrl }}
                style={[styles.headerAvatar, { borderColor: colors.borderStrong }]}
              />
            ) : (
              <View
                style={[
                  styles.headerAvatar,
                  { backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong },
                ]}
              >
                <Text style={[styles.headerAvatarText, { color: colors.primary }]}>
                  {displayName(otherUser).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
                {displayName(otherUser)}
              </Text>
            </View>
          </Pressable>
        </View>

        {loading ? (
          <Loader size={32} style={styles.loader} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={[styles.scroll, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            onScrollBeginDrag={() => setSelectedMessage(null)}
          >
            {!messages.length && (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
                  ]}
                >
                  <Icon name="chatbubble-ellipses-outline" size={29} color={iconAccent} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Шинэ яриа</Text>
                <Text style={[styles.emptyCopy, { color: colors.muted }]}>
                  Эхний мессежээ илгээгээрэй.
                </Text>
              </View>
            )}
            {messages.map((message) => {
              const mine = message.senderId === user?.id;
              const actionAvailable = mine && !message.deliveryStatus && canModifyMessage(message);
              const selected = selectedMessage?.id === message.id;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageLine,
                    mine && styles.mineLine,
                    selected && styles.selectedMessageLine,
                  ]}
                >
                  <View style={[styles.messageCluster, mine && styles.mineMessageCluster]}>
                    {actionAvailable && (
                      <View style={styles.moreWrap}>
                        <Pressable
                          accessibilityLabel="Message options"
                          disabled={Boolean(unsendingId)}
                          onPress={(event) =>
                            selected ? setSelectedMessage(null) : openMessageMenu(message, event)
                          }
                          style={({ pressed }) => [
                            styles.moreButton,
                            selected && [
                              styles.moreButtonActive,
                              { backgroundColor: colors.surfaceRaised },
                            ],
                            pressed && styles.moreButtonPressed,
                          ]}
                        >
                          <Icon
                            name="ellipsis-horizontal"
                            size={18}
                            color={selected ? iconAccent : colors.muted}
                          />
                        </Pressable>
                      </View>
                    )}
                    <Pressable
                      disabled={!actionAvailable || Boolean(unsendingId)}
                      delayLongPress={350}
                      onLongPress={(event) => actionAvailable && openMessageMenu(message, event)}
                      style={[
                        styles.bubble,
                        message.mediaUrl && {
                          width: Math.min(310, windowWidth * 0.7),
                          paddingHorizontal: 6,
                          paddingTop: 6,
                        },
                        mine
                          ? [styles.mineBubble, { backgroundColor: colors.primary }]
                          : [
                              styles.theirBubble,
                              {
                                backgroundColor: colors.surfaceRaised,
                                borderColor: colors.border,
                              },
                            ],
                      ]}
                    >
                      {message.mediaUrl && message.mediaType === 'AUDIO' ? (
                        <VoiceMessage source={message.mediaUrl} mine={mine} />
                      ) : message.mediaUrl && message.mediaType === 'VIDEO' ? (
                        <View style={styles.messageMedia}>
                          <VideoPlayer
                            source={message.mediaUrl}
                            aspectRatio={16 / 9}
                            loop={false}
                          />
                        </View>
                      ) : message.mediaUrl ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Зургийг томоор харах"
                          onPress={() => setImageViewerUrl(message.mediaUrl)}
                        >
                          <Image
                            source={{ uri: message.mediaUrl }}
                            resizeMode="cover"
                            style={styles.messageMedia}
                          />
                        </Pressable>
                      ) : null}
                      {!!message.content && (
                        <Text
                          style={[
                            styles.messageText,
                            message.mediaUrl && styles.messageCaption,
                            { color: mine ? colors.ink : colors.text },
                          ]}
                        >
                          {message.content}
                        </Text>
                      )}
                      <Text
                        style={[styles.messageTime, { color: mine ? colors.ink : colors.muted }]}
                      >
                        {message.editedAt ? 'зассан · ' : ''}
                        {messageTime(message.createdAt)}
                      </Text>
                    </Pressable>
                  </View>
                  {mine &&
                    !message.deliveryStatus &&
                    message.id === latestOutgoingStatus?.messageId && (
                      <Text
                        style={[
                          styles.seenText,
                          { color: latestOutgoingStatus.read ? iconAccent : colors.muted },
                        ]}
                      >
                        {latestOutgoingStatus.read ? 'Уншсан' : 'Уншаагүй'}
                      </Text>
                    )}
                  {mine && message.deliveryStatus === 'sending' && (
                    <Text style={[styles.deliverySending, { color: colors.muted }]}>
                      Илгээж байна…
                    </Text>
                  )}
                  {mine && message.deliveryStatus === 'failed' && (
                    <Pressable onPress={() => void deliverMessage(message)} hitSlop={8}>
                      <Text style={[styles.deliveryFailed, { color: colors.danger }]}>
                        Илгээгдсэнгүй · Дахин илгээх
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
        <View
          style={[
            styles.composerShell,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          {editingMessage && (
            <View style={[styles.editingHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.editingCopy}>
                <Text style={[styles.editingLabel, { color: colors.primary }]}>
                  Мессеж засаж байна
                </Text>
                <Text numberOfLines={1} style={[styles.editingPreview, { color: colors.muted }]}>
                  {editingMessage.content}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Cancel editing"
                disabled={savingEdit}
                onPress={cancelEdit}
                style={[styles.cancelEditingButton, { backgroundColor: colors.surfaceSoft }]}
              >
                <Icon name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}
          {!editingMessage && attachment && (
            <View style={[styles.attachmentPreview, { borderBottomColor: colors.border }]}>
              {attachment.type === 'audio' ? (
                <View style={styles.attachmentVoicePreview}>
                  <VoiceMessage source={attachment.uri} mine={false} />
                </View>
              ) : attachment.type === 'video' ? (
                <View style={styles.attachmentThumbnail}>
                  <VideoPlayer source={attachment.uri} aspectRatio={16 / 9} loop={false} />
                </View>
              ) : (
                <Image
                  source={{ uri: attachment.uri }}
                  resizeMode="cover"
                  style={styles.attachmentThumbnail}
                />
              )}
              <View style={styles.attachmentCopy}>
                <Text numberOfLines={1} style={[styles.attachmentName, { color: colors.text }]}>
                  {attachment.name}
                </Text>
                <Text style={[styles.attachmentKind, { color: colors.muted }]}>
                  {uploading
                    ? `Байршуулж байна ${Math.round(uploadProgress)}%`
                    : attachment.type === 'audio'
                      ? 'Дуут мессеж · 30 сек хүртэл'
                      : attachment.type === 'video'
                        ? 'Видео'
                        : 'Зураг'}
                </Text>
                {uploading && (
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSoft }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.primary, width: `${uploadProgress}%` },
                      ]}
                    />
                  </View>
                )}
              </View>
              <Pressable
                accessibilityLabel="Сонгосон файлыг хасах"
                disabled={uploading}
                onPress={() => setAttachment(null)}
                style={[styles.removeAttachment, { backgroundColor: colors.surfaceSoft }]}
              >
                <Icon name="close" size={19} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}
          <View
            style={[
              styles.composer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {!editingMessage && !isRecording && (
              <Pressable
                accessibilityLabel="Зураг эсвэл видео сонгох"
                disabled={sending || uploading}
                onPress={() => void pickAttachment()}
                style={({ pressed }) => [
                  styles.attachmentButton,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong },
                  pressed && styles.attachmentButtonPressed,
                  (sending || uploading) && styles.sendDisabled,
                ]}
              >
                <Icon name="image-outline" size={22} color={iconAccent} />
              </Pressable>
            )}
            {isRecording ? (
              <View
                style={[
                  styles.recordingStatus,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.danger },
                ]}
              >
                <View style={[styles.recordingDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.recordingTime, { color: colors.text }]}>
                  {recordingPaused ? 'Pause · ' : ''}
                  {audioTime(Math.min(recorderState.durationMillis, 30_000) / 1000)} / 0:30
                </Text>
                <Pressable
                  accessibilityLabel="Дуут бичлэгийг цуцлах"
                  onPress={() => void finishRecording(true)}
                  hitSlop={8}
                >
                  <Icon name="trash-outline" size={19} color={colors.danger} />
                </Pressable>
              </View>
            ) : (
              <TextInput
                ref={inputRef}
                value={editingMessage ? editDraft : draft}
                onChangeText={editingMessage ? setEditDraft : setDraft}
                placeholder="Мессеж бичих..."
                placeholderTextColor={colors.muted}
                keyboardAppearance={isDark ? 'dark' : 'light'}
                selectionColor={iconAccent}
                cursorColor={iconAccent}
                multiline
                maxLength={4000}
                scrollEnabled
                onKeyPress={(event) => {
                  if (Platform.OS !== 'web') return;
                  const nativeEvent = event.nativeEvent as unknown as {
                    key: string;
                    shiftKey?: boolean;
                  };
                  if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
                    event.preventDefault();
                    void (editingMessage ? saveEdit() : send());
                  }
                }}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.borderStrong,
                  },
                  Platform.OS === 'web' &&
                    ({
                      outlineStyle: 'none',
                      outlineWidth: 0,
                      resize: 'none',
                    } as never),
                ]}
              />
            )}
            {!editingMessage && (
              <Pressable
                accessibilityLabel={
                  isRecording
                    ? recordingPaused
                      ? 'Дуут бичлэгийг үргэлжлүүлэх'
                      : 'Дуут бичлэгийг түр зогсоох'
                    : 'Дуут мессеж бичих'
                }
                disabled={sending || uploading}
                onPress={() => void (isRecording ? toggleRecordingPause() : startRecording())}
                style={[
                  styles.voiceRecordButton,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: isRecording ? colors.danger : colors.borderStrong,
                  },
                  (sending || uploading) && styles.sendDisabled,
                ]}
              >
                <Icon
                  name={isRecording ? (recordingPaused ? 'play' : 'pause') : 'mic-outline'}
                  size={21}
                  color={isRecording ? colors.danger : iconAccent}
                />
              </Pressable>
            )}
            {isRecording && (
              <Pressable
                accessibilityLabel="Дуут бичлэгийг зогсоох"
                disabled={recordingBusyRef.current}
                onPress={() => void finishRecording()}
                style={[
                  styles.recordingStopButton,
                  { backgroundColor: colors.danger, borderColor: colors.danger },
                ]}
              >
                <Icon name="stop" size={19} color="#FFFFFF" />
              </Pressable>
            )}
            {isRecording && (
              <Pressable
                accessibilityLabel="Дуут бичлэгийг илгээх"
                disabled={sending || uploading || recordingBusyRef.current}
                onPress={() => void sendRecording()}
                style={[styles.recordingSendButton, { backgroundColor: colors.primary }]}
              >
                <Icon name="send" size={20} color={colors.ink} />
              </Pressable>
            )}
            {!isRecording && (
              <Pressable
                disabled={sendDisabled}
                onPress={() => void (editingMessage ? saveEdit() : send())}
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.primary },
                  sendDisabled && styles.sendDisabled,
                ]}
              >
                {savingEdit || uploading ? (
                  <ActivityIndicator color={colors.ink} size="small" />
                ) : (
                  <Icon name="send" size={22} color={colors.ink} />
                )}
              </Pressable>
            )}
          </View>
        </View>

        <Modal
          animationType="fade"
          onRequestClose={() => setSelectedMessage(null)}
          transparent
          visible={Boolean(selectedMessage)}
        >
          <View style={styles.menuModalRoot}>
            <Pressable
              accessibilityLabel="Close message options"
              onPress={() => setSelectedMessage(null)}
              style={styles.menuBackdrop}
            />
            {selectedMessage && (
              <View
                style={[
                  styles.messagePopover,
                  {
                    left: menuAnchor.x,
                    top: menuAnchor.y,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.popoverTime, { color: colors.muted }]}>
                  {messageTime(selectedMessage.createdAt)}
                </Text>
                <View style={[styles.popoverDivider, { backgroundColor: colors.border }]} />
                {!!selectedMessage.content.trim() && (
                  <Pressable
                    onPress={() => beginEdit(selectedMessage)}
                    style={({ pressed }) => [
                      styles.popoverItem,
                      pressed && { backgroundColor: colors.surfaceRaised },
                    ]}
                  >
                    <Icon name="create-outline" size={17} color={iconAccent} />
                    <Text style={[styles.popoverItemText, { color: colors.text }]}>Засах</Text>
                  </Pressable>
                )}
                <Pressable
                  disabled={Boolean(unsendingId)}
                  onPress={() => confirmUnsend(selectedMessage.id)}
                  style={({ pressed }) => [
                    styles.popoverItem,
                    pressed && { backgroundColor: colors.surfaceRaised },
                  ]}
                >
                  <Icon name="trash-outline" size={17} color={colors.danger} />
                  <Text style={[styles.popoverDeleteText, { color: colors.danger }]}>Устгах</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={Boolean(imageViewerUrl)}
          onRequestClose={() => setImageViewerUrl(null)}
        >
          <View style={styles.imageViewerRoot}>
            <Pressable
              accessibilityLabel="Зураг хаах"
              onPress={() => setImageViewerUrl(null)}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="box-none" style={styles.imageViewerContent}>
              <Image
                source={imageViewerUrl ? { uri: imageViewerUrl } : undefined}
                resizeMode="contain"
                style={styles.imageViewerImage}
              />
              <Pressable
                accessibilityLabel="Зураг хаах"
                onPress={() => setImageViewerUrl(null)}
                style={styles.imageViewerClose}
              >
                <Icon name="close" size={25} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020B0D' },
  keyboard: { flex: 1, width: '100%', maxWidth: 780, alignSelf: 'center' },
  header: {
    height: 76,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#183128',
    backgroundColor: '#04110E',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C211A',
    borderWidth: 1,
    borderColor: '#29473B',
  },
  back: { color: '#F2F6F4', fontSize: 38, lineHeight: 40 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#173126',
    borderWidth: 1,
    borderColor: '#365548',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: lime, fontSize: 17, fontWeight: '900' },
  growxHeaderAvatar: { overflow: 'hidden' },
  headerCopy: { flex: 1, marginLeft: 11 },
  profileLink: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  name: { color: '#F5F8F6', fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  loader: { flex: 1 },
  scroll: { flex: 1, backgroundColor: '#020D0B' },
  messages: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    justifyContent: 'flex-end',
    gap: 8,
  },
  empty: { alignItems: 'center', marginBottom: 70 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#102A20',
    borderWidth: 1,
    borderColor: '#294B3D',
  },
  emptyTitle: { color: '#EAF0ED', fontSize: 17, fontWeight: '900', marginTop: 14 },
  emptyCopy: { color: '#77857F', fontSize: 13, marginTop: 7 },
  messageLine: { alignItems: 'flex-start' },
  mineLine: { alignItems: 'flex-end' },
  selectedMessageLine: { zIndex: 30 },
  messageCluster: { maxWidth: '82%', flexDirection: 'row', alignItems: 'center', gap: 5 },
  mineMessageCluster: { flexDirection: 'row' },
  moreWrap: {
    width: 30,
    height: 30,
  },
  moreButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  moreButtonActive: { backgroundColor: '#112A21' },
  moreButtonPressed: { opacity: 0.65 },
  moreButtonText: {
    color: '#8D9B95',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  moreButtonTextActive: { color: lime },
  menuModalRoot: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  messagePopover: {
    position: 'absolute',
    width: 154,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#315447',
    backgroundColor: '#0A1D17',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
    zIndex: 50,
  },
  popoverTime: {
    color: '#819089',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  popoverDivider: { height: 1, backgroundColor: '#20372F' },
  popoverItem: {
    height: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  popoverItemPressed: { backgroundColor: '#132A23' },
  popoverIcon: { width: 20, color: lime, fontSize: 16, textAlign: 'center' },
  popoverItemText: { color: '#EEF4F1', fontSize: 13, fontWeight: '700' },
  popoverDeleteIcon: { width: 20, color: '#E64C55', fontSize: 17, textAlign: 'center' },
  popoverDeleteText: { color: '#E64C55', fontSize: 13, fontWeight: '700' },
  bubble: {
    flexShrink: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  theirBubble: {
    backgroundColor: '#10251E',
    borderWidth: 1,
    borderColor: '#203B31',
    borderBottomLeftRadius: 6,
  },
  mineBubble: { backgroundColor: lime, borderBottomRightRadius: 6 },
  messageText: { color: '#EAF0ED', fontSize: 14, lineHeight: 20 },
  messageCaption: { paddingHorizontal: 8, paddingTop: 8 },
  messageMedia: { width: '100%', aspectRatio: 16 / 9, borderRadius: 15, overflow: 'hidden' },
  imageViewerRoot: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)' },
  imageViewerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  imageViewerImage: { width: '100%', height: '100%' },
  imageViewerClose: {
    position: 'absolute',
    top: 54,
    right: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  voiceMessage: {
    minHeight: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 6,
  },
  voicePlayButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceProgressArea: { flex: 1, minWidth: 0 },
  voiceSlider: { width: '100%', height: 24 },
  voiceDuration: { fontSize: 9, fontWeight: '700', marginTop: 5 },
  mineText: { color: '#142000' },
  messageTime: { color: '#77877F', fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  mineTime: { color: '#446016' },
  seenText: {
    color: '#82B84D',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    marginRight: 4,
  },
  deliverySending: { color: '#718079', fontSize: 9, marginTop: 3, marginRight: 4 },
  deliveryFailed: {
    color: '#FF7777',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    marginRight: 4,
  },
  error: { color: '#FF7777', fontSize: 12, paddingHorizontal: 17, paddingVertical: 5 },
  composerShell: {
    borderTopWidth: 1,
    borderTopColor: '#173029',
    backgroundColor: '#04130F',
    paddingTop: 2,
  },
  editingHeader: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  editingCopy: { flex: 1, minWidth: 0 },
  editingLabel: { color: lime, fontSize: 12, fontWeight: '900' },
  editingPreview: { color: '#7D8B85', fontSize: 10, marginTop: 3 },
  attachmentPreview: {
    minHeight: 86,
    paddingHorizontal: 15,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1,
  },
  attachmentThumbnail: {
    width: 104,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
  },
  attachmentVoicePreview: { width: 150 },
  attachmentCopy: { flex: 1, minWidth: 0 },
  attachmentName: { fontSize: 12, fontWeight: '800' },
  attachmentKind: { fontSize: 10, marginTop: 4 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 7 },
  progressFill: { height: '100%', borderRadius: 2 },
  removeAttachment: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditingButton: {
    width: 34,
    height: 34,
    marginLeft: 12,
    borderRadius: 17,
    backgroundColor: '#10251F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditingText: { color: '#E8EEEB', fontSize: 26, lineHeight: 28, fontWeight: '400' },
  composer: {
    minHeight: 72,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  attachmentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  attachmentButtonPressed: { opacity: 0.7 },
  voiceRecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  recordingStopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  recordingSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingStatus: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordingDot: { width: 9, height: 9, borderRadius: 5 },
  recordingTime: { flex: 1, fontSize: 13, fontWeight: '800' },
  input: {
    flex: 1,
    height: 50,
    minHeight: 50,
    maxHeight: 50,
    paddingHorizontal: 15,
    paddingTop: 11,
    paddingBottom: 10,
    borderRadius: 25,
    color: '#F0F5F2',
    fontSize: 14,
    backgroundColor: '#0C211A',
    borderWidth: 1,
    borderColor: '#2C4C3F',
    overflow: 'hidden',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lime,
    shadowColor: lime,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  sendDisabled: { opacity: 0.35 },
  sendIcon: { color: '#142000', fontSize: 25, fontWeight: '900', lineHeight: 27 },
});
