import { router } from 'expo-router';
import { IconButton } from './ui/IconButton';
import { useColorMode } from '@/providers/ColorModeProvider';

export function GlobalSearchButton() {
  const { iconAccent } = useColorMode();
  return (
    <IconButton
      name="search-outline"
      accessibilityLabel="Нэгдсэн хайлт"
      variant="filled"
      color={iconAccent}
      onPress={() => router.push('/discover')}
    />
  );
}
