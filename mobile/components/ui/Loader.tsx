import { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, View, type ViewStyle } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';

export function Loader({ size = 32, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useColorMode();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const strokeWidth = Math.max(3, Math.round(size * 0.11));

  return (
    <View
      style={[{ alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Уншиж байна"
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.surfaceSoft,
          borderTopColor: colors.primary,
          transform: [{ rotate }],
        }}
      />
    </View>
  );
}
