import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

/**
 * CustomMapMarker: Distinct stylized markers for Debi-Dorshon map
 * Types:
 * - 'origin': Starting point / user location (Green/Gold 'A')
 * - 'destination': Destination point (Crimson/Gold 'B')
 * - 'pandal': Durga Puja pandal (Maroon/Gold teardrop with stop number or flower)
 * - 'metro': Metro station (Emerald transit badge)
 * - 'train': Railway station (Navy transit badge)
 */
function CustomMapMarkerComponent({
  coordinate,
  type = 'pandal',
  label = '',
  item = null,
  isSelected = false,
  onPress,
}) {
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
    return null;
  }

  const renderIcon = () => {
    switch (type) {
      case 'origin':
        return (
          <View style={[styles.pinBase, styles.originPin, isSelected && styles.selectedPin]}>
            <Text style={styles.originText}>{label || 'A'}</Text>
          </View>
        );

      case 'destination':
        return (
          <View style={[styles.pinBase, styles.destinationPin, isSelected && styles.selectedPin]}>
            <Text style={styles.destinationText}>{label || 'B'}</Text>
          </View>
        );

      case 'metro':
        return (
          <View style={[styles.pinBase, styles.metroPin, isSelected && styles.selectedPin]}>
            <MaterialCommunityIcons name="subway-variant" size={14} color={colors.white} />
          </View>
        );

      case 'train':
        return (
          <View style={[styles.pinBase, styles.trainPin, isSelected && styles.selectedPin]}>
            <MaterialCommunityIcons name="train" size={14} color={colors.white} />
          </View>
        );

      case 'pandal':
      default:
        return (
          <View style={[styles.pandalContainer, isSelected && styles.selectedContainer]}>
            <View style={[styles.pandalBadge, isSelected && styles.selectedPandalBadge]}>
              {label ? (
                <Text style={styles.pandalNumber}>{label}</Text>
              ) : (
                <Ionicons name="flower" size={12} color={colors.goldHighlight} />
              )}
            </View>
            <View style={[styles.pandalArrow, isSelected && styles.selectedPandalArrow]} />
          </View>
        );
    }
  };

  return (
    <Marker
      coordinate={coordinate}
      onPress={() => onPress && onPress(item || { coordinate, type, label })}
      tracksViewChanges={isSelected}
      anchor={type === 'pandal' ? { x: 0.5, y: 1 } : { x: 0.5, y: 0.5 }}
    >
      <View style={styles.wrapper}>
        {isSelected && <View style={styles.haloRing} />}
        {renderIcon()}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.goldHighlight}44`,
    borderWidth: 2,
    borderColor: colors.goldHighlight,
  },
  pinBase: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  selectedPin: {
    transform: [{ scale: 1.15 }],
    borderColor: colors.goldHighlight,
    borderWidth: 2.5,
  },
  originPin: {
    backgroundColor: '#1E7E34',
  },
  originText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 13,
  },
  destinationPin: {
    backgroundColor: colors.secondaryRed,
  },
  destinationText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 13,
  },
  metroPin: {
    backgroundColor: '#2E7D32',
  },
  trainPin: {
    backgroundColor: '#1565C0',
  },
  /* Pandal teardrop pin */
  pandalContainer: {
    alignItems: 'center',
  },
  selectedContainer: {
    transform: [{ scale: 1.18 }],
  },
  pandalBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryMaroon,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.goldHighlight,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  selectedPandalBadge: {
    backgroundColor: colors.espresso,
    borderColor: colors.goldHighlight,
    borderWidth: 2.5,
  },
  pandalNumber: {
    color: colors.goldHighlight,
    fontWeight: '900',
    fontSize: 13,
  },
  pandalArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primaryMaroon,
    marginTop: -1,
  },
  selectedPandalArrow: {
    borderTopColor: colors.espresso,
  },
});

export const CustomMapMarker = memo(CustomMapMarkerComponent);
