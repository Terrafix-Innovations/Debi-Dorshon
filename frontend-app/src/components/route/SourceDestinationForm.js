import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchableDropdown from '../common/SearchableDropdown';
import PrimaryButton from '../common/PrimaryButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

// Reused by Metro Stations, Metro Pandals, Train Stations, and Train Pandals
// panels. `items` is the option list fetched from the relevant backend
// collection; `onSubmit(sourceId, destinationId)` triggers the route fetch.
export default function SourceDestinationForm({
  items,
  sourceLabel = 'Source',
  destinationLabel = 'Destination',
  onSubmit,
  loading,
}) {
  const [sourceId, setSourceId] = useState(null);
  const [destinationId, setDestinationId] = useState(null);

  const canSubmit = sourceId && destinationId && sourceId !== destinationId;

  return (
    <View style={styles.wrap}>
      <SearchableDropdown
        label={sourceLabel}
        items={items}
        value={sourceId}
        onSelect={setSourceId}
        placeholder={`Select ${sourceLabel.toLowerCase()}`}
      />
      <SearchableDropdown
        label={destinationLabel}
        items={items}
        value={destinationId}
        onSelect={setDestinationId}
        placeholder={`Select ${destinationLabel.toLowerCase()}`}
      />
      <PrimaryButton
        label="Show Route"
        icon={<Ionicons name="navigate" size={16} color={colors.white} />}
        loading={loading}
        disabled={!canSubmit}
        onPress={() => onSubmit(sourceId, destinationId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, marginTop: spacing.md },
});
