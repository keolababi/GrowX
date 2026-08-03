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
    className={`rounded-avatar border px-m py-xs ${
      selected ? 'border-brand-primary bg-brand-primary' : 'border-border bg-background-paper'
    }`}
  >
    <Text
      className={`text-sm font-medium ${selected ? 'text-background-app' : 'text-text-secondary'}`}
    >
      {label}
    </Text>
  </Pressable>
);
