import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from './Icon';

type Props = {
  name: React.ComponentProps<typeof Icon>['name'];
  onPress?: () => void;
  size?: number;
  color?: string;
  variant?: 'plain' | 'filled' | 'primary';
  accessibilityLabel: string;
};

export const IconButton: React.FC<Props> = ({
  name,
  onPress,
  size = 20,
  color = '#FFFFFF',
  variant = 'plain',
  accessibilityLabel,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    className={`h-[42px] w-[42px] items-center justify-center rounded-avatar active:opacity-70 ${
      variant === 'filled'
        ? 'border border-border bg-background-raised'
        : variant === 'primary'
          ? 'bg-brand-primary'
          : ''
    }`}
  >
    <Icon name={name} size={size} color={color} />
  </Pressable>
);
