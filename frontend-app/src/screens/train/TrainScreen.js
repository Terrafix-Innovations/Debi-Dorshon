import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import TrainStationsPanel from './TrainStationsPanel';
import TrainPandalsPanel from './TrainPandalsPanel';
import { colors } from '../../theme/colors';

const TABS = [
  { key: 'stations', label: 'Train Stations' },
  { key: 'pandals', label: 'Pandals' },
];

export default function TrainScreen() {
  const [active, setActive] = useState('stations');

  return (
    <View style={styles.container}>
      <ScreenHeader title="Train Navigator" subtitle="Plan your puja trip by rail" />
      <SegmentedTabs options={TABS} activeKey={active} onChange={setActive} />
      {active === 'stations' ? <TrainStationsPanel /> : <TrainPandalsPanel />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
});
