import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { Loader } from '@/components/ui/Loader';
import { useColorMode } from '@/providers/ColorModeProvider';
import { api } from '@/services/api';
import { getApiError } from '@/utils/auth';

export type EngagementUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  company?: string | null;
};

export function EngagementUsersSheet({
  visible,
  onClose,
  endpoint,
  title = 'Like дарсан хүмүүс',
}: {
  visible: boolean;
  onClose: () => void;
  endpoint: string;
  title?: string;
}) {
  const { colors } = useColorMode();
  const [users, setUsers] = useState<EngagementUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<{ users: EngagementUser[] }>(endpoint);
      setUsers(data.users);
    } catch (value) {
      setError(getApiError(value, 'Like дарсан хүмүүсийг авч чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (visible) void load();
  }, [load, visible]);

  const openUser = (userId: string) => {
    onClose();
    router.push(`/users/${userId}`);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="mb-m flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-extrabold text-text-primary">{title}</Text>
          {!loading && !error && (
            <Text className="mt-1 text-xs text-text-muted">{users.length} хүн</Text>
          )}
        </View>
        <Pressable
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-avatar bg-background-soft"
        >
          <Icon name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {loading ? (
        <View className="h-40 items-center justify-center">
          <Loader size={30} />
        </View>
      ) : error ? (
        <View className="h-40 items-center justify-center px-l">
          <Text className="text-center text-sm text-danger">{error}</Text>
          <Pressable
            onPress={() => void load()}
            className="mt-m rounded-btn bg-brand-primary px-m py-s"
          >
            <Text className="text-xs font-extrabold text-background-app">Дахин оролдох</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 430 }} showsVerticalScrollIndicator={false}>
          {users.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => openUser(user.id)}
              className="mb-xs flex-row items-center rounded-btn p-s active:bg-background-soft"
            >
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} className="h-11 w-11 rounded-avatar" />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-avatar bg-background-soft">
                  <Text className="text-base font-extrabold text-brand-primary">
                    {(user.displayName || user.email).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="ml-s min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-extrabold text-text-primary">
                  {user.displayName || user.email.split('@')[0]}
                </Text>
                <Text numberOfLines={1} className="mt-1 text-xs text-text-muted">
                  {user.company || user.email}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
          {!users.length && (
            <View className="h-40 items-center justify-center">
              <Icon name="heart-outline" size={30} color={colors.muted} />
              <Text className="mt-s text-sm text-text-muted">Одоогоор like алга</Text>
            </View>
          )}
        </ScrollView>
      )}
    </BottomSheet>
  );
}
