import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { useAuthStore } from '../../store/auth.store';
import { balanceClient, turnosClient, viajesClient, ApiError } from '../../services/api.client';

// Componentes extraídos (FASE 3)
import { BalanceWidget, TurnoWidget, ActionButtons } from '../../components/home';
import ViajeCard from '../../components/ui/ViajeCard';
import { Text, Loader } from '../../components/ui';

import type { HomeScreenProps } from '../../types/navigation';
import type { BalanceDiaResponse, TurnoActivoResponse, Viaje } from '../../types/api.types';

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const conductor = useAuthStore((s) => s.conductor);

  const [balance, setBalance] = useState<BalanceDiaResponse | null>(null);
  const [turno, setTurno] = useState<TurnoActivoResponse>(null);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [balanceError, setBalanceError] = useState(false);

  const cargar = useCallback(async () => {
    setBalanceError(false);
    // allSettled: que el fallo de una sección (p.ej. historial) no borre el resto
    const [bRes, tRes, vRes] = await Promise.allSettled([
      balanceClient.getDia(),
      turnosClient.getActivo(),
      viajesClient.getHistorial({ limit: 10 }),
    ]);

    if (bRes.status === 'fulfilled') setBalance(bRes.value.data);
    else setBalanceError(true);

    if (tRes.status === 'fulfilled') setTurno(tRes.value.data);

    if (vRes.status === 'fulfilled') setViajes(vRes.value.data.viajes ?? []);
    else setViajes([]);
  }, []);

  // Recarga cada vez que la pantalla toma foco (al volver de otra tab / iniciar turno)
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        await cargar();
        if (activo) setLoading(false);
      })();
      return () => {
        activo = false;
      };
    }, [cargar]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }, [cargar]);

  const handleIniciarTurno = async () => {
    setIniciando(true);
    try {
      await turnosClient.iniciar();
      await cargar(); // el turno activo aparece y el botón cambia de estado
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo iniciar el turno. Intenta de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setIniciando(false);
    }
  };

  const handleVerTurno = () => {
    navigation.navigate('TurnoActivo');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Header (sin cambios) ─────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerIzq}>
            {conductor?.foto_url ? (
              <Image source={{ uri: conductor.foto_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{iniciales(conductor?.nombre ?? '')}</Text>
              </View>
            )}
            <View style={{ marginLeft: spacing.md }}>
              <Text variant="caption" color={colors.textSecondary}>
                Hola,
              </Text>
              <Text variant="h2" weight="600" color={colors.navy} numberOfLines={1}>
                {conductor?.nombre ?? 'Conductor'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.campana}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notificaciones', 'Disponible próximamente.')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.navy} />
          </TouchableOpacity>
        </View>

        {/* ── Balance ──────────────────────────────────────────── */}
        <BalanceWidget
          balance={balance}
          loading={false}
          error={balanceError}
          testID="balance-widget"
        />

        {/* ── Turno ────────────────────────────────────────────── */}
        <TurnoWidget turno={turno} loading={false} testID="turno-widget" />

        {/* ── Historial de viajes ──────────────────────────────── */}
        <Text variant="h2" weight="600" color={colors.navy} style={styles.sectionTitle}>
          Historial de viajes
        </Text>

        {viajes.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" color={colors.textSecondary} align="center">
              Aún no hay viajes registrados. Inicia un turno para comenzar.
            </Text>
          </View>
        ) : (
          viajes.map((v) => (
            <ViajeCard
              key={v.id}
              viaje={v}
              onPress={(viaje) => navigation.navigate('DetalleViaje', { id: viaje.id })}
            />
          ))
        )}
      </ScrollView>

      {/* ── Botón inferior ───────────────────────────────────── */}
      <ActionButtons
        turno={turno}
        onIniciar={handleIniciarTurno}
        onVerTurno={handleVerTurno}
        loading={iniciando}
        testID="action-buttons"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  headerIzq: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: radius.full },
  avatarFallback: { backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  campana: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Secciones
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
});
