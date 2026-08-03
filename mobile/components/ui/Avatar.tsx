import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, View } from 'react-native';
import { Icon } from './Icon';

type Props = {
  source?: ImageSourcePropType;
  size?: number;
};

export const Avatar: React.FC<Props> = ({ source, size = 40 }) => (
  <View
    className="items-center justify-center overflow-hidden rounded-avatar bg-background-paper border border-border"
    style={{ width: size, height: size }}
  >
    {source ? (
      <Image source={source} style={{ width: size, height: size }} />
    ) : (
      <Icon name="person" size={size * 0.55} color="#A7AEB0" />
    )}
  </View>
);
