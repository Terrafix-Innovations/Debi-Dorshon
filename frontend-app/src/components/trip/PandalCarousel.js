import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(270, SCREEN_WIDTH * 0.78);
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

function MetroIcon({ color = '#831917', size = 13 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="3" width="16" height="15" rx="3" />
      <Line x1="4" y1="11" x2="20" y2="11" />
      <Circle cx="8" cy="15" r="1" fill={color} />
      <Circle cx="16" cy="15" r="1" fill={color} />
      <Path d="M8 18l-2 4M16 18l2 4M9 22h6" />
    </Svg>
  );
}

function ArrowRightIcon({ color = '#FFFFFF', size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

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
          <Text style={{ fontSize: 22 }}>🛕</Text>
          <Text style={styles.emptyTitle}>Enter Start & Destination</Text>
          <Text style={styles.emptySub}>
            Pick your start and destination points above or tap on the map to calculate your custom Puja Parikrama route.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselWrap}>
      {/* Header Row above the sliding track */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🛕</Text>
          <Text style={styles.headerTitle}>Pandals on route</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{itinerary.length}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.swipeText}>swipe</Text>
          <ArrowRightIcon color="#8A7B6E" size={13} />
        </View>
      </View>

      {/* Horizontal Sliding Track */}
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
              style={[styles.card, isSelected ? styles.activeCard : styles.inactiveCard]}
              activeOpacity={0.9}
              onPress={() => onSelectCard(index, item)}
            >
              <View style={styles.cardContentRow}>
                {/* Numbered Step Circle Badge */}
                <View style={[styles.stepCircle, isSelected ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepNumberText, isSelected ? styles.stepNumberActive : styles.stepNumberInactive]}>
                    {stepNum}
                  </Text>
                </View>

                {/* Info Column */}
                <View style={styles.infoCol}>
                  <Text style={[styles.pandalName, isSelected && styles.activeText]} numberOfLines={1}>
                    {p.name || 'Durga Puja Pandal'}
                  </Text>

                  <Text style={[styles.pandalSub, isSelected && styles.activeSubText]} numberOfLines={1}>
                    {p.region || 'Kolkata'} {p.cluster ? `• ${p.cluster}` : ''}
                  </Text>

                  <View style={styles.metricsRow}>
                    {detourKm !== undefined ? (
                      <Text style={[styles.detourText, isSelected ? styles.activeDetourText : styles.inactiveDetourText]}>
                        +{detourKm.toFixed(2)} km
                      </Text>
                    ) : null}

                    {p.nearest_metro?.name ? (
                      <>
                        <Text style={[styles.dotSep, isSelected && { color: '#FFF' }]}>•</Text>
                        <View style={styles.metroBadge}>
                          <MetroIcon color={isSelected ? '#FFFFFF' : '#831917'} size={12} />
                          <Text style={[styles.metroText, isSelected && { color: '#FFFFFF' }]} numberOfLines={1}>
                            {p.nearest_metro.name}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>

                  {navigation ? (
                    <TouchableOpacity
                      style={[styles.detailBtn, isSelected ? styles.detailBtnActive : styles.detailBtnInactive]}
                      onPress={() => navigation.navigate('PandalDetail', { pandalId: p.id || p._id })}
                    >
                      <Text style={[styles.detailBtnText, isSelected ? { color: '#831917' } : { color: '#FFFFFF' }]}>
                        View Details
                      </Text>
                      <ArrowRightIcon color={isSelected ? '#831917' : '#FFFFFF'} size={12} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrap: {
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIcon: {
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1B18',
  },
  countBadge: {
    backgroundColor: '#831917',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swipeText: {
    fontSize: 11,
    color: '#8A7B6E',
    fontWeight: '600',
  },

  /* Card Container */
  card: {
    width: CARD_WIDTH,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    marginRight: CARD_MARGIN,
    shadowColor: '#2D1A16',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  inactiveCard: {
    backgroundColor: '#FDFBF7',
    borderColor: 'rgba(235, 220, 201, 0.8)',
  },
  activeCard: {
    backgroundColor: '#831917',
    borderColor: '#831917',
    transform: [{ scale: 1.02 }],
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepCircleActive: {
    backgroundColor: '#FFFFFF',
  },
  stepCircleInactive: {
    backgroundColor: '#831917',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepNumberActive: {
    color: '#831917',
  },
  stepNumberInactive: {
    color: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  pandalName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2C1B18',
  },
  activeText: {
    color: '#FFFFFF',
  },
  pandalSub: {
    fontSize: 11.5,
    color: '#7A6B5D',
    marginTop: 1,
  },
  activeSubText: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  detourText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inactiveDetourText: {
    color: '#831917',
  },
  activeDetourText: {
    color: '#F4C430',
  },
  dotSep: {
    color: '#CAA774',
    fontSize: 10,
  },
  metroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  metroText: {
    fontSize: 11,
    color: '#381E18',
    fontWeight: '600',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 8,
    gap: 4,
  },
  detailBtnInactive: {
    backgroundColor: '#831917',
  },
  detailBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  detailBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* Skeleton Loaders */
  skeletonCard: {
    opacity: 0.6,
    backgroundColor: '#FDFBF7',
  },
  skelHeader: {
    width: 60,
    height: 16,
    backgroundColor: '#F2ECE1',
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  skelLine: {
    width: '80%',
    height: 18,
    backgroundColor: '#F2ECE1',
    borderRadius: radius.sm,
    marginBottom: 6,
  },
  skelLineSub: {
    width: '50%',
    height: 12,
    backgroundColor: '#F2ECE1',
    borderRadius: radius.sm,
  },

  /* Empty Card */
  emptyCard: {
    width: SCREEN_WIDTH - spacing.md * 2,
    backgroundColor: '#FDFBF7',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 201, 0.8)',
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
