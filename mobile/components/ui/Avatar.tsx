import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, View } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from './Icon';

type Props = {
  source?: ImageSourcePropType;
  size?: number;
};

export const Avatar: React.FC<Props> = ({ source, size = 40 }) => {
  const { colors } = useColorMode();
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-avatar bg-background-paper border border-border"
      style={{ width: size, height: size }}
    >
      {source ? (
        <Image source={source} style={{ width: size, height: size }} />
      ) : (
        <Icon name="person-outline" size={size * 0.55} color={colors.muted} />
      )}
    </View>
  );
};
