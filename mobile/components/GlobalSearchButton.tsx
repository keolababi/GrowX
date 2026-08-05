import { router } from 'expo-router';
import { IconButton } from './ui/IconButton';

export function GlobalSearchButton() {
  return (
    <IconButton
      name="search-outline"
      accessibilityLabel="Нэгдсэн хайлт"
      variant="filled"
      color="#9AF000"
      onPress={() => router.push('/discover')}
    />
  );
}
