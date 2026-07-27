import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/services/api';

type Reel = {
  id: string;
  caption: string | null;
  videoUrl: string;
  author: {
    id: string;
    email: string;
    profile: { displayName: string | null; avatarUrl: string | null } | null;
  };
};

function ReelCard({ reel }: { reel: Reel }) {
  const player = useVideoPlayer(reel.videoUrl, (instance) => {
    instance.loop = true;
  });
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (playing) player.pause();
    else player.play();
    setPlaying((value) => !value);
  };
  return (
    <View style={styles.card}>
      <Pressable onPress={toggle} style={styles.videoWrap}>
        <VideoView player={player} style={styles.video} nativeControls contentFit="cover" />
      </Pressable>
      <Text style={styles.author}>
        {reel.author.profile?.displayName || reel.author.email.split('@')[0]}
      </Text>
      {!!reel.caption && <Text style={styles.caption}>{reel.caption}</Text>}
    </View>
  );
}

export default function ReelsScreen() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ reels: Reel[] }>('/media/reels');
      setReels(data.reels);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Reels</Text>
        <Pressable onPress={() => router.push('/posts/create')} style={styles.add}>
          <Text style={styles.addText}>＋</Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#8EE817" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.feed}>
          {reels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
          {!reels.length && <Text style={styles.empty}>Одоогоор reel алга.</Text>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020D12' },
  header: {
    height: 76,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#13242A',
  },
  back: { color: '#F4F7F6', fontSize: 42 },
  title: { color: '#F4F7F6', fontSize: 27, fontWeight: '900' },
  add: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8EE817',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#132000', fontSize: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  feed: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 18, gap: 20 },
  card: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#08171C', paddingBottom: 16 },
  videoWrap: { width: '100%', aspectRatio: 9 / 14, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  author: {
    color: '#F3F6F5',
    fontSize: 15,
    fontWeight: '900',
    marginHorizontal: 16,
    marginTop: 14,
  },
  caption: { color: '#C7D0CC', fontSize: 14, lineHeight: 20, marginHorizontal: 16, marginTop: 7 },
  empty: { color: '#84928D', textAlign: 'center', paddingTop: 80 },
});
