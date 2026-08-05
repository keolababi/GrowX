import type { ViewStyle } from 'react-native';

export const design = {
  colors: {
    background: '#020B0D',
    surface: '#081713',
    surfaceRaised: '#0D1D19',
    surfaceSoft: '#10251E',
    border: '#233D34',
    borderStrong: '#315447',
    primary: '#9AF000',
    primaryPressed: '#82CC00',
    ink: '#0B1605',
    text: '#F4F8F6',
    textSecondary: '#D6DFDB',
    muted: '#899790',
    danger: '#EF555D',
  },
  radius: {
    control: 14,
    card: 20,
    hero: 24,
    pill: 999,
  },
  layout: {
    maxWidth: 900,
    feedWidth: 680,
    chatWidth: 780,
    pagePadding: 20,
    headerHeight: 68,
  },
} as const;

export const centeredPage: ViewStyle = {
  width: '100%',
  maxWidth: design.layout.maxWidth,
  alignSelf: 'center',
};
