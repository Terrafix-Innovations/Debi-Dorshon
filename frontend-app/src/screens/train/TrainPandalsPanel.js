import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import SourceDestinationForm from '../../components/route/SourceDestinationForm';
import RouteMapView from '../../components/route/RouteMapView';
import CheckpointList from '../../components/route/CheckpointList';
import CollapsiblePandalsList from '../../components/common/CollapsiblePandalsList';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { fetchPandals, fetchPandalRoute } from '../../services/pandalService';
import { MOCK_PANDALS } from '../../data/mockData';
import { spacing } from '../../theme/spacing';

export default function TrainPandalsPanel() {
  const [pandals, setPandals] = useState([]);
  const [loadingPandals, setLoadingPandals] = useState(true);
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setPandals(await fetchPandals());
      } catch (e) {
        setError('Could not load pandals.');
      } finally {
        setLoadingPandals(false);
      }
    })();
  }, []);

  const handleSubmit = async (sourceId, destinationId) => {
    setLoadingRoute(true);
    setError(null);
    try {
      setRoute(await fetchPandalRoute(sourceId, destinationId, 'train'));
    } catch (e) {
      setError('Could not fetch route. Please try again.');
    } finally {
      setLoadingRoute(false);
    }
  };

  if (loadingPandals) return <LoadingState message="Loading pandals..." />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SourceDestinationForm
        items={pandals}
        sourceLabel="Source Pandal"
        destinationLabel="Destination Pandal"
        onSubmit={handleSubmit}
        loading={loadingRoute}
      />
      {error && <EmptyState icon="alert-circle-outline" message={error} />}
      {route && (
        <View style={styles.resultsContainer}>
          <RouteMapView
            source={route.source}
            destination={route.destination}
            checkpoints={route.checkpoints}
            path={route.path}
          />
          <CheckpointList checkpoints={route.checkpoints} />
        </View>
      )}

      <View style={styles.collapsibleWrap}>
        <CollapsiblePandalsList
          title="Durga Puja Pandals"
          subtitle="Top pandals reachable via Kolkata Suburban Railway"
          pandals={MOCK_PANDALS}
          referenceLocation={route?.source}
          defaultExpanded={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.sm },
  resultsContainer: { marginTop: spacing.sm },
  collapsibleWrap: { marginTop: spacing.md, marginBottom: spacing.xl },
});
