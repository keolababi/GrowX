import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorMode } from '@/providers/ColorModeProvider';

type Props = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

export const SegmentedControl: React.FC<Props> = ({ options, selectedIndex, onChange }) => {
  const { colors } = useColorMode();
  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {options.map((option, index) => {
        const active = index === selectedIndex;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(index)}
            style={[styles.option, active && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.label, { color: active ? colors.ink : colors.text }]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 50,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
  },
  option: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { width: '100%', textAlign: 'center', fontSize: 14, lineHeight: 18, fontWeight: '700' },
});
