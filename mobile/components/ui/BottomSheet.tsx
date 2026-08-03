import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const BottomSheet: React.FC<Props> = ({ visible, onClose, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable className="flex-1 bg-black/60" onPress={onClose} />
    <SafeAreaView
      edges={['bottom']}
      className="rounded-t-sheet border-t border-border bg-background-paper"
    >
      <View className="p-m">{children}</View>
    </SafeAreaView>
  </Modal>
);
