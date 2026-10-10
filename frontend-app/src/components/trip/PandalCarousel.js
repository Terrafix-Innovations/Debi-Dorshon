import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { radius, spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(270, SCREEN_WIDTH * 0.78);
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

function PandalIcon({ color = '#831917', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2c-1.1 0-2 .9-2 2v1H7C5.3 5 4 6.3 4 8v2h2v10H4v2h16v-2h-2V10h2V8c0-1.7-1.3-3-3-3h-3V4c0-1.1-.9-2-2-2zm-4 8v10h2v-6h4v6h2V10H8zm4-3c1.1 0 2 .9 2 2H10c0-1.1.9-2 2-2z"/>
    </Svg>
  );
}

function PinIcon({ color = '#9E9E9E', size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </Svg>
  );
}

function WalkIcon({ color = '#2E7D32', size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
    </Svg>
  );
}

function ArrowRightIcon({ color = '#FFFFFF', size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
  );
}

function ChevronIcon({ expanded, color = '#9E9E9E', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: [{ rotate: expanded ? '0deg' : '180deg' }] }}>
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

function MandalaIcon() {
  return (
    <Svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="#831917" strokeWidth="1" strokeOpacity="0.15">
      <Path d="M100 50 C 70 30, 50 50, 50 50 C 50 50, 70 70, 100 50 Z" />
      <Path d="M90 20 C 60 20, 50 50, 50 50 C 50 50, 80 40, 90 20 Z" />
      <Path d="M90 80 C 80 60, 50 50, 50 50 C 50 50, 60 80, 90 80 Z" />
      <Path d="M50 0 C 40 30, 50 50, 50 50 C 50 50, 60 30, 50 0 Z" />
      <Path d="M50 100 C 40 70, 50 50, 50 50 C 50 50, 60 70, 50 100 Z" />
      <Circle cx="50" cy="50" r="10" />
      <Circle cx="50" cy="50" r="30" />
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
  const [isExpanded, setIsExpanded] = useState(true);

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
          <Text style={styles.emptyIcon}>🛕</Text>
          <Text style={styles.emptyText}>Enter start & destination to plan route</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselWrap}>
      {/* Floating Pill: Pandals on route */}
      <View style={styles.chipWrapper}>
        <TouchableOpacity style={styles.pillChip} onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.8}>
          <PandalIcon color="#831917" size={20} />
          <Text style={styles.pillText} numberOfLines={1}>
            {!isExpanded && activeIndex >= 0 && itinerary[activeIndex]
              ? (itinerary[activeIndex].pandal?.name || itinerary[activeIndex].name || 'Durga Puja Pandal')
              : 'Pandals on route'}
          </Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{itinerary.length}</Text>
          </View>
          <ChevronIcon expanded={isExpanded} color="#9E9E9E" size={16} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Sliding Track */}
      {isExpanded && (
      <FlatList
        ref={flatListRef}
        horizontal
        data={itinerary}
        keyExtractor={(item, idx) => item.pandal?.id || item.pandal?._id || `item_${idx}`}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
        getItemLayout={(data, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
        initialScrollIndex={activeIndex >= 0 && activeIndex < itinerary.length ? activeIndex : 0}
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
          const detourKm = item.detour_distance_km !== undefined ? item.detour_distance_km : 0;

          return (
            <TouchableOpacity
              style={[styles.card, isSelected ? styles.activeCard : styles.inactiveCard]}
              activeOpacity={1}
              onPress={() => onSelectCard(index, item)}
            >
              {isSelected && (
                <View style={styles.watermarkContainer}>
                  <MandalaIcon />
                </View>
              )}
              <View style={styles.cardContentRow}>
                {/* Numbered Step Circle Badge */}
                <View style={[styles.stepCircle, isSelected ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepNumberText, isSelected ? styles.stepNumberActive : styles.stepNumberInactive]}>
                    {stepNum}
                  </Text>
                </View>

                {/* Info Column */}
                <View style={styles.infoCol}>
                  <Text style={styles.pandalName} numberOfLines={1}>
                    {p.name || 'Durga Puja Pandal'}
                  </Text>

                  <View style={styles.subtitleRow}>
                    <PinIcon color="#9E9E9E" size={12} />
                    <Text style={styles.pandalSub} numberOfLines={1}>
                      {p.region || 'Kolkata'} {p.cluster ? `• ${p.cluster}` : ''}
                    </Text>
                  </View>

                  <View style={styles.bottomRow}>
                    <View style={styles.distancePill}>
                      <WalkIcon color="#2E7D32" size={13} />
                      <Text style={styles.distanceText}>
                        +{detourKm.toFixed(2)} km
                      </Text>
                    </View>

                    {navigation ? (
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => navigation.navigate('PandalDetail', { pandalId: p.id || p._id })}
                      >
                        <Text style={styles.viewBtnText}>View</Text>
                        <ArrowRightIcon color="#FFFFFF" size={14} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrap: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  
  /* Top Floating Pill */
  chipWrapper: {
    paddingHorizontal: spacing.md,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  pillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  pillBadge: {
    backgroundColor: '#831917',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    marginRight: 4,
  },
  pillBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Card Container */
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 12,
    marginRight: CARD_MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  inactiveCard: {
    backgroundColor: '#FFFFFF',
  },
  activeCard: {
    backgroundColor: '#FFF7F5',
    borderWidth: 1.5,
    borderColor: '#831917',
  },
  watermarkContainer: {
    position: 'absolute',
    right: -25,
    top: '50%',
    marginTop: -40,
    justifyContent: 'center',
    zIndex: 0,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  
  /* Step Circle */
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#831917',
  },
  stepCircleInactive: {
    backgroundColor: '#FDECEB',
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '800',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    color: '#831917',
  },

  /* Info Column */
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  pandalName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pandalSub: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  
  /* Bottom Row */
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  distanceText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '800',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#831917',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Skeleton Loaders */
  skeletonCard: {
    backgroundColor: '#FDFBF7',
    opacity: 0.6,
  },
  skelLine: {
    width: '80%',
    height: 20,
    backgroundColor: '#F2ECE1',
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  skelLineSub: {
    width: '50%',
    height: 14,
    backgroundColor: '#F2ECE1',
    borderRadius: radius.sm,
  },

  /* Empty Card */
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1B18',
  },
});
