import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import { fetchMetroStations, fetchPandalsByMetro } from '../../services/metroService';
import { fetchTrainStations, fetchPandalsByTrain } from '../../services/trainService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function MetroScreen({ navigation, route }) {
  const initialMode = route?.params?.initialTab === 'train' ? 'train' : 'metro';
  const [activeTab, setActiveTab] = useState(initialMode); // 'train' | 'metro'
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationsList, setStationsList] = useState([]);
  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPandals, setLoadingPandals] = useState(false);

  // Fetch stations list on mount or tab change
  useEffect(() => {
    async function loadStations() {
      setLoading(true);
      try {
        const data = activeTab === 'metro' 
          ? await fetchMetroStations() 
          : await fetchTrainStations();
        setStationsList(data);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStations();
    setSelectedStation(null);
    setPandals([]);
  }, [activeTab]);

  // Fetch pandals when a station is selected
  useEffect(() => {
    async function loadPandals() {
      if (!selectedStation) {
        setPandals([]);
        return;
      }
      setLoadingPandals(true);
      try {
        const data = activeTab === 'metro'
          ? await fetchPandalsByMetro(selectedStation.name, selectedStation.line)
          : await fetchPandalsByTrain(selectedStation.name);
        setPandals(data);
      } catch (error) {
        console.error('Failed to fetch pandals for station:', error);
      } finally {
        setLoadingPandals(false);
      }
    }
    loadPandals();
  }, [selectedStation, activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Title Header */}
        <View style={styles.headerBox}>
          <Text style={styles.title}>দেবী দর্শন</Text>
          <Text style={styles.sub}>আপনার পূজা পরিক্রমার সেরা সঙ্গী</Text>
        </View>

        {/* Segmented Tabs */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'train' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('train')}
          >
            <MaterialCommunityIcons
              name="train"
              size={18}
              color={activeTab === 'train' ? colors.white : colors.espresso}
            />
            <Text style={[styles.toggleText, activeTab === 'train' && styles.toggleTextActive]}>
              Train
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'metro' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('metro')}
          >
            <MaterialCommunityIcons
              name="subway-variant"
              size={18}
              color={activeTab === 'metro' ? colors.white : colors.espresso}
            />
            <Text style={[styles.toggleText, activeTab === 'metro' && styles.toggleTextActive]}>
              Metro
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu of All Stations */}
        <View style={styles.dropdownSection}>
          <Text style={styles.dropdownLabel}>Select Station:</Text>
          {loading ? (
            <ActivityIndicator color={colors.primaryMaroon} />
          ) : (
            <SearchableDropdown
              data={stationsList}
              value={selectedStation?._id || selectedStation?.name}
              onSelect={(val) => {
                const station = stationsList.find((s) => (s._id || s.name) === val);
                setSelectedStation(station);
              }}
              placeholder={selectedStation ? selectedStation.name : 'No station selected'}
            />
          )}
        </View>

        {/* Nearest Pandals Display */}
        <View style={styles.pandalsSection}>
          <Text style={styles.sectionTitle}>
            {selectedStation
              ? `Nearest Pandals to ${selectedStation.name}`
              : 'Select a station to see nearest pandals'}
          </Text>

          {loadingPandals ? (
            <ActivityIndicator color={colors.primaryMaroon} style={{ marginVertical: 20 }} />
          ) : pandals.length > 0 ? (
            pandals.map((pandal, idx) => (
              <TouchableOpacity
                key={pandal.id || idx}
                style={styles.pandalCard}
                onPress={() => navigation.navigate('PandalDetail', { pandalId: pandal.id })}
              >
                <Text style={styles.pandalNum}>{idx + 1}.</Text>
                <View style={styles.pandalContent}>
                  <Text style={styles.pandalName}>{pandal.name}</Text>
                  <Text style={styles.pandalSub}>
                    {pandal.region || pandal.cluster} • {
                      activeTab === 'metro' 
                        ? (pandal.nearest_metro?.distance || 'Nearby')
                        : (pandal.nearest_stations?.find(s => s.name === selectedStation.name)?.distance || 'Nearby')
                    }
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primaryMaroon} />
              </TouchableOpacity>
            ))
          ) : selectedStation ? (
            <Text style={{ textAlign: 'center', marginVertical: 20, color: colors.espresso }}>
              No pandals found near this station.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.md },
  headerBox: { alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: '900', color: colors.primaryMaroon },
  sub: { fontSize: 12, fontWeight: '700', color: colors.goldMuted, marginTop: 2 },

  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardCream,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryMaroon,
  },
  toggleText: { fontSize: 13, fontWeight: '700', color: colors.espresso },
  toggleTextActive: { color: colors.white },

  dropdownSection: { marginBottom: spacing.lg },
  dropdownLabel: { fontSize: 13, fontWeight: '700', color: colors.espresso, marginBottom: 6 },

  pandalsSection: {
    backgroundColor: colors.cardCream,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.espresso, marginBottom: spacing.sm },
  pandalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldMuted,
    gap: spacing.xs,
  },
  pandalNum: { fontSize: 14, fontWeight: '900', color: colors.primaryMaroon, width: 24 },
  pandalContent: { flex: 1 },
  pandalName: { fontSize: 14, fontWeight: '800', color: colors.espresso },
  pandalSub: { fontSize: 11, color: `${colors.espresso}AA`, marginTop: 2 },
});
