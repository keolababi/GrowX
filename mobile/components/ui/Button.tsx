import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  disabled?: boolean;
  loading?: boolean;
};

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  md: 'min-h-[48px] py-s px-l',
  sm: 'min-h-[40px] py-xs px-m',
};

const textSizeClasses: Record<NonNullable<Props['size']>, string> = {
  md: 'text-base',
  sm: 'text-sm',
};

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-brand-primary border-brand-primary',
  secondary: 'bg-background-paper border-border',
  ghost: 'bg-transparent border-transparent',
};

const variantTextClasses: Record<NonNullable<Props['variant']>, string> = {
  primary: 'text-background-app',
  secondary: 'text-brand-primary',
  ghost: 'text-brand-primary',
};

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
}) => {
  const { colors, iconAccent } = useColorMode();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center rounded-btn border ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.ink : iconAccent} />
      ) : (
        <Text className={`font-bold ${variantTextClasses[variant]} ${textSizeClasses[size]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};
