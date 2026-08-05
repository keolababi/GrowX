import BrandLogo from '../assets/growx-logo.svg';
import { View } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';

export function GrowXMark({ size = 72 }: { size?: number }) {
  const { isDark } = useColorMode();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'transparent' : '#FFFFFF',
        boxShadow: isDark ? undefined : '0 8px 24px rgba(18, 31, 25, 0.10)',
      }}
    >
      <BrandLogo
        width={isDark ? size : size * 0.88}
        height={isDark ? size : size * 0.88}
        preserveAspectRatio="xMidYMid meet"
        accessibilityLabel="GrowX тэмдэг"
        style={isDark ? undefined : ({ filter: 'grayscale(1) brightness(0.16)' } as never)}
      />
    </View>
  );
}

export function GrowXLogo({ compact = false }: { compact?: boolean }) {
  const { isDark } = useColorMode();
  const width = compact ? 180 : 300;
  const height = compact ? 120 : 255;

  return (
    <BrandLogo
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      accessibilityLabel="GrowX"
      style={isDark ? undefined : ({ filter: 'grayscale(1) brightness(0.16)' } as never)}
    />
  );
}
