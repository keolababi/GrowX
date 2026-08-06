import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useColorMode } from '@/providers/ColorModeProvider';

export default function IndexScreen() {
  const { colors, iconAccent } = useColorMode();
  const token = useAuthStore((state) => state.token);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  if (isHydrating) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={iconAccent} />
      </View>
    );
  }
  return <Redirect href={token ? '/posts' : '/onboard'} />;
}
