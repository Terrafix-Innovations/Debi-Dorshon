import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import CollapsiblePandalsList from '../../components/common/CollapsiblePandalsList';
import SourceDestinationForm from '../../components/route/SourceDestinationForm';
import RouteMapView from '../../components/route/RouteMapView';
import CheckpointList from '../../components/route/CheckpointList';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import StationMapView from '../../components/stations/StationMapView';
import { fetchMetroStations, fetchMetroRoute, fetchPandalsByMetro } from '../../services/metroService';
import { MOCK_PANDALS } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function MetroStationsPanel() {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('m9'); // Default: Park Street
  const [loadingStations, setLoadingStations] = useState(true);
  const [nearbyPandals, setNearbyPandals] = useState([]);

  // Optional route calculation between 2 stations
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await fetchMetroStations();
        setStations(loaded);
      } catch (e) {
        setError('Could not load metro stations.');
      } finally {
        setLoadingStations(false);
      }
    })();
  }, []);

  const selectedStation = stations.find((s) => s._id === selectedStationId) || stations[0];

  useEffect(() => {
    async function loadStationPandals() {
      if (!selectedStation?.name) {
        setNearbyPandals([]);
        return;
      }
      try {
        const data = await fetchPandalsByMetro(selectedStation.name, selectedStation.line);
        setNearbyPandals(data || []);
      } catch (e) {
        setNearbyPandals([]);
      }
    }
    loadStationPandals();
  }, [selectedStation?.name]);

  const handleRouteSubmit = async (sourceId, destinationId) => {
    setLoadingRoute(true);
    setError(null);
    try {
      setRoute(await fetchMetroRoute(sourceId, destinationId));
    } catch (e) {
      setError('Could not fetch route. Please try again.');
    } finally {
      setLoadingRoute(false);
    }
  };

  if (loadingStations) return <LoadingState message="Loading metro stations..." />;

  const displayPandals = nearbyPandals;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Metro Station Selector Dropdown */}
      <View style={styles.selectorCard}>
        <Text style={styles.sectionHeaderTitle}>Select Kolkata Metro Station</Text>
        <SearchableDropdown
          label="Choose Metro Station"
          items={stations}
          value={selectedStationId}
          onSelect={setSelectedStationId}
          placeholder="Select a metro station..."
        />

        {selectedStation && (
          <View style={styles.stationInfoBox}>
            <View style={styles.stationIconWrap}>
              <MaterialCommunityIcons name="subway-variant" size={24} color={colors.primaryMaroon} />
            </View>
            <View style={styles.stationDetails}>
              <Text style={styles.stationName}>{selectedStation.name}</Text>
              <Text style={styles.stationSub}>
                {selectedStation.nameBn ? `${selectedStation.nameBn} • ` : ''}
                {selectedStation.line || 'Metro Network'}
              </Text>
              <Text style={styles.stationCoords}>
                Lat: {selectedStation.lat.toFixed(4)}°, Lng: {selectedStation.lng.toFixed(4)}°
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Dynamic Map and Pandals List around the Selected Metro Station */}
      {selectedStation && (
        <View style={styles.collapsibleSection}>
          <StationMapView
            stationName={selectedStation.name}
            stationObj={selectedStation}
            pandals={displayPandals}
            mode="metro"
          />
          <CollapsiblePandalsList
            title={`Pandals Near ${selectedStation.name}`}
            subtitle={`Pandals around ${selectedStation.name} (${selectedStation.line || 'Metro'})`}
            pandals={displayPandals}
            referenceLocation={selectedStation}
            defaultExpanded={false}
          />
        </View>
      )}

      {/* Optional Metro Route Planner Section */}
      <View style={styles.routePlannerSection}>
        <Text style={styles.routeHeaderTitle}>Metro Station-to-Station Route</Text>
        <SourceDestinationForm
          items={stations}
          sourceLabel="Source Metro Station"
          destinationLabel="Destination Metro Station"
          onSubmit={handleRouteSubmit}
          loading={loadingRoute}
        />
        {error && <EmptyState icon="alert-circle-outline" message={error} />}
        {route && (
          <View style={styles.routeResults}>
            <RouteMapView
              source={route.source}
              destination={route.destination}
              checkpoints={route.checkpoints}
              path={route.path}
            />
            <CheckpointList checkpoints={route.checkpoints} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  selectorCard: {
    backgroundColor: colors.cardCream,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.espresso,
    marginBottom: spacing.xs,
  },
  stationInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    marginTop: spacing.xs,
  },
  stationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primaryMaroon}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationDetails: { flex: 1 },
  stationName: { fontSize: 15, fontWeight: '800', color: colors.espresso },
  stationSub: { fontSize: 12, color: `${colors.espresso}AA`, marginTop: 2 },
  stationCoords: { fontSize: 11, color: `${colors.espresso}88`, marginTop: 2 },

  collapsibleSection: { marginBottom: spacing.md },

  routePlannerSection: {
    backgroundColor: colors.cardCream,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  routeHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.espresso,
    paddingHorizontal: spacing.md,
  },
  routeResults: { marginTop: spacing.sm },
});
