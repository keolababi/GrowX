import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';

type Props = {
  tabs: string[];
  activeIndex: number;
  onChange: (idx: number) => void;
};

export const Tabs: React.FC<Props> = ({ tabs, activeIndex, onChange }) => {
  const { colors } = useColorMode();
  const { width } = useWindowDimensions();
  const compact = width <= 480;
  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {tabs.map((tab, i) => {
        const active = i === activeIndex;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(i)}
            style={[styles.tab, { borderBottomColor: active ? colors.primary : 'transparent' }]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { fontSize: compact ? 11 : 14, color: active ? colors.primary : colors.muted },
                active && styles.activeLabel,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', minHeight: 46, flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { width: '100%', lineHeight: 17, textAlign: 'center', fontWeight: '600' },
  activeLabel: { fontWeight: '800' },
});
