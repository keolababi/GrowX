import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorMode } from '@/providers/ColorModeProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const BottomSheet: React.FC<Props> = ({ visible, onClose, children }) => {
  const { colors } = useColorMode();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={styles.root}>
        <Pressable
          accessibilityLabel="Хаах"
          className="bg-black/60"
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
        />
        <SafeAreaView
          edges={['bottom']}
          className="w-full rounded-t-sheet border-t border-border bg-background-paper"
          style={[styles.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
        >
          <View className="w-full max-w-[560px] self-center px-m pb-m pt-l">{children}</View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    zIndex: 1000,
  },
  backdrop: {
    zIndex: 0,
  },
  sheet: {
    position: 'relative',
    zIndex: 1,
    elevation: 24,
  },
});
