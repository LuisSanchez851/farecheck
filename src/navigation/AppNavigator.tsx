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
import { authClient } from '../services/api.client';
import { useAuthStore } from '../store/auth.store';
import { useAppStore } from '../store/app.store';
import { colors } from '../constants/colors';
import RootNavigator from './RootNavigator';

export default function AppNavigator() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { setUser, setConductor, setSuscripcion, reset } = useAuthStore();
  // Espera a que persist rehidrate onboardingComplete desde AsyncStorage
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // TEMPORAL: conductor de prueba para desarrollo (sin auth real).
  // Inyecta el conductor sembrado "smoke-conductor-a" en el store para que la UI
  // muestre identidad. Restaurar el bloque de auth real (comentado abajo) en producción.
  useEffect(() => {
    const ahora = new Date().toISOString();
    const fin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    setConductor({
      id: 'smoke-conductor-a',
      firebase_uid: 'smoke-conductor-a',
      auth_provider: 'phone',
      nombre: 'Test Conductor',
      email: 'test@farecheck.dev',
      telefono: '+573001112233',
      placa_vehiculo: null,
      marca_vehiculo: null,
      modelo_vehiculo: null,
      foto_url: null,
      umbral_verde_copkm: 1500,
      umbral_amarillo_copkm: 900,
      creado_en: ahora,
      actualizado_en: ahora,
    });
    setSuscripcion({
      id: 'dev-suscripcion',
      conductor_id: 'smoke-conductor-a',
      plan: 'TRIAL',
      estado: 'ACTIVA',
      inicio: ahora,
      fin,
    });
    setIsAuthReady(true);

    // ── Auth real (restaurar para producción) ──────────────────────────────────
    // const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
    //   if (!firebaseUser) { reset(); setIsAuthReady(true); return; }
    //   setUser(firebaseUser);
    //   try {
    //     const idToken = await firebaseUser.getIdToken();
    //     const { data } = await authClient.login({ firebase_token: idToken });
    //     setConductor(data.conductor);
    //     if (data.suscripcion) setSuscripcion(data.suscripcion);
    //   } catch { /* conductor_no_encontrado: ir a RegisterScreen */ }
    //   finally { setIsAuthReady(true); }
    // });
    // return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TEMPORAL: Auth desactivado para desarrollo
  // if (!fontsLoaded || !isAuthReady || !hasHydrated) {
  if (!fontsLoaded || !hasHydrated) {
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
