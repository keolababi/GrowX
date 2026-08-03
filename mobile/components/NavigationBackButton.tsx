import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export function NavigationBackButton({ fallback = '/posts' }: { fallback?: '/posts' | '/login' }) {
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
      <Text style={styles.icon}>‹</Text>
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
  icon: { color: '#F3F6F5', fontSize: 40, lineHeight: 42, fontWeight: '300' },
});
