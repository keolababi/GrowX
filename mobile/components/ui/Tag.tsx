import React from 'react';
import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export const Tag: React.FC<Props> = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    className={`h-10 items-center justify-center rounded-avatar border px-m ${
      selected ? 'border-brand-primary bg-brand-primary' : 'border-border bg-background-paper'
    }`}
  >
    <Text
      style={{ textAlign: 'center', lineHeight: 20, includeFontPadding: false }}
      className={`text-center text-sm font-medium ${selected ? 'text-background-app' : 'text-text-secondary'}`}
    >
      {label}
    </Text>
  </Pressable>
);
