import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
};

export const Icon: React.FC<Props> = ({ name, size = 20, color = '#FFFFFF' }) => (
  <Ionicons name={name} size={size} color={color} />
);
