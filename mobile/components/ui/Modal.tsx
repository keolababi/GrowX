import React from 'react';
import { Modal as RNModal, Pressable } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const Modal: React.FC<Props> = ({ visible, onClose, children }) => (
  <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable className="flex-1 items-center justify-center bg-black/60 px-l" onPress={onClose}>
      <Pressable
        className="w-full max-w-md rounded-card border border-border bg-background-paper p-l"
        onPress={(e) => e.stopPropagation()}
      >
        {children}
      </Pressable>
    </Pressable>
  </RNModal>
);
