import { Image } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';

// React Native resolves static image dimensions from literal require calls.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BrandLogo = require('../assets/growx-logo.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const GrapeBrandLogo = require('../assets/growx-logo-grape.png');

export function GrowXMark({ size = 72 }: { size?: number }) {
  const { isDark } = useColorMode();
  const Mark = isDark ? BrandLogo : GrapeBrandLogo;
  return (
    <Image
      source={Mark}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="GrowX тэмдэг"
    />
  );
}

export function GrowXLogo({
  compact = false,
  appearance = 'auto',
}: {
  compact?: boolean;
  appearance?: 'auto' | 'dark' | 'light';
}) {
  const { isDark } = useColorMode();
  const onDarkBackground = appearance === 'dark' || (appearance === 'auto' && isDark);
  const width = compact ? 180 : 300;
  const height = compact ? 120 : 255;
  const Mark = onDarkBackground ? BrandLogo : GrapeBrandLogo;

  return (
    <Image
      source={Mark}
      style={{ width, height }}
      resizeMode="contain"
      accessibilityLabel="GrowX"
    />
  );
}
