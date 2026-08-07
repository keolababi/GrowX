import BrandLogo from '../assets/growx-logo.svg';
import GrapeBrandLogo from '../assets/growx-logo-grape.svg';
import { useColorMode } from '@/providers/ColorModeProvider';

export function GrowXMark({ size = 72 }: { size?: number }) {
  const { isDark } = useColorMode();
  const Mark = isDark ? BrandLogo : GrapeBrandLogo;
  return (
    <Mark
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
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
    <Mark
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      accessibilityLabel="GrowX"
    />
  );
}
