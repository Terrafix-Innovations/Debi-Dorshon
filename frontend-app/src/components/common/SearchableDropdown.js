import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Generic searchable single-select used for every source/destination/station field.
// `items` can be [{ _id?, name, line?, pandal_count?, nameBn? }] as returned by the backend.
export default function SearchableDropdown({ label, items = [], value, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const getItemId = (item) => item._id || item.name;

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.name && i.name.toLowerCase().includes(q));
  }, [items, query]);

  const selected = useMemo(() => {
    if (!value) return null;
    return items.find((i) => getItemId(i) === value || i.name === value);
  }, [items, value]);

  const renderSubtitle = (item) => {
    if (item.line) {
      const pandalsStr = item.pandal_count !== undefined ? ` • ${item.pandal_count} Pandals` : '';
      return `${item.line} Line${pandalsStr}`;
    }
    if (item.nameBn) return item.nameBn;
    if (item.pandal_count !== undefined) return `${item.pandal_count} Pandals Nearby`;
    return null;
  };

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={selected ? styles.inputText : styles.placeholder}>
          {selected ? selected.name : placeholder || 'Select option...'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.espresso} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.espresso} />
              </Pressable>
            </View>
            <TextInput
              style={styles.search}
              placeholder="Search station or location..."
              placeholderTextColor={`${colors.espresso}77`}
              value={query}
              onChangeText={setQuery}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item, idx) => getItemId(item) || `item_${idx}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const sub = renderSubtitle(item);
                const isItemSelected = selected && getItemId(selected) === getItemId(item);
                return (
                  <Pressable
                    style={[styles.option, isItemSelected && styles.optionSelected]}
                    onPress={() => {
                      const selectedVal = getItemId(item);
                      onSelect(selectedVal);
                      setQuery('');
                      setOpen(false);
                    }}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionText, isItemSelected && styles.optionTextSelected]}>
                        {item.name}
                      </Text>
                      {sub ? <Text style={styles.optionSub}>{sub}</Text> : null}
                    </View>
                    {isItemSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primaryMaroon} />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>No options found</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.xs },
  label: { color: colors.espresso, fontWeight: '700', marginBottom: 6, fontSize: 13 },
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  inputText: { color: colors.espresso, fontSize: 15, fontWeight: '700' },
  placeholder: { color: `${colors.espresso}88`, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '75%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.espresso },
  search: {
    backgroundColor: colors.cardCream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    color: colors.espresso,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.goldMuted}55`,
    borderRadius: radius.sm,
  },
  optionSelected: {
    backgroundColor: `${colors.goldHighlight}25`,
  },
  optionContent: { flex: 1 },
  optionText: { fontSize: 15, color: colors.espresso, fontWeight: '600' },
  optionTextSelected: { fontWeight: '800', color: colors.primaryMaroon },
  optionSub: { fontSize: 12, color: `${colors.espresso}99`, marginTop: 2 },
  empty: { textAlign: 'center', color: `${colors.espresso}99`, marginVertical: spacing.lg },
});
