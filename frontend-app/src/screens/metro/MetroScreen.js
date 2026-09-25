import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import { fetchMetroStations, fetchPandalsByMetro } from '../../services/metroService';
import { fetchTrainStations, fetchPandalsByTrain } from '../../services/trainService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function MetroScreen({ navigation, route }) {
  const initialMode = route?.params?.initialTab === 'train' ? 'train' : 'metro';
  const [activeTab, setActiveTab] = useState(initialMode); // 'train' | 'metro'
  const [selectedStation, setSelectedStation] = useState(null); // empty initially
  const [stationsList, setStationsList] = useState([]);
  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPandals, setLoadingPandals] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // empty initially
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch stations on tab change without auto-selecting any station
  useEffect(() => {
    async function loadStations() {
      setLoading(true);
      try {
        const data = activeTab === 'metro'
          ? await fetchMetroStations()
          : await fetchTrainStations();
        const validList = Array.isArray(data) ? data : [];
        setStationsList(validList);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      } finally {
        setLoading(false);
      }
    }

    // Reset to clean empty initial state
    setSelectedStation(null);
    setSearchQuery('');
    setPandals([]);
    setIsDropdownOpen(false);

    loadStations();
  }, [activeTab]);

  // Fetch pandals ONLY when a station is selected
  useEffect(() => {
    async function loadPandals() {
      if (!selectedStation) {
        setPandals([]);
        return;
      }
      setLoadingPandals(true);
      try {
        const stationName = typeof selectedStation === 'string'
          ? selectedStation
          : (selectedStation?.name || selectedStation?._id);
        const stationLine = typeof selectedStation === 'object'
          ? selectedStation?.line
          : null;

        const data = activeTab === 'metro'
          ? await fetchPandalsByMetro(stationName, stationLine)
          : await fetchPandalsByTrain(stationName);
        setPandals(data || []);
      } catch (error) {
        console.error('Failed to fetch pandals for station:', error);
        setPandals([]);
      } finally {
        setLoadingPandals(false);
      }
    }
    loadPandals();
  }, [selectedStation, activeTab]);

  const selectedStationName = typeof selectedStation === 'string'
    ? selectedStation
    : selectedStation?.name;

  // Filtered station suggestions for autocomplete as user types
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stationsList;
    return stationsList.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [stationsList, searchQuery]);

  const handleSelect = (station) => {
    setSelectedStation(station);
    setSearchQuery(station.name || '');
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    setSelectedStation(null);
    setSearchQuery('');
    setPandals([]);
    setIsDropdownOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ImageBackground
        source={require('../../../assets/kolkata_vintage_map.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.frostedBackdrop} />

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          scrollEnabled={!isDropdownOpen}
        >
          {/* 1. Metro / Train Segmented Bar */}
          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.toggleBtn, activeTab === 'metro' && styles.toggleBtnActive]}
              onPress={() => setActiveTab('metro')}
            >
              <Text style={styles.toggleEmoji}>🚇</Text>
              <Text style={[styles.toggleText, activeTab === 'metro' && styles.toggleTextActive]}>
                Metro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.toggleBtn, activeTab === 'train' && styles.toggleBtnActive]}
              onPress={() => setActiveTab('train')}
            >
              <Text style={styles.toggleEmoji}>🚆</Text>
              <Text style={[styles.toggleText, activeTab === 'train' && styles.toggleTextActive]}>
                Train
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. Responsive Search Bar with Dropdown (Where Is My Train style) */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Text style={styles.inputPrefixEmoji}>
                {activeTab === 'metro' ? '🚇' : '🚆'}
              </Text>
              <TextInput
                style={styles.input}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  if (stationsList.length > 0) setIsDropdownOpen(true);
                }}
                placeholder={`Enter ${activeTab === 'metro' ? 'Metro' : 'Train'} station...`}
                placeholderTextColor="#9C7E6B"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="#9C7E6B" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Suggestions Dropdown below input */}
            {isDropdownOpen && (
              <View style={styles.dropdownCard}>
                <ScrollView
                  style={styles.dropdownScroll}
                  contentContainerStyle={styles.dropdownScrollContent}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  keyboardDismissMode="on-drag"
                  bounces={true}
                >
                  {loading ? (
                    <View style={styles.dropdownEmpty}>
                      <ActivityIndicator size="small" color={colors.primaryMaroon} />
                      <Text style={styles.dropdownEmptyText}>Loading stations...</Text>
                    </View>
                  ) : suggestions.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>No stations found</Text>
                    </View>
                  ) : (
                    suggestions.map((st) => (
                      <TouchableOpacity
                        key={st.name || st._id}
                        style={styles.dropdownItem}
                        onPress={() => handleSelect(st)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dropdownItemTitle}>{st.name}</Text>
                          {st.line ? (
                            <Text style={styles.dropdownItemSub}>
                              {st.line.toLowerCase().includes('line') ? st.line : `${st.line} Line`}
                            </Text>
                          ) : st.division ? (
                            <Text style={styles.dropdownItemSub}>{st.division}</Text>
                          ) : null}
                        </View>
                        {st.pandal_count !== undefined && (
                          <View style={styles.dropdownCountBadge}>
                            <Text style={styles.dropdownCountText}>{st.pandal_count} Pandals</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 3. Connected Pandals List Area */}
          {selectedStation ? (
            <View style={styles.pandalsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  Pandals near {selectedStationName}
                </Text>
                <Text style={styles.pandalCountBadge}>
                  {loadingPandals ? '...' : `${pandals.length} Pandals`}
                </Text>
              </View>

              {loadingPandals ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={colors.primaryMaroon} />
                  <Text style={styles.loadingText}>Loading connected pandals...</Text>
                </View>
              ) : pandals.length > 0 ? (
                pandals.map((pandal, idx) => {
                  const distanceStr = activeTab === 'metro'
                    ? (pandal.nearest_metro?.distance || 'Nearby')
                    : (pandal.nearest_stations?.[0]?.distance || 'Nearby');

                  return (
                    <View key={pandal.id || pandal._id || idx} style={styles.pandalCard}>
                      <View style={styles.pandalNumberCircle}>
                        <Text style={styles.pandalNumberText}>{idx + 1}</Text>
                      </View>

                      <View style={styles.pandalInfo}>
                        <Text style={styles.pandalName} numberOfLines={1}>
                          {pandal.name}
                        </Text>
                        <View style={styles.pandalSubRow}>
                          {pandal.cluster ? (
                            <Text style={styles.pandalClusterText} numberOfLines={1}>
                              {pandal.cluster}
                            </Text>
                          ) : null}
                          <Text style={styles.pandalDistanceText}>🚶 {distanceStr}</Text>
                        </View>
                      </View>

                      {/* Clean Route Button: ">" that redirects to navigation */}
                      <TouchableOpacity
                        style={styles.routeBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          navigation.navigate('Navigation', {
                            targetPandal: pandal,
                            sourceStation: selectedStation,
                          });
                        }}
                      >
                        <Text style={styles.routeBtnText}>&gt;</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    No pandals cataloged near this station yet.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.emptyPromptBox}
              onPress={() => setIsDropdownOpen(false)}
            >
              <Text style={styles.emptyPromptText}>
                Search or select a station above to view nearby pandals
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF8EE',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.16,
    resizeMode: 'cover',
  },
  frostedBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(253, 248, 238, 0.90)',
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  /* Segmented Toggle */
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    marginBottom: spacing.md,
    gap: 6,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryMaroon,
    shadowColor: colors.primaryMaroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleEmoji: {
    fontSize: 16,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#564338',
  },
  toggleTextActive: {
    color: colors.white,
  },

  /* Search Bar & Dropdown */
  searchContainer: {
    position: 'relative',
    zIndex: 50,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    paddingHorizontal: 12,
    height: 48,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputPrefixEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1C1A',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  dropdownCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    marginTop: 6,
    maxHeight: 360,
    overflow: 'hidden',
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 360,
  },
  dropdownScrollContent: {
    flexGrow: 1,
  },
  dropdownEmpty: {
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#8C674B',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7D7',
  },
  dropdownItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1B1C1A',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#8C674B',
    marginTop: 1,
  },
  dropdownCountBadge: {
    backgroundColor: '#F5E9DA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  dropdownCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primaryMaroon,
  },

  /* Pandals Section */
  pandalsSection: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    padding: 14,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DA',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2B1608',
    flex: 1,
  },
  pandalCountBadge: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primaryMaroon,
  },

  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 12,
    color: '#8C674B',
  },

  pandalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4E9DC',
    gap: 10,
  },
  pandalNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5E9DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pandalNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primaryMaroon,
  },
  pandalInfo: {
    flex: 1,
  },
  pandalName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B1C1A',
  },
  pandalSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  pandalClusterText: {
    fontSize: 11,
    color: '#705A4F',
    flexShrink: 1,
  },
  pandalDistanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryMaroon,
  },

  /* ">" Route button */
  routeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryMaroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
    marginTop: -1,
  },

  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8C674B',
  },
  emptyPromptBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPromptText: {
    fontSize: 12.5,
    color: '#8C674B',
    fontWeight: '500',
  },
});
