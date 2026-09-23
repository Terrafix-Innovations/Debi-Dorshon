import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function EmptyState({ message = 'Nothing to show yet', icon = 'flower-outline' }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={36} color={colors.goldMuted} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 10, color: `${colors.espresso}99`, fontSize: 13, textAlign: 'center' },
});
