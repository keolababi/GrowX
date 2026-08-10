import React from 'react';
import { TextInput, View } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from './Icon';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
};

export const SearchBar: React.FC<Props> = ({
  value,
  onChangeText,
  placeholder = 'Хайх',
  autoCapitalize = 'none',
  autoFocus = false,
  onSubmitEditing,
}) => {
  const { colors } = useColorMode();
  return (
    <View className="h-[50px] flex-row items-center rounded-avatar border border-border bg-background-paper px-m">
      <Icon name="search-outline" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        cursorColor={colors.primary}
        selectionColor={colors.primary}
        style={{ color: colors.text }}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        className="ml-s h-full flex-1 text-sm text-text-primary"
      />
    </View>
  );
};
