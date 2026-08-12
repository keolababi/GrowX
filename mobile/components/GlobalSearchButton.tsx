import { router } from 'expo-router';
import { IconButton } from './ui/IconButton';
import { useColorMode } from '@/providers/ColorModeProvider';

export function GlobalSearchButton({ prominent = false }: { prominent?: boolean }) {
  const { iconAccent, isDark } = useColorMode();
  return (
    <IconButton
      name="search-outline"
      accessibilityLabel="Нэгдсэн хайлт"
      variant={isDark ? 'filled' : 'plain'}
      color={iconAccent}
      size={prominent ? 23 : 20}
      onPress={() => router.push('/discover')}
    />
  );
}
