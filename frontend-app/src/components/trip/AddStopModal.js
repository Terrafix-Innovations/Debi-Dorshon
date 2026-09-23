import React, { useEffect, useState } from 'react';
import { Modal, View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import { fetchPandals } from '../../services/pandalService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { STOP_TYPES } from '../../utils/constants';

// Lets the user pick a pandal (from MongoDB via pandalService) to append
// to the current Parikrama itinerary.
export default function AddStopModal({ visible, onClose, onAdd }) {
  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    fetchPandals()
      .then(setPandals)
      .catch(() => setError('Could not load pandals.'))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add a Pandal Stop</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.espresso} />
            </Pressable>
          </View>

          {loading && <LoadingState message="Loading pandals..." />}
          {error && <EmptyState icon="alert-circle-outline" message={error} />}

          {!loading && !error && (
            <FlatList
              data={pandals}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={<EmptyState message="No pandals found." />}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onAdd({
                      id: `${item._id}-${Date.now()}`,
                      refId: item._id,
                      type: STOP_TYPES.PANDAL,
                      name: item.name,
                      lat: item.lat,
                      lng: item.lng,
                    });
                    onClose();
                  }}
                >
                  <Text style={styles.optionText}>{item.name}</Text>
                  <Ionicons name="add-circle-outline" size={20} color={colors.primaryMaroon} />
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '75%',
    padding: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: 16, fontWeight: '700', color: colors.espresso },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.goldMuted}55`,
  },
  optionText: { color: colors.espresso, fontSize: 14, fontWeight: '600' },
});
