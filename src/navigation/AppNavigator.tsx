import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { subscribeToAuthChanges } from '../services/auth.service';
import { authClient, ApiError } from '../services/api.client';
import { useAuthStore } from '../store/auth.store';
import { useAppStore } from '../store/app.store';
import { colors } from '../constants/colors';
import RootNavigator from './RootNavigator';

export default function AppNavigator() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { setUser, setConductor, setSuscripcion, setNeedsRegistration, reset } = useAuthStore();
  // Espera a que persist rehidrate onboardingComplete desde AsyncStorage
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Auth REAL: escucha el estado de Firebase. Al iniciar sesión (Google/teléfono)
  // consultamos el backend (/auth/login); si el conductor existe → AppTabs, si no
  // (conductor_no_encontrado) marcamos needsRegistration para enviar a RegisterScreen.
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        reset();
        setIsAuthReady(true);
        return;
      }
      setUser(firebaseUser);
      try {
        const idToken = await firebaseUser.getIdToken();
        const { data } = await authClient.login({ firebase_token: idToken });
        if (data.suscripcion) setSuscripcion(data.suscripcion);
        setConductor(data.conductor); // isAuthenticated = true
      } catch (e) {
        // Firebase OK pero el conductor no está en BD → hay que registrarlo.
        if (e instanceof ApiError && e.code === 'conductor_no_encontrado') {
          setNeedsRegistration(true);
        }
      } finally {
        setIsAuthReady(true);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!fontsLoaded || !isAuthReady || !hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
