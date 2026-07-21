import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, Logo, Screen } from '@/components/Screen';

/* eslint-disable @typescript-eslint/no-require-imports */
const rocketImage = require('../assets/onboarding-rocket.png');
const communityImage = require('../assets/onboarding-community.png');
const targetImage = require('../assets/onboarding-target.png');

const slides = [
  {
    image: rocketImage,
    title: 'Бизнесээ эхлүүлэх,\nмөрөөдлөө биелүүл.',
    body: 'Мэдлэг, туршлага, зөвлөгөө,\nхамтын сүлжээ — бүгд нэг дор.',
  },
  {
    image: communityImage,
    title: 'Туршлагатай менторуудаас\nзөвлөгөө аваарай.',
    body: 'Бизнесийн өсөлтөд хэрэгтэй бодит\nтуршлага, практик зөвлөгөөнүүд.',
  },
  {
    image: targetImage,
    title: 'Community-д нэгдэж,\nхөгжлийн боломжоо нээгээрэй.',
    body: 'Ижил зорилготой хүмүүстэй холбогдож,\nхамтдаа өсөх хөгжилцгөөе.',
  },
];

export default function Index() {
  const [splash, setSplash] = useState(true);
  const [page, setPage] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(id);
  }, []);

  if (splash)
    return (
      <Screen>
        <View style={styles.splash}>
          <View style={styles.glow} />
          <Logo />
          <Text style={styles.tagline}>Бизнесээс дараагийн{`\n`}түвшинд хүргэ.</Text>
          <View style={styles.steps}>
            <View style={styles.stepLogo}>
              <Text style={styles.stepX}>✣</Text>
            </View>
            <View style={styles.barTall} />
            <View style={styles.barMid} />
            <View style={styles.barShort} />
          </View>
          <View style={styles.progress} />
        </View>
      </Screen>
    );

  const slide = slides[page];
  return (
    <Screen>
      <Pressable style={styles.skip} onPress={() => router.replace('/login')}>
        <Text style={styles.skipText}>Алгасах</Text>
      </Pressable>
      <View style={styles.illustration}>
        <Image source={slide.image} resizeMode="contain" style={styles.image} />
      </View>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.body}>{slide.body}</Text>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.bottom}>
        <Pressable
          style={styles.button}
          onPress={() => (page < 2 ? setPage(page + 1) : router.replace('/login'))}
        >
          <Text style={styles.buttonText}>{page === 2 ? 'Эхлэх' : 'Дараах'}</Text>
          <Text style={styles.arrow}>{page === 2 ? '' : '→'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    minHeight: 690,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#092712',
    opacity: 0.7,
  },
  tagline: { color: '#FFFFFF', textAlign: 'center', fontSize: 17, lineHeight: 24, marginTop: 24 },
  steps: {
    height: 240,
    width: 250,
    marginTop: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  stepLogo: {
    position: 'absolute',
    zIndex: 2,
    left: 35,
    top: 38,
    transform: [{ rotate: '-38deg' }],
  },
  stepX: {
    color: colors.lime,
    fontSize: 64,
    fontWeight: '900',
    textShadowColor: colors.lime,
    textShadowRadius: 15,
  },
  barTall: {
    width: 66,
    height: 184,
    backgroundColor: '#152526',
    borderTopWidth: 3,
    borderTopColor: '#304044',
  },
  barMid: {
    width: 66,
    height: 130,
    backgroundColor: '#143218',
    borderTopWidth: 3,
    borderTopColor: '#3D6B25',
  },
  barShort: {
    width: 66,
    height: 75,
    backgroundColor: '#234C14',
    borderTopWidth: 3,
    borderTopColor: '#6BAF28',
  },
  progress: {
    position: 'absolute',
    bottom: 6,
    width: 82,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.lime,
  },
  skip: { alignSelf: 'flex-end', paddingVertical: 6, paddingLeft: 15, zIndex: 2 },
  skipText: { color: '#FFFFFF', fontSize: 13 },
  illustration: { height: 350, alignItems: 'center', justifyContent: 'center' },
  image: { width: '116%', height: '100%' },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 31,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  body: { color: '#B4BABC', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12 },
  dots: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 36 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#344044' },
  dotActive: { backgroundColor: colors.lime },
  bottom: { flex: 1, justifyContent: 'flex-end', minHeight: 75 },
  button: {
    height: 54,
    backgroundColor: colors.lime,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#071000', fontSize: 15, fontWeight: '800' },
  arrow: { position: 'absolute', right: 20, color: '#071000', fontSize: 24 },
});
