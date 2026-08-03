import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import { VideoPlayer } from './VideoPlayer';

export type PostCardAuthor = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  company?: string | null;
};

export type PostCardMediaItem = { type: 'image' | 'video'; url: string };

type Props = {
  author: PostCardAuthor;
  timestamp: string;
  content: string;
  media?: PostCardMediaItem[];
  communityName?: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  isOwnPost?: boolean;
  isFollowing?: boolean;
  reposted?: boolean;
  saved?: boolean;
  onPressAuthor?: () => void;
  onPressLike?: () => void;
  onPressComment?: () => void;
  onPressShare?: () => void;
  onToggleFollow?: () => void;
  onToggleRepost?: () => void;
  onToggleSave?: () => void;
  onDelete?: () => void;
  footer?: React.ReactNode;
};

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase();
}

function AuthorAvatar({ author, size = 46 }: { author: PostCardAuthor; size?: number }) {
  return author.avatarUrl ? (
    <Image
      source={{ uri: author.avatarUrl }}
      style={{ width: size, height: size, borderRadius: 999 }}
    />
  ) : (
    <View
      className="items-center justify-center rounded-avatar border border-border bg-background-paper"
      style={{ width: size, height: size }}
    >
      <Text className="font-extrabold text-brand-primary" style={{ fontSize: size * 0.32 }}>
        {initials(author.displayName, author.email)}
      </Text>
    </View>
  );
}

function MediaGrid({ media }: { media: PostCardMediaItem[] }) {
  if (media.length === 0) return null;
  if (media.length === 1) {
    const item = media[0];
    return item.type === 'video' ? (
      <View className="mt-s">
        <VideoPlayer source={item.url} aspectRatio={4 / 3} />
      </View>
    ) : (
      <Image
        source={{ uri: item.url }}
        resizeMode="cover"
        className="mt-s aspect-[4/3] w-full rounded-card bg-background-paper"
      />
    );
  }
  return (
    <View className="mt-s flex-row flex-wrap gap-1">
      {media.map((item, index) =>
        item.type === 'video' ? (
          <View key={`${item.url}-${index}`} className="w-[49%]">
            <VideoPlayer source={item.url} aspectRatio={1} />
          </View>
        ) : (
          <Image
            key={`${item.url}-${index}`}
            source={{ uri: item.url }}
            resizeMode="cover"
            className="aspect-square w-[49%] rounded-card bg-background-paper"
          />
        ),
      )}
    </View>
  );
}

export const PostCard: React.FC<Props> = ({
  author,
  timestamp,
  content,
  media = [],
  communityName,
  likeCount,
  commentCount,
  likedByMe,
  isOwnPost,
  isFollowing,
  reposted,
  saved,
  onPressAuthor,
  onPressLike,
  onPressComment,
  onPressShare,
  onToggleFollow,
  onToggleRepost,
  onToggleSave,
  onDelete,
  footer,
}) => (
  <View className="border-b border-border px-l py-l">
    <View className="flex-row items-center">
      <Pressable onPress={onPressAuthor} className="flex-1 flex-row items-center min-w-0">
        <AuthorAvatar author={author} />
        <View className="ml-s flex-1 min-w-0">
          <View className="flex-row items-center gap-s">
            <Text
              numberOfLines={1}
              className="flex-shrink text-base font-extrabold text-text-primary"
            >
              {author.displayName || author.email.split('@')[0]}
            </Text>
            {!!author.company && (
              <View className="rounded-avatar border border-border bg-background-paper px-s py-[1px]">
                <Text numberOfLines={1} className="text-[10px] font-bold text-text-secondary">
                  {author.company}
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-[2px] text-xs text-text-muted">
            {timestamp}
            {communityName ? ` · ${communityName}` : ''}
          </Text>
        </View>
      </Pressable>

      {!isOwnPost && onToggleFollow && (
        <Pressable
          onPress={onToggleFollow}
          className={`ml-s h-8 items-center justify-center rounded-avatar border px-s ${
            isFollowing ? 'border-border bg-transparent' : 'border-brand-primary bg-brand-primary'
          }`}
        >
          <Text
            className={`text-xs font-bold ${isFollowing ? 'text-text-secondary' : 'text-background-app'}`}
          >
            {isFollowing ? 'Дагаж буй' : 'Дагах'}
          </Text>
        </Pressable>
      )}
      {isOwnPost && onDelete && (
        <Pressable accessibilityLabel="Post устгах" hitSlop={10} onPress={onDelete}>
          <Icon name="ellipsis-horizontal" size={20} color="#A7AEB0" />
        </Pressable>
      )}
    </View>

    {!!content && <Text className="mt-s text-base leading-6 text-text-primary">{content}</Text>}
    <MediaGrid media={media} />

    <View className="mt-m flex-row items-center gap-l">
      <Pressable onPress={onPressLike} className="flex-row items-center gap-1">
        <Icon
          name={likedByMe ? 'heart' : 'heart-outline'}
          size={22}
          color={likedByMe ? '#EF4444' : '#D6DBDC'}
        />
        {likeCount > 0 && (
          <Text className={`text-xs font-bold ${likedByMe ? 'text-danger' : 'text-text-muted'}`}>
            {likeCount}
          </Text>
        )}
      </Pressable>
      {onPressComment ? (
        <Pressable onPress={onPressComment} className="flex-row items-center gap-1">
          <Icon name="chatbubble-outline" size={21} color="#D6DBDC" />
          {commentCount > 0 && (
            <Text className="text-xs font-bold text-text-muted">{commentCount}</Text>
          )}
        </Pressable>
      ) : (
        <View className="flex-row items-center gap-1">
          <Icon name="chatbubble-outline" size={21} color="#D6DBDC" />
          {commentCount > 0 && (
            <Text className="text-xs font-bold text-text-muted">{commentCount}</Text>
          )}
        </View>
      )}
      {onToggleRepost && (
        <Pressable onPress={onToggleRepost}>
          <Icon name="repeat" size={22} color={reposted ? '#9AF000' : '#D6DBDC'} />
        </Pressable>
      )}
      {onPressShare && (
        <Pressable onPress={onPressShare}>
          <Icon name="arrow-redo-outline" size={22} color="#D6DBDC" />
        </Pressable>
      )}
      {onToggleSave && (
        <Pressable onPress={onToggleSave} className="ml-auto">
          <Icon
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={21}
            color={saved ? '#9AF000' : '#D6DBDC'}
          />
        </Pressable>
      )}
    </View>

    {footer}
  </View>
);
