import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import CollapsiblePandalsList from '../../components/common/CollapsiblePandalsList';
import { MOCK_PANDALS } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function TripScreen({ navigation }) {
  const [startLocation, setStartLocation] = useState('Dum Dum Metro Station');
  const [endLocation, setEndLocation] = useState('Kalighat Metro Station');
  const [isRouteGenerated, setIsRouteGenerated] = useState(false);

  const handleStartTrip = () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      Alert.alert('Location Required', 'Please enter both starting and ending locations.');
      return;
    }
    setIsRouteGenerated(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Trip Planner" />
      <SideDrawer navigation={navigation} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Wireframe Section: Create Your Route */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="routes" size={24} color={colors.primaryMaroon} />
            <Text style={styles.cardTitle}>Create Your Route</Text>
          </View>
          <Text style={styles.cardSub}>
            Enter starting and ending points to plan your custom Durga Puja route.
          </Text>

          {/* Input 1: Starting Location */}
          <View style={styles.inputWrap}>
            <Ionicons name="location" size={20} color={colors.primaryMaroon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your starting location"
              placeholderTextColor={`${colors.espresso}77`}
              value={startLocation}
              onChangeText={setStartLocation}
            />
          </View>

          {/* Input 2: Ending Location */}
          <View style={styles.inputWrap}>
            <Ionicons name="flag" size={20} color={colors.secondaryRed} />
            <TextInput
              style={styles.input}
              placeholder="Enter your ending location"
              placeholderTextColor={`${colors.espresso}77`}
              value={endLocation}
              onChangeText={setEndLocation}
            />
          </View>

          {/* START TRIP Button */}
          <TouchableOpacity style={styles.startBtn} onPress={handleStartTrip}>
            <MaterialCommunityIcons name="navigation" size={22} color={colors.white} />
            <Text style={styles.startBtnText}>START TRIP</Text>
          </TouchableOpacity>
        </View>

        {/* Wireframe Result: On Click a Customized Route Appears */}
        {isRouteGenerated && (
          <View style={styles.routeResultCard}>
            <View style={styles.routeHeader}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#2E7D32" />
              <View style={styles.routeHeaderText}>
                <Text style={styles.routeTitle}>Customized Route Ready!</Text>
                <Text style={styles.routeSub}>
                  {startLocation} ➔ {endLocation}
                </Text>
              </View>
            </View>

            {/* Direct button to open zoomable navigation map */}
            <TouchableOpacity
              style={styles.viewMapBtn}
              onPress={() => navigation.navigate('Navigation')}
            >
              <MaterialCommunityIcons name="map-marker-path" size={20} color={colors.white} />
              <Text style={styles.viewMapText}>VIEW ROUTE ON MAP</Text>
            </TouchableOpacity>

            <Text style={styles.pandalsOnRouteTitle}>En-route Pandals List</Text>
            <CollapsiblePandalsList pandals={MOCK_PANDALS.slice(0, 6)} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.md },
  card: {
    backgroundColor: colors.cardCream,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    elevation: 3,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryMaroon },
  cardSub: { fontSize: 12, color: `${colors.espresso}99`, marginTop: 4, marginBottom: spacing.md },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  input: { flex: 1, fontSize: 14, color: colors.espresso, fontWeight: '600' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMaroon,
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
    elevation: 2,
  },
  startBtnText: { color: colors.white, fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  routeResultCard: {
    backgroundColor: colors.cardCream,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.goldHighlight,
  },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  routeHeaderText: { flex: 1 },
  routeTitle: { fontSize: 16, fontWeight: '800', color: colors.espresso },
  routeSub: { fontSize: 12, color: colors.primaryMaroon, fontWeight: '700', marginTop: 2 },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.espresso,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  viewMapText: { color: colors.goldHighlight, fontSize: 13, fontWeight: '800' },
  pandalsOnRouteTitle: { fontSize: 14, fontWeight: '800', color: colors.espresso, marginBottom: spacing.xs },
});
