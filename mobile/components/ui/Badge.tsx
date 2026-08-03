import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  label: string;
  variant?: 'brand' | 'muted' | 'success' | 'danger';
};

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  brand: 'bg-brand-primary',
  muted: 'bg-background-paper border border-border',
  success: 'bg-success',
  danger: 'bg-danger',
};

const variantTextClasses: Record<NonNullable<Props['variant']>, string> = {
  brand: 'text-background-app',
  muted: 'text-text-secondary',
  success: 'text-background-app',
  danger: 'text-text-primary',
};

export const Badge: React.FC<Props> = ({ label, variant = 'brand' }) => (
  <View className={`self-start rounded-avatar px-s py-[2px] ${variantClasses[variant]}`}>
    <Text className={`text-xs font-bold ${variantTextClasses[variant]}`}>{label}</Text>
  </View>
);
