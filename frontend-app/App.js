import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { TripProvider } from './src/context/TripContext';
import { AuthProvider } from './src/context/AuthContext';
import { DrawerProvider } from './src/context/DrawerContext';

export default function App() {
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
