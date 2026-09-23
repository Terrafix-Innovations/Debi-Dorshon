import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_MARGIN = spacing.xs;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

export default function PandalCarousel({
  itinerary = [],
  activeIndex = 0,
  onSelectCard,
  loading = false,
  navigation,
}) {
  const flatListRef = useRef(null);

  // Auto-scroll FlatList when activeIndex changes from map pin selection
  useEffect(() => {
    if (
      flatListRef.current &&
      itinerary.length > 0 &&
      activeIndex >= 0 &&
      activeIndex < itinerary.length
    ) {
      try {
        flatListRef.current.scrollToIndex({
          index: activeIndex,
          animated: true,
        });
      } catch (e) {
        // Fallback offset if scrollToIndex fails before layout complete
        flatListRef.current.scrollToOffset({
          offset: activeIndex * SNAP_INTERVAL,
          animated: true,
        });
      }
    }
  }, [activeIndex, itinerary.length]);

  if (loading) {
    return (
      <View style={styles.carouselWrap}>
        <FlatList
          horizontal
          data={[1, 2, 3]}
          keyExtractor={(item) => `skel_${item}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md }}
          renderItem={() => (
            <View style={[styles.card, styles.skeletonCard]}>
              <View style={styles.skelHeader} />
              <View style={styles.skelLine} />
              <View style={styles.skelLineSub} />
            </View>
          )}
        />
      </View>
    );
  }

  if (!itinerary || itinerary.length === 0) {
    return (
      <View style={styles.carouselWrap}>
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={24} color="#903f00" />
          <Text style={styles.emptyTitle}>No pandals along this corridor</Text>
          <Text style={styles.emptySub}>
            Try picking another start/destination route across Kolkata.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        ref={flatListRef}
        horizontal
        data={itinerary}
        keyExtractor={(item, idx) => item.pandal?.id || item.pandal?._id || `item_${idx}`}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const idx = Math.round(offsetX / SNAP_INTERVAL);
          if (idx >= 0 && idx < itinerary.length && idx !== activeIndex) {
            onSelectCard(idx, itinerary[idx]);
          }
        }}
        renderItem={({ item, index }) => {
          const p = item.pandal || item;
          const stepNum = item.step || index + 1;
          const isSelected = index === activeIndex;
          const detourKm = item.detour_distance_km;

          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.activeCard]}
              activeOpacity={0.9}
              onPress={() => onSelectCard(index, item)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.stepBadge, isSelected && styles.activeStepBadge]}>
                  <Text style={[styles.stepText, isSelected && styles.activeStepText]}>
                    Stop #{stepNum}
                  </Text>
                </View>

                {detourKm !== undefined ? (
                  <View style={styles.detourPill}>
                    <Ionicons
                      name="walk-outline"
                      size={12}
                      color={isSelected ? colors.white : colors.espresso}
                    />
                    <Text style={[styles.detourText, isSelected && { color: colors.white }]}>
                      +{detourKm.toFixed(2)} km detour
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.pandalName, isSelected && styles.activeText]} numberOfLines={1}>
                {p.name || 'Durga Puja Pandal'}
              </Text>

              <Text style={[styles.pandalSub, isSelected && styles.activeSub]} numberOfLines={1}>
                {p.region || 'Kolkata'} {p.cluster ? `• ${p.cluster}` : ''}
              </Text>

              {p.nearest_metro?.name ? (
                <View style={styles.metroRow}>
                  <MaterialCommunityIcons
                    name="subway-variant"
                    size={14}
                    color={isSelected ? colors.white : colors.primaryMaroon}
                  />
                  <Text style={[styles.metroText, isSelected && { color: colors.white }]}>
                    Metro: {p.nearest_metro.name}
                  </Text>
                </View>
              ) : null}

              {navigation ? (
                <TouchableOpacity
                  style={[styles.detailBtn, isSelected && styles.activeDetailBtn]}
                  onPress={() => navigation.navigate('PandalDetail', { pandalId: p.id || p._id })}
                >
                  <Text style={[styles.detailBtnText, isSelected && { color: '#903f00' }]}>
                    View Pandal Details
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={isSelected ? '#903f00' : colors.white}
                  />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrap: {
    paddingVertical: spacing.xs,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fdfaf4',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: spacing.md,
    marginRight: CARD_MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  activeCard: {
    backgroundColor: '#903f00',
    borderColor: '#903f00',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepBadge: {
    backgroundColor: '#f2ece1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  activeStepBadge: {
    backgroundColor: colors.white,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#903f00',
  },
  activeStepText: {
    color: '#903f00',
  },
  detourPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${colors.goldHighlight}30`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  detourText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.espresso,
  },
  pandalName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.espresso,
    marginBottom: 2,
  },
  pandalSub: {
    fontSize: 12,
    color: `${colors.espresso}99`,
    marginBottom: spacing.xs,
  },
  activeText: {
    color: colors.white,
  },
  activeSub: {
    color: `${colors.white}CC`,
  },
  metroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  metroText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.espresso,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#903f00',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    marginTop: 4,
    gap: 4,
  },
  activeDetailBtn: {
    backgroundColor: colors.white,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },

  /* Skeleton Loaders */
  skeletonCard: {
    opacity: 0.6,
  },
  skelHeader: {
    width: 60,
    height: 16,
    backgroundColor: '#f2ece1',
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  skelLine: {
    width: '80%',
    height: 18,
    backgroundColor: '#f2ece1',
    borderRadius: radius.sm,
    marginBottom: 6,
  },
  skelLineSub: {
    width: '50%',
    height: 12,
    backgroundColor: '#f2ece1',
    borderRadius: radius.sm,
  },

  /* Empty Card */
  emptyCard: {
    width: SCREEN_WIDTH - spacing.md * 2,
    backgroundColor: '#fdfaf4',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
    padding: spacing.md,
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.espresso,
    marginTop: 4,
  },
  emptySub: {
    fontSize: 11,
    color: `${colors.espresso}AA`,
    textAlign: 'center',
  },
});
