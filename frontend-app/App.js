import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, HindSiliguri_700Bold, HindSiliguri_600SemiBold } from '@expo-google-fonts/hind-siliguri';
import { BalooDa2_800ExtraBold, BalooDa2_700Bold } from '@expo-google-fonts/baloo-da-2';
import { TiroBangla_400Regular } from '@expo-google-fonts/tiro-bangla';
import { AnekBangla_800ExtraBold, AnekBangla_700Bold } from '@expo-google-fonts/anek-bangla';
import { Galada_400Regular } from '@expo-google-fonts/galada';
import { Atma_700Bold } from '@expo-google-fonts/atma';
import RootNavigator from './src/navigation/RootNavigator';
import { TripProvider } from './src/context/TripContext';
import { AuthProvider } from './src/context/AuthContext';
import { DrawerProvider } from './src/context/DrawerContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    HindSiliguri_700Bold,
    HindSiliguri_600SemiBold,
    BalooDa2_800ExtraBold,
    BalooDa2_700Bold,
    TiroBangla_400Regular,
    AnekBangla_800ExtraBold,
    AnekBangla_700Bold,
    Galada_400Regular,
    Atma_700Bold,
  });

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DrawerProvider>
          <TripProvider>
            <RootNavigator />
          </TripProvider>
        </DrawerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}


