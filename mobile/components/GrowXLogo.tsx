import BrandLogo from '../assets/growx-logo.svg';

export function GrowXMark({ size = 72 }: { size?: number }) {
  return (
    <BrandLogo
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      accessibilityLabel="GrowX тэмдэг"
    />
  );
}

export function GrowXLogo({ compact = false }: { compact?: boolean }) {
  const width = compact ? 180 : 300;
  const height = compact ? 120 : 255;

  return (
    <BrandLogo
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      accessibilityLabel="GrowX"
    />
  );
}
