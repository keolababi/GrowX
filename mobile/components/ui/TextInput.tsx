import React from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput as RNTextInput } from 'react-native';

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

export const TextInput: React.FC<Props> = ({ multiline, ...rest }) => (
  <RNTextInput
    className={`rounded-card border border-border bg-background-paper px-m text-base text-text-primary ${
      multiline ? 'py-s' : 'h-11'
    }`}
    placeholderTextColor="#A7AEB0"
    multiline={multiline}
    {...rest}
  />
);
