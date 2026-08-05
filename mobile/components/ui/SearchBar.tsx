import React from 'react';
import { TextInput, View } from 'react-native';
import { Icon } from './Icon';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export const SearchBar: React.FC<Props> = ({
  value,
  onChangeText,
  placeholder = 'Хайх',
  autoCapitalize = 'none',
}) => (
  <View className="h-[50px] flex-row items-center rounded-avatar border border-border bg-background-paper px-m">
    <Icon name="search" size={18} color="#A7AEB0" />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#A7AEB0"
      autoCapitalize={autoCapitalize}
      className="ml-s h-full flex-1 text-sm text-text-primary"
    />
  </View>
);
