import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.primaryMaroon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 10, color: colors.espresso, fontSize: 13 },
});
