import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

export const SegmentedControl: React.FC<Props> = ({ options, selectedIndex, onChange }) => (
  <View className="min-h-[50px] flex-row rounded-card border border-border bg-background-paper p-1">
    {options.map((option, index) => {
      const active = index === selectedIndex;
      return (
        <Pressable
          key={option}
          onPress={() => onChange(index)}
          className={`flex-1 items-center justify-center rounded-btn px-s py-xs ${active ? 'bg-brand-primary' : ''}`}
        >
          <Text
            className={`text-center text-sm font-bold ${active ? 'text-background-app' : 'text-text-muted'}`}
          >
            {option}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
