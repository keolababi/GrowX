import React from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

type Props = ViewProps & {
  children: React.ReactNode;
};

export const Card: React.FC<Props> = ({ children, className, ...rest }) => (
  <View
    className={`rounded-card border border-border bg-background-paper p-l ${className ?? ''}`}
    {...rest}
  >
    {children}
  </View>
);
