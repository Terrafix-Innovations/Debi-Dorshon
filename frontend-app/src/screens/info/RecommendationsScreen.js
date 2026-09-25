import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function RecommendationsScreen({ navigation }) {
  const recommendations = [
    {
      title: 'Must Visit North Kolkata Circuit',
      desc: 'Sovabazar Rajbari, Bagbazar Sarbojanin, Ahiritola, Kumartuli Park',
      tag: 'Heritage & Crowd Favorite',
      icon: 'fire',
    },
    {
      title: 'South Kolkata Mega Pandals',
      desc: 'Sree Bhumi, Ekdalia Evergreen, Singhi Park, Suruchi Sangha',
      tag: 'Lighting & Theme Masterpieces',
      icon: 'star',
    },
    {
      title: 'Best Night Time Hopping (12 AM - 4 AM)',
      desc: 'Chetla Agrani, Mudiali, Badamtala Ashar Sangha, Deshapriya Park',
      tag: 'Low Traffic & Cool Breeze',
      icon: 'weather-night',
    },
    {
      title: 'Puja Special Street Food Hubs',
      desc: 'Deckers Lane, Park Street, Hatibagan & College Street',
      tag: 'Kolkata Delicacies',
      icon: 'food-crossroads',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Recommendations" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBox}>
          <Text style={styles.title}>Curated Puja Recommendations</Text>
          <Text style={styles.subtitle}>Handpicked itineraries & tips for Kolkata Durga Puja 2026</Text>
        </View>

        {recommendations.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            onPress={() => navigation.navigate('Trip')}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={item.icon} size={24} color={colors.primaryMaroon} />
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.tag}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.md },
  headerBox: { marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '900', color: colors.primaryMaroon },
  subtitle: { fontSize: 12, color: `${colors.espresso}99`, marginTop: 2 },
  card: {
    backgroundColor: colors.cardCream,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 26, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(244, 196, 48, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.primaryMaroon },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.espresso, marginTop: spacing.sm },
  cardDesc: { fontSize: 13, color: `${colors.espresso}AA`, marginTop: 4, lineHeight: 18 },
});
