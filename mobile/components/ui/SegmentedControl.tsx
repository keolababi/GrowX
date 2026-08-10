import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

export const SegmentedControl: React.FC<Props> = ({ options, selectedIndex, onChange }) => (
  <View className="flex-row rounded-btn border border-border bg-background-paper p-1">
    {options.map((option, index) => {
      const active = index === selectedIndex;
      return (
        <Pressable
          key={option}
          onPress={() => onChange(index)}
          className={`flex-1 items-center justify-center rounded-[11px] px-s py-s ${active ? 'bg-brand-primary' : ''}`}
        >
          <Text
            className={`text-center text-base font-bold ${active ? 'text-background-app' : 'text-text-primary'}`}
          >
            {option}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
