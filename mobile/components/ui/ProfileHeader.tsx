import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Text, View } from 'react-native';
import { Avatar } from './Avatar';

type Props = {
  name: string;
  bio?: string;
  avatarSource?: ImageSourcePropType;
  stats?: { label: string; value: string | number }[];
};

export const ProfileHeader: React.FC<Props> = ({ name, bio, avatarSource, stats }) => (
  <View className="items-center gap-s rounded-card border border-border bg-background-paper p-l">
    <Avatar source={avatarSource} size={72} />
    <View className="items-center gap-1">
      <Text className="text-lg font-bold text-text-primary">{name}</Text>
      {!!bio && <Text className="text-center text-sm text-text-muted">{bio}</Text>}
    </View>

    {!!stats?.length && (
      <View className="flex-row gap-l pt-s">
        {stats.map((stat) => (
          <View key={stat.label} className="items-center">
            <Text className="text-base font-bold text-text-primary">{stat.value}</Text>
            <Text className="text-xs text-text-muted">{stat.label}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);
