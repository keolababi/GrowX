import { Tabs } from 'expo-router';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: '#020617' }, headerTintColor: '#fff', tabBarStyle: { backgroundColor: '#020617' }, tabBarActiveTintColor: '#818cf8' }}><Tabs.Screen name="index" options={{ title: 'Home' }} /><Tabs.Screen name="profile" options={{ title: 'Profile' }} /></Tabs>;
}
