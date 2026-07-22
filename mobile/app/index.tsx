import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function IndexScreen() {
  const token = useAuthStore((state) => state.token);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  if (isHydrating) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#020B0D',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#8EE817" />
      </View>
    );
  }
  return <Redirect href={token ? '/home' : '/login'} />;
}
