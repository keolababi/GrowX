import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  tabs: string[];
  activeIndex: number;
  onChange: (idx: number) => void;
};

export const Tabs: React.FC<Props> = ({ tabs, activeIndex, onChange }) => (
  <View className="min-h-[48px] flex-row border-b border-border">
    {tabs.map((tab, i) => {
      const active = i === activeIndex;
      return (
        <Pressable
          key={tab}
          onPress={() => onChange(i)}
          className={`flex-1 items-center justify-center border-b-2 px-xs py-s ${active ? 'border-brand-primary' : 'border-transparent'}`}
        >
          <Text
            className={`text-center text-sm ${active ? 'font-bold text-brand-primary' : 'font-semibold text-text-muted'}`}
          >
            {tab}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
