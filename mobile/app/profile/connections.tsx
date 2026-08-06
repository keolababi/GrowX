import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { useUser } from '@/providers/UserProvider';
import type { SocialConnection } from '@/types/social';
import { getApiError } from '@/utils/auth';
import { useColorMode } from '@/providers/ColorModeProvider';

type Tab = 'followers' | 'following';
const lime = '#9AF000';

export default function ConnectionsScreen() {
  const { iconAccent, colors } = useColorMode();
  const params = useLocalSearchParams<{ userId?: string; tab?: string }>();
  const { user } = useUser();
  const userId = params.userId || user?.id;
  const [tab, setTab] = useState<Tab>(params.tab === 'following' ? 'following' : 'followers');
  const [users, setUsers] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ users: SocialConnection[] }>(`/users/${userId}/${tab}`);
      setUsers(data.users);
      setError('');
    } catch (value) {
      setError(getApiError(value, 'Жагсаалтыг авч чадсангүй.'));
    } finally {
      setLoading(false);
    }
  }, [tab, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async (target: SocialConnection) => {
    if (target.id === user?.id) return;
    setUsers((items) =>
      items.map((item) =>
        item.id === target.id ? { ...item, isFollowing: !item.isFollowing } : item,
      ),
    );
    try {
      const { data } = await api.post<{ following: boolean }>(`/users/${target.id}/follow`);
      setUsers((items) =>
        items.map((item) =>
          item.id === target.id ? { ...item, isFollowing: data.following } : item,
        ),
      );
    } catch {
      void load();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.back, { color: colors.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Холбоосууд</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('followers')}
          style={[
            styles.tab,
            { backgroundColor: colors.surfaceRaised },
            tab === 'followers' && [styles.activeTab, { backgroundColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textSecondary },
              tab === 'followers' && [styles.activeTabText, { color: colors.ink }],
            ]}
          >
            Дагагч
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('following')}
          style={[
            styles.tab,
            { backgroundColor: colors.surfaceRaised },
            tab === 'following' && [styles.activeTab, { backgroundColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textSecondary },
              tab === 'following' && [styles.activeTabText, { color: colors.ink }],
            ]}
          >
            Дагадаг
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={iconAccent} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {users.map((item) => {
            const name = item.displayName || item.email.split('@')[0];
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/users/${item.id}` as Href)}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.surfaceSoft }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.copy}>
                  <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
                  <Text numberOfLines={1} style={[styles.bio, { color: colors.muted }]}>
                    {item.bio || item.company || item.email}
                  </Text>
                </View>
                {item.id !== user?.id && (
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      void toggleFollow(item);
                    }}
                    style={[
                      styles.followButton,
                      item.isFollowing
                        ? [
                            styles.followingButton,
                            {
                              backgroundColor: colors.surfaceRaised,
                              borderColor: colors.borderStrong,
                            },
                          ]
                        : { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.followText,
                        { color: item.isFollowing ? colors.textSecondary : colors.ink },
                      ]}
                    >
                      {item.isFollowing ? 'Дагаж буй' : 'Дагах'}
                    </Text>
                  </Pressable>
                )}
              </Pressable>
            );
          })}
          {!users.length && !error && (
            <Text style={[styles.empty, { color: colors.muted }]}>
              {tab === 'followers' ? 'Одоогоор дагагч алга.' : 'Одоогоор хүн дагаагүй байна.'}
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020B0D' },
  header: {
    height: 66,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#173029',
  },
  backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  back: { color: '#F2F6F4', fontSize: 38, lineHeight: 40 },
  title: { flex: 1, color: '#F4F7F6', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  headerSpacer: { width: 46 },
  tabs: {
    paddingHorizontal: 18,
    paddingTop: 13,
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1917',
  },
  activeTab: { backgroundColor: lime },
  tabText: { color: '#A1ACA7', fontSize: 13, fontWeight: '800' },
  activeTabText: { color: '#142000' },
  loader: { marginTop: 60 },
  scroll: { flex: 1 },
  list: { padding: 15, paddingBottom: 40 },
  error: { color: '#FF7777', padding: 12 },
  row: {
    minHeight: 76,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#142824',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173126',
  },
  avatarText: { color: lime, fontSize: 18, fontWeight: '900' },
  copy: { flex: 1, minWidth: 0, marginLeft: 12 },
  name: { color: '#EFF4F1', fontSize: 14, fontWeight: '800' },
  bio: { color: '#7D8A84', fontSize: 11, marginTop: 5 },
  followButton: {
    minWidth: 76,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lime,
  },
  followingButton: { backgroundColor: '#12251F', borderWidth: 1, borderColor: '#42574E' },
  followText: { color: '#142000', fontSize: 11, fontWeight: '900' },
  followingButtonText: { color: '#DCE5E1' },
  empty: { color: '#7D8A84', textAlign: 'center', paddingTop: 70 },
});
