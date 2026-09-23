import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { colors } from '../../theme/colors';
import { getRegionForCoordinates } from '../../utils/mapHelpers';

export default function RouteMapView({ source, destination, checkpoints = [], path = [] }) {
  const pathCoords = path.length
    ? path.map((p) => ({ latitude: p.lat, longitude: p.lng }))
    : [source, destination]
        .filter(Boolean)
        .map((p) => ({ latitude: p.lat, longitude: p.lng }));

  const region = getRegionForCoordinates(pathCoords);

  if (Platform.OS === 'web') {
    const srcName = source?.name || 'Kolkata';
    const destName = destination?.name || '';
    const query = encodeURIComponent(`${srcName} to ${destName} Kolkata`);
    const mapUrl = `https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    return (
      <View style={styles.wrap}>
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0, width: '100%', height: '100%' }}
          loading="lazy"
          title="Route Google Map"
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <MapView style={StyleSheet.absoluteFillObject} initialRegion={region}>
        {pathCoords.length > 1 && (
          <Polyline coordinates={pathCoords} strokeColor={colors.secondaryRed} strokeWidth={4} />
        )}

        {source && (
          <Marker
            coordinate={{ latitude: source.lat, longitude: source.lng }}
            title={source.name}
            description="Source"
            pinColor={colors.primaryMaroon}
          />
        )}

        {destination && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            title={destination.name}
            description="Destination"
            pinColor={colors.gold}
          />
        )}

        {checkpoints.map((cp) => (
          <Marker
            key={cp._id || `${cp.lat}-${cp.lng}`}
            coordinate={{ latitude: cp.lat, longitude: cp.lng }}
            title={cp.name}
            description="Checkpoint"
            pinColor={colors.goldHighlight}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
});
