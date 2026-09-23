import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function TripStopCard({ stop, index, isFirst, isLast, onMoveUp, onMoveDown, onRemove }) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{index + 1}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{stop.name}</Text>
        <Text style={styles.type}>{stop.type.replace('_', ' ')}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onMoveUp} disabled={isFirst} style={{ opacity: isFirst ? 0.3 : 1 }}>
          <Ionicons name="chevron-up-circle" size={22} color={colors.primaryMaroon} />
        </Pressable>
        <Pressable onPress={onMoveDown} disabled={isLast} style={{ opacity: isLast ? 0.3 : 1 }}>
          <Ionicons name="chevron-down-circle" size={22} color={colors.primaryMaroon} />
        </Pressable>
        <Pressable onPress={onRemove}>
          <Ionicons name="trash" size={20} color={colors.secondaryRed} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  badge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryMaroon, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  info: { flex: 1 },
  name: { color: colors.espresso, fontWeight: '700', fontSize: 14 },
  type: { color: `${colors.espresso}99`, fontSize: 11, textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
});
