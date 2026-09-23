import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function PrimaryButton({ label, onPress, loading, disabled, icon }) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={{ opacity: disabled ? 0.6 : 1 }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  label: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
