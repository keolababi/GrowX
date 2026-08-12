import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';
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
  color,
  variant = 'plain',
  accessibilityLabel,
}) => {
  const { colors } = useColorMode();
  const iconColor = color ?? (variant === 'primary' ? colors.ink : colors.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'filled' && {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceRaised,
        },
        variant === 'primary' && { backgroundColor: colors.primary },
      ]}
    >
      <Icon name={name} size={size} color={iconColor} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.68 },
});
