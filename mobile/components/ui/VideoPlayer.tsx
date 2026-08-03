import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Icon } from './Icon';

type Props = {
  source: string;
  loop?: boolean;
  autoPlay?: boolean;
  aspectRatio?: number;
};

export const VideoPlayer: React.FC<Props> = ({
  source,
  loop = true,
  autoPlay = false,
  aspectRatio = 16 / 9,
}) => {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = loop;
    if (autoPlay) instance.play();
  });
  const [playing, setPlaying] = useState(autoPlay);

  const toggle = () => {
    if (playing) player.pause();
    else player.play();
    setPlaying((value) => !value);
  };

  return (
    <Pressable
      onPress={toggle}
      className="w-full overflow-hidden rounded-card bg-background-paper"
      style={{ aspectRatio }}
    >
      <VideoView player={player} style={{ flex: 1 }} nativeControls={false} contentFit="cover" />
      {!playing && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <Icon name="play" size={40} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
};
