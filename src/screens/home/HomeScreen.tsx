import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { formatCOP, formatDuracion } from '../../utils/format';
import { useAuthStore } from '../../store/auth.store';
import { balanceClient, turnosClient, viajesClient, ApiError } from '../../services/api.client';
import ViajeCard from '../../components/ui/ViajeCard';
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
    // TurnoActivoScreen se registra en S2-02; navegamos por nombre tipado.
    navigation.navigate('TurnoActivo');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const comparativa = balance?.comparativa_ayer_pct ?? 0;
  const comparativaPositiva = comparativa >= 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Header ───────────────────────────────────────────── */}
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
              <Text style={styles.saludo}>Hola,</Text>
              <Text style={styles.nombre} numberOfLines={1}>
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

        {/* ── Card de balance ──────────────────────────────────── */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Balance del día</Text>
            {!balanceError && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: comparativaPositiva ? colors.green : colors.red },
                ]}
              >
                <Ionicons
                  name={comparativaPositiva ? 'trending-up' : 'trending-down'}
                  size={13}
                  color={colors.white}
                />
                <Text style={styles.badgeText}>
                  {comparativaPositiva ? '+' : ''}
                  {comparativa}%
                </Text>
              </View>
            )}
          </View>

          {balanceError ? (
            <Text style={styles.balanceError}>No pudimos cargar tu balance. Desliza para reintentar.</Text>
          ) : (
            <Text style={styles.balanceMonto}>{formatCOP(balance?.total_cop ?? 0)}</Text>
          )}
        </View>

        {/* ── Stat cards ───────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.statValor}>{formatDuracion(balance?.tiempo_total_min ?? 0)}</Text>
            <Text style={styles.statLabel}>Tiempo activo</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="car-outline" size={20} color={colors.primary} />
            <Text style={styles.statValor}>{balance?.viajes ?? 0}</Text>
            <Text style={styles.statLabel}>Viajes completados</Text>
          </View>
        </View>

        {/* ── Historial ────────────────────────────────────────── */}
        <Text style={styles.seccionTitulo}>Historial de viajes</Text>

        {viajes.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
            <Text style={styles.vacioTexto}>
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

      {/* ── Botón inferior ─────────────────────────────────────── */}
      <View style={styles.footer}>
        {turno ? (
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: colors.green }]}
            activeOpacity={0.85}
            onPress={handleVerTurno}
          >
            <Ionicons name="radio-outline" size={18} color={colors.white} />
            <Text style={styles.botonTexto}>Ver turno activo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: colors.navy, opacity: iniciando ? 0.6 : 1 }]}
            activeOpacity={0.85}
            onPress={handleIniciarTurno}
            disabled={iniciando}
          >
            {iniciando ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="play" size={18} color={colors.white} />
                <Text style={styles.botonTexto}>Iniciar turno</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  saludo: { fontSize: typography.caption.fontSize, color: colors.textSecondary },
  nombre: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy },
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

  // Balance
  balanceCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.sm,
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: typography.body.fontSize, color: colors.cyanLight },
  balanceMonto: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    color: colors.white,
    marginTop: spacing.sm,
  },
  balanceError: { fontSize: typography.body.fontSize, color: colors.cyanLight, marginTop: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.white },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statValor: { fontSize: typography.h1.fontSize, fontWeight: typography.h1.fontWeight, color: colors.navy },
  statLabel: { fontSize: typography.caption.fontSize, color: colors.textSecondary },

  // Historial
  seccionTitulo: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.navy,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  vacio: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  vacioTexto: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 21,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  botonTexto: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },
});
