import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Platform, Text } from 'react-native';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
};

const WEB_FONT_FAMILY = 'growx-ionicons';

if (Platform.OS === 'web' && typeof globalThis.document !== 'undefined') {
  const styleId = 'growx-ionicons-font';
  if (!globalThis.document.getElementById(styleId)) {
    const fontModule = Object.values(Ionicons.font)[0];
    const fontUri = Asset.fromModule(fontModule).uri;
    const style = globalThis.document.createElement('style');
    style.id = styleId;
    style.textContent = `@font-face { font-family: '${WEB_FONT_FAMILY}'; src: url('${fontUri}') format('truetype'); font-style: normal; font-weight: normal; font-display: block; }`;
    globalThis.document.head.appendChild(style);
  }
}

export const Icon: React.FC<Props> = ({ name, size = 20, color = '#FFFFFF' }) => {
  if (Platform.OS === 'web') {
    const codePoint = Ionicons.glyphMap[name];
    const glyph = typeof codePoint === 'number' ? String.fromCodePoint(codePoint) : codePoint;
    return (
      <Text
        aria-hidden
        style={{
          color,
          fontFamily: WEB_FONT_FAMILY,
          fontSize: size,
          fontStyle: 'normal',
          fontWeight: 'normal',
          lineHeight: size * 1.1,
          textAlign: 'center',
        }}
      >
        {glyph}
      </Text>
    );
  }
  return <Ionicons name={name} size={size} color={color} />;
};
