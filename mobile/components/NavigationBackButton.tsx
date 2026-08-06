import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';
import { Icon } from './ui/Icon';

export function NavigationBackButton({ fallback = '/posts' }: { fallback?: '/posts' | '/login' }) {
  const { colors } = useColorMode();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Буцах"
      hitSlop={10}
      onPress={goBack}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="chevron-back" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.55 },
});
