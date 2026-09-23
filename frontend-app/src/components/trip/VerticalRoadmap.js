import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Helper to determine journey mode between milestones
function getJourneyDetails(step) {
  const dist = step.distance_km || 0;
  const p = step.pandal || {};

  if (p.nearest_ferry && p.nearest_ferry.name) {
    return {
      type: 'ferry',
      label: 'Ferry Waterways',
      iconName: 'boat-outline',
      color: '#00838F',
      bgColor: '#E0F7FA',
      borderColor: '#80DEEA',
      lineStyle: 'dashed',
      details: `Ferry via ${p.nearest_ferry.name} ${p.nearest_ferry.line ? `(${p.nearest_ferry.line})` : ''}`,
    };
  }

  if ((p.nearest_metro && p.nearest_metro.name) || (p.nearest_station && p.nearest_station.name)) {
    const station = p.nearest_metro || p.nearest_station;
    return {
      type: 'rail',
      label: 'Metro / Rail Transit',
      iconName: 'train-outline',
      color: '#2E7D32',
      bgColor: '#E8F5E9',
      borderColor: '#A5D6A7',
      lineStyle: 'solid',
      details: `Transit via ${station.name} ${station.line ? `(${station.line})` : ''}`,
    };
  }

  if (dist <= 2.0) {
    return {
      type: 'walk',
      label: 'Short Walk',
      iconName: 'walk-outline',
      color: '#E65100',
      bgColor: '#FFF3E0',
      borderColor: '#FFE0B2',
      lineStyle: 'dotted',
      details: `Short walking path (~${dist} km)`,
    };
  }

  return {
    type: 'car',
    label: 'Car / Cab Drive',
    iconName: 'car-outline',
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
    borderColor: '#E1BEE7',
    lineStyle: 'solid',
    details: `Drive by car/cab (~${dist} km)`,
  };
}

export default function VerticalRoadmap({
  origin,
  itinerary = [],
  totalPandals = 5,
  estimatedDistanceKm = 3.2,
  userCurrentLocation,
  onMilestoneReached,
}) {
  const [selectedLeg, setSelectedLeg] = useState(null);
  const [reachedMilestones, setReachedMilestones] = useState({ 0: true }); // Origin reached by default

  const toggleReachMilestone = (index, name) => {
    setReachedMilestones((prev) => {
      const nextState = { ...prev, [index]: !prev[index] };
      if (!prev[index] && onMilestoneReached) {
        onMilestoneReached(name);
      }
      return nextState;
    });
  };

  // Build milestones list: Index 0 is User Origin, Index 1..N are Pandals
  const milestones = [
    {
      id: 'origin_0',
      type: 'origin',
      title: 'Your Current Origin',
      sub: 'Start Location',
      lat: origin?.latitude || 22.5986,
      lng: origin?.longitude || 88.3712,
      distFromPrev: 0,
      cumulativeDist: 0,
    },
    ...itinerary.map((step, idx) => {
      let cumDist = 0;
      for (let i = 0; i <= idx; i++) {
        cumDist += itinerary[i].distance_km || 0;
      }
      return {
        id: step.pandal?._id || `step_${idx + 1}`,
        type: 'pandal',
        stepNumber: step.step || idx + 1,
        title: step.pandal?.name || `Pandal ${idx + 1}`,
        region: step.pandal?.region,
        cluster: step.pandal?.cluster || step.pandal?.area,
        lat: step.pandal?.location?.latitude ?? step.pandal?.lat,
        lng: step.pandal?.location?.longitude ?? step.pandal?.lng,
        nearest_metro: step.pandal?.nearest_metro,
        nearest_station: step.pandal?.nearest_station,
        nearest_stations: step.pandal?.nearest_stations,
        nearest_ferry: step.pandal?.nearest_ferry,
        distFromPrev: step.distance_km || 0,
        cumulativeDist: parseFloat(cumDist.toFixed(2)),
        rawStep: step,
      };
    }),
  ];

  return (
    <View style={styles.container}>
      {/* Roadmap Header Summary */}
      <View style={styles.roadmapHeaderCard}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="map-outline" size={22} color={colors.goldHighlight} />
          <Text style={styles.roadmapTitle}>Vertical Parikrama Roadmap</Text>
        </View>
        <View style={styles.headerMetricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{totalPandals || itinerary.length}</Text>
            <Text style={styles.metricLbl}>Milestones</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{estimatedDistanceKm || '3.2'} km</Text>
            <Text style={styles.metricLbl}>Total Route</Text>
          </View>
        </View>
      </View>

      {/* Vertical Timeline Roadmap */}
      <View style={styles.timelineWrap}>
        {milestones.map((m, idx) => {
          const isReached = !!reachedMilestones[idx];
          const isOrigin = m.type === 'origin';
          const nextStepData = itinerary[idx]; // Journey from milestone idx to idx+1

          return (
            <View key={m.id} style={styles.milestoneBlock}>
              {/* Milestone Card */}
              <View style={styles.milestoneRow}>
                {/* Milestone Numbered Circle Badge with Green Ring when Reached */}
                <Pressable
                  style={[
                    styles.milestoneBadge,
                    isReached && styles.greenRingBadge,
                  ]}
                  onPress={() => toggleReachMilestone(idx, m.title)}
                >
                  <Text style={[styles.badgeNumberText, isReached && styles.badgeNumberTextReached]}>
                    {isOrigin ? 'S' : m.stepNumber}
                  </Text>
                </Pressable>

                {/* Milestone Details Card */}
                <View style={[styles.milestoneCard, isReached && styles.milestoneCardReached]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.milestoneTitle} numberOfLines={2}>
                        {m.title}
                      </Text>
                      {m.region || m.cluster ? (
                        <Text style={styles.milestoneSub} numberOfLines={1}>
                          {m.region ? `${m.region} Kolkata` : ''} {m.cluster ? `• ${m.cluster}` : ''}
                        </Text>
                      ) : (
                        <Text style={styles.milestoneSub}>{m.sub}</Text>
                      )}
                    </View>

                    <Pressable
                      style={[styles.checkInBtn, isReached && styles.checkInBtnReached]}
                      onPress={() => toggleReachMilestone(idx, m.title)}
                    >
                      <Ionicons
                        name={isReached ? 'checkmark-circle' : 'radio-button-on'}
                        size={13}
                        color={isReached ? colors.white : colors.primaryMaroon}
                      />
                      <Text style={[styles.checkInText, isReached && styles.checkInTextReached]}>
                        {isReached ? 'Reached' : 'Check In'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Transit badges */}
                  {m.nearest_metro?.name || m.nearest_station?.name || m.nearest_ferry?.name ? (
                    <View style={styles.transitBadgesRow}>
                      {m.nearest_metro?.name ? (
                        <View style={styles.transitBadge}>
                          <Ionicons name="train-outline" size={11} color="#2E7D32" />
                          <Text style={styles.transitBadgeText}>
                            Metro: {m.nearest_metro.name} ({m.nearest_metro.line || 'Blue'})
                          </Text>
                        </View>
                      ) : null}
                      {m.nearest_ferry?.name ? (
                        <View style={styles.transitBadge}>
                          <Ionicons name="boat-outline" size={11} color="#00838F" />
                          <Text style={styles.transitBadgeText}>Ferry: {m.nearest_ferry.name}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Distance Footer with flexWrap to prevent text clipping */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.distFooterText}>
                      {isOrigin
                        ? 'Origin Point (0.0 km)'
                        : `+${m.distFromPrev} km • Total ${m.cumulativeDist} km`}
                    </Text>
                    {m.lat && m.lng ? (
                      <Text style={styles.coordsFooterText}>
                        {m.lat.toFixed(4)}°, {m.lng.toFixed(4)}°
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Journey Connector Road between this Milestone and Next Milestone */}
              {nextStepData ? (
                (() => {
                  const details = getJourneyDetails(nextStepData);
                  return (
                    <View style={styles.connectorContainer}>
                      {/* Vertical Road Line (centered under 32px badge: 16px) */}
                      <View
                        style={[
                          styles.verticalRoadLine,
                          { borderColor: details.color },
                          details.lineStyle === 'dashed' && styles.dashedLine,
                          details.lineStyle === 'dotted' && styles.dottedLine,
                        ]}
                      />

                      {/* Clickable Journey Vehicle Chip */}
                      <Pressable
                        style={[
                          styles.vehicleChip,
                          { backgroundColor: details.bgColor, borderColor: details.borderColor },
                        ]}
                        onPress={() => setSelectedLeg({ details, step: nextStepData })}
                      >
                        <Ionicons
                          name={details.iconName}
                          size={16}
                          color={details.color}
                        />
                        <View style={styles.vehicleChipInfo}>
                          <Text style={[styles.vehicleChipLabel, { color: details.color }]}>
                            {nextStepData.distance_km} km
                          </Text>
                          <Text style={styles.vehicleChipSub}>{details.label}</Text>
                        </View>
                        <Ionicons name="information-circle-outline" size={15} color={details.color} />
                      </Pressable>
                    </View>
                  );
                })()
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Vehicle Details Modal */}
      <Modal
        visible={!!selectedLeg}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedLeg(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                {selectedLeg ? (
                  <Ionicons
                    name={selectedLeg.details.iconName}
                    size={22}
                    color={selectedLeg.details.color}
                  />
                ) : null}
                <Text style={styles.modalTitle}>{selectedLeg?.details.label}</Text>
              </View>
              <Pressable onPress={() => setSelectedLeg(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={24} color={colors.espresso} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalMetricBox}>
                <Text style={styles.modalMetricVal}>
                  {selectedLeg?.step?.distance_km} km
                </Text>
                <Text style={styles.modalMetricLbl}>Leg Distance</Text>
              </View>

              <Text style={styles.modalDetailText}>{selectedLeg?.details.details}</Text>

              {selectedLeg?.step?.pandal?.nearest_stations?.length > 0 ? (
                <View style={styles.stationsBreakdown}>
                  <Text style={styles.stationsTitle}>Nearby Suburban Stations:</Text>
                  {selectedLeg.step.pandal.nearest_stations.map((st, i) => (
                    <Text key={i} style={styles.stationItemText}>
                      • {st.name}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    width: '100%',
  },

  roadmapHeaderCard: {
    backgroundColor: colors.espresso,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  roadmapTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  headerMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: `${colors.white}25`,
  },
  metricBox: { alignItems: 'center' },
  metricVal: { color: colors.goldHighlight, fontWeight: '800', fontSize: 16 },
  metricLbl: { color: `${colors.white}AA`, fontSize: 11, marginTop: 2 },
  metricDivider: { width: 1, height: 22, backgroundColor: `${colors.white}25` },

  timelineWrap: {
    paddingLeft: 2,
    width: '100%',
  },
  milestoneBlock: {
    marginBottom: 4,
    width: '100%',
  },

  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    width: '100%',
  },

  /* Milestone Badge (32px diameter) */
  milestoneBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.espresso,
    borderWidth: 2,
    borderColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    zIndex: 2,
    flexShrink: 0,
  },
  greenRingBadge: {
    backgroundColor: '#2E7D32',
    borderColor: '#4CAF50',
    borderWidth: 2.5,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeNumberText: {
    color: colors.goldHighlight,
    fontWeight: '800',
    fontSize: 12,
  },
  badgeNumberTextReached: {
    color: colors.white,
  },

  /* Milestone Card */
  milestoneCard: {
    flex: 1,
    backgroundColor: colors.cardCream,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.sm + 2,
    elevation: 1,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  milestoneCardReached: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 4,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.espresso,
  },
  milestoneSub: {
    fontSize: 11,
    color: `${colors.espresso}AA`,
    marginTop: 2,
    fontWeight: '600',
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primaryMaroon}12`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  checkInBtnReached: {
    backgroundColor: '#2E7D32',
  },
  checkInText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryMaroon,
  },
  checkInTextReached: {
    color: colors.white,
  },

  transitBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  transitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  transitBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.espresso,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: `${colors.goldMuted}40`,
  },
  distFooterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.espresso,
    flexShrink: 1,
  },
  coordsFooterText: {
    fontSize: 10,
    color: `${colors.espresso}88`,
    flexShrink: 0,
  },

  /* Connector Road & Vehicle Icon */
  connectorContainer: {
    marginLeft: 15,
    paddingVertical: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  verticalRoadLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    borderLeftWidth: 2,
    zIndex: 1,
  },
  dashedLine: {
    borderStyle: 'dashed',
  },
  dottedLine: {
    borderStyle: 'dotted',
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    zIndex: 2,
    elevation: 2,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  vehicleChipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleChipLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  vehicleChipSub: {
    fontSize: 10,
    color: `${colors.espresso}AA`,
  },

  /* Vehicle Details Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.cardCream,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
    width: '100%',
    maxWidth: 400,
    padding: spacing.md,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.espresso,
  },
  modalBody: {
    gap: spacing.sm,
  },
  modalMetricBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  modalMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryMaroon,
  },
  modalMetricLbl: {
    fontSize: 11,
    color: `${colors.espresso}99`,
    fontWeight: '600',
    marginTop: 2,
  },
  modalDetailText: {
    fontSize: 13,
    color: colors.espresso,
    lineHeight: 18,
  },
  stationsBreakdown: {
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  stationsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.espresso,
    marginBottom: 4,
  },
  stationItemText: {
    fontSize: 12,
    color: `${colors.espresso}CC`,
    lineHeight: 16,
  },
});
