import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function CheckpointList({ checkpoints = [] }) {
  if (!checkpoints.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Major Checkpoints</Text>
      {checkpoints.map((cp, idx) => (
        <View key={cp._id || idx} style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.name}>{cp.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginTop: 12, marginBottom: 24 },
  title: { fontWeight: '700', color: colors.espresso, marginBottom: 8, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  name: { color: colors.espresso, fontSize: 13 },
});
