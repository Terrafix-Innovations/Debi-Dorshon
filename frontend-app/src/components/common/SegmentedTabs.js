import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Simple two/three-way segmented switch, used for the Stations/Pandals
// toggle inside Metro and Train screens.
export default function SegmentedTabs({ options, activeKey, onChange }) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = opt.key === activeKey;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.cardCream,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: 4,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primaryMaroon },
  label: { color: colors.espresso, fontWeight: '600', fontSize: 13 },
  labelActive: { color: colors.white },
});
