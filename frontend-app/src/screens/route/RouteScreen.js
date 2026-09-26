import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';
import { fetchPandals } from '../../services/pandalService';
import { fetchAutocompletePlaces } from '../../services/routeService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import InteractiveMapView from '../../components/map/InteractiveMapView';

export default function RouteScreen({ navigation }) {
  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const debounceTimerRef = useRef(null);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch pandals from the database
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchPandals({ limit: 500 });
        if (mounted) {
          setPandals(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('[RouteScreen] Failed to load pandals:', err?.message);
        if (mounted) setPandals([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter valid coordinates
  const mappablePandals = useMemo(
    () =>
      pandals.filter((p) => {
        const lat = p.lat ?? p.location?.latitude;
        const lng = p.lng ?? p.location?.longitude;
        return typeof lat === 'number' && typeof lng === 'number';
      }),
    [pandals]
  );

  // Live autocomplete search (Pandals + OSM)
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (!isSearchActive) setIsSearchActive(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!text || text.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const places = await fetchAutocompletePlaces(text);
        setSuggestions(places || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 220);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setIsSearchActive(false);
    setSelectedPlace(null);
    Keyboard.dismiss();
  };

  const handleSelectPlace = useCallback((place) => {
    if (!place) return;
    const title = place.title || place.name || 'Selected Place';
    const lat = place.latitude ?? place.lat ?? place.location?.latitude;
    const lng = place.longitude ?? place.lng ?? place.location?.longitude;

    const normalized = {
      ...place,
      id: place.id || place._id,
      title,
      latitude: lat,
      longitude: lng,
      badge: place.badge || '📍 Place',
      subtitle: place.subtitle || place.address || place.cluster || place.region || '',
      nearest_metro: place.nearest_metro?.name || place.nearest_metro || '',
    };

    setSelectedPlace(normalized);
    setSearchQuery(title);
    setIsSearchActive(false);
    setSuggestions([]);
    Keyboard.dismiss();

    if (mapRef.current?.flyToLocation && typeof lat === 'number' && typeof lng === 'number') {
      mapRef.current.flyToLocation(lat, lng, 16);
    }
  }, []);

  const handlePlanRouteToHere = () => {
    if (!selectedPlace) return;
    navigation.navigate('Trips', {
      endPlace: selectedPlace,
      focusStart: true,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Puja Navigation Map" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <View style={styles.container}>
          {/* Top Floating Search Section */}
          <View style={styles.topSearchWrapper}>
            <View style={styles.searchBarCard}>
              <Ionicons name="search" size={19} color="#8E1B1B" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={[
                  styles.searchInput,
                  Platform.OS === 'web' && { outlineStyle: 'none', outline: 'none' },
                ]}
                placeholder="Search pandals, metros, railway, places..."
                placeholderTextColor="#8A7B6E"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => setIsSearchActive(true)}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {loadingSuggestions && (
                <ActivityIndicator size="small" color="#8E1B1B" style={{ marginRight: 6 }} />
              )}
              {searchQuery ? (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={19} color="#8A7B6E" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Suggestions Dropdown */}
            {isSearchActive && (suggestions.length > 0 || loadingSuggestions) && (
              <View style={styles.dropdownCard}>
                <ScrollView
                  style={styles.dropdownScroll}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {suggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id || `sugg_${idx}`}
                      style={styles.suggestionRow}
                      onPress={() => handleSelectPlace(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.badgeChip}>
                        <Text style={styles.badgeText}>{item.badge || '📍'}</Text>
                      </View>
                      <View style={styles.suggestionTextCol}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.subtitle ? (
                          <Text style={styles.suggestionSub} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="rgba(138, 123, 110, 0.5)" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Subtle Pandal Count Pill */}
            {!isSearchActive && (
              <View style={styles.pandalCountPill}>
                <MaterialCommunityIcons name="map-marker-multiple" size={14} color="#D4AF37" />
                <Text style={styles.pandalCountText}>
                  {loading
                    ? 'Loading pandals across Kolkata...'
                    : `${mappablePandals.length} Durga Puja Pandals Live on Map`}
                </Text>
              </View>
            )}
          </View>

          {/* Fullscreen Interactive Leaflet Map */}
          <View style={styles.mapWrap}>
            <InteractiveMapView
              ref={mapRef}
              pandals={mappablePandals}
              searchedPlace={selectedPlace}
              onSelectPlace={(place) => {
                handleSelectPlace(place);
              }}
            />

            {loading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primaryMaroon} />
                <Text style={styles.mapLoadingText}>Fetching pandals across Kolkata...</Text>
              </View>
            )}
          </View>

          {/* Bottom Floating Card when a Place is Selected */}
          {selectedPlace && !isSearchActive && (
            <View style={styles.bottomCardWrapper}>
              <View style={styles.bottomPlaceCard}>
                <View style={styles.bottomCardHeader}>
                  <View style={styles.bottomBadgeTag}>
                    <Text style={styles.bottomBadgeText}>{selectedPlace.badge || '📍 Place'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedPlace(null)}
                    style={styles.bottomCloseBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={18} color="#8A7B6E" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.bottomPlaceTitle} numberOfLines={1}>
                  {selectedPlace.title}
                </Text>

                {selectedPlace.subtitle ? (
                  <Text style={styles.bottomPlaceSubtitle} numberOfLines={2}>
                    {selectedPlace.subtitle}
                  </Text>
                ) : null}

                {selectedPlace.nearest_metro ? (
                  <View style={styles.metroProximityRow}>
                    <Ionicons name="subway-outline" size={14} color="#4338CA" />
                    <Text style={styles.metroProximityText}>
                      Nearest Metro: {selectedPlace.nearest_metro}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.planRouteBtn}
                  onPress={handlePlanRouteToHere}
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  <Text style={styles.planRouteBtnText}>Plan Route to Here</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { flex: 1, position: 'relative' },

  // Top Floating Search Header
  topSearchWrapper: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 100,
  },
  searchBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    shadowColor: '#2B1608',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1B1C1A',
    fontWeight: '600',
    paddingVertical: 0,
  },

  // Dropdown Autocomplete
  dropdownCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    shadowColor: '#2B1608',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
    maxHeight: 280,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE1',
    gap: 10,
  },
  badgeChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FAEEE4',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E1B1B',
  },
  suggestionTextCol: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B1C1A',
  },
  suggestionSub: {
    fontSize: 11,
    color: '#8A7B6E',
    marginTop: 1,
  },

  // Pandal Count Pill
  pandalCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(142, 27, 27, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pandalCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FAF2E4',
  },

  // Map Wrap
  mapWrap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 247, 242, 0.65)',
    gap: 8,
    zIndex: 50,
  },
  mapLoadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryMaroon,
  },

  // Bottom Floating Selected Place Card
  bottomCardWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
    zIndex: 100,
  },
  bottomPlaceCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    shadowColor: '#2B1608',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bottomBadgeTag: {
    backgroundColor: '#FAEEE4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bottomBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E1B1B',
  },
  bottomCloseBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F5ECE1',
  },
  bottomPlaceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1B1C1A',
    marginBottom: 3,
  },
  bottomPlaceSubtitle: {
    fontSize: 12,
    color: '#8A7B6E',
    lineHeight: 16,
    marginBottom: 8,
  },
  metroProximityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  metroProximityText: {
    fontSize: 11,
    color: '#4338CA',
    fontWeight: '600',
  },
  planRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E1B1B',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#8E1B1B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  planRouteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
