import React from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput as RNTextInput } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';

type Props = Pick<
  TextInputProps,
  | 'placeholder'
  | 'value'
  | 'onChangeText'
  | 'multiline'
  | 'numberOfLines'
  | 'secureTextEntry'
  | 'keyboardType'
  | 'autoCapitalize'
  | 'editable'
>;

export const TextInput: React.FC<Props> = ({ multiline, ...rest }) => {
  const { colors } = useColorMode();

  return (
    <RNTextInput
      className={`rounded-btn border border-border bg-background-paper px-m text-base text-text-primary ${
        multiline ? 'min-h-[112px] py-m' : 'h-[50px]'
      }`}
      placeholderTextColor={colors.muted}
      cursorColor={colors.primary}
      selectionColor={colors.primary}
      style={{
        color: colors.text,
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
      multiline={multiline}
      {...rest}
    />
  );
};
