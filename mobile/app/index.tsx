import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Loader } from '@/components/ui/Loader';
import { useAuthStore } from '@/store/authStore';
import { useColorMode } from '@/providers/ColorModeProvider';

export default function IndexScreen() {
  const { colors } = useColorMode();
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
        <Loader size={32} />
      </View>
    );
  }
  return <Redirect href={token ? '/posts' : '/onboard'} />;
}
