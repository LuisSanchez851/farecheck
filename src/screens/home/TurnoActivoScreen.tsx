import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { formatCOP, formatDuracion, formatKm, formatCronometro } from '../../utils/format';
import { turnosClient, ApiError } from '../../services/api.client';
import ViajeCard from '../../components/ui/ViajeCard';
import type { TurnoActivoScreenProps } from '../../types/navigation';
import type { TurnoActivoResponse } from '../../types/api.types';

// Segundos de tiempo activo a partir del turno: (ahora − inicio) − pausas acumuladas
// − pausa abierta actual (si está pausado en este momento).
function calcularSegundosActivos(turno: NonNullable<TurnoActivoResponse>): number {
  const ahora = Date.now();
  let activoMs = ahora - new Date(turno.inicio).getTime() - turno.tiempo_pausa_min * 60_000;
  if (turno.estado === 'PAUSADO' && turno.pausa_actual_inicio) {
    activoMs -= ahora - new Date(turno.pausa_actual_inicio).getTime();
  }
  return Math.max(0, Math.floor(activoMs / 1000));
}

export default function TurnoActivoScreen({ navigation }: TurnoActivoScreenProps) {
  const [turno, setTurno] = useState<TurnoActivoResponse>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accionando, setAccionando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [corriendo, setCorriendo] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await turnosClient.getActivo();
    setTurno(data);
    if (data) {
      setSegundos(calcularSegundosActivos(data));
      setCorriendo(data.estado === 'ACTIVO');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await cargar();
      } catch {
        // si falla la carga inicial, el render muestra el estado vacío
      } finally {
        setLoading(false);
      }
    })();
  }, [cargar]);

  // Tick del cronómetro: solo avanza mientras el turno está corriendo (ACTIVO)
  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [corriendo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await cargar();
    } catch {
      // silencioso — se conserva lo último cargado
    } finally {
      setRefreshing(false);
    }
  }, [cargar]);

  const handlePausarReanudar = async () => {
    if (!turno) return;
    setAccionando(true);
    try {
      if (turno.estado === 'ACTIVO') {
        const { data } = await turnosClient.pausar(turno.id);
        setCorriendo(false);
        setTurno((prev) =>
          prev ? { ...prev, estado: data.estado, tiempo_pausa_min: data.tiempo_pausa_min } : prev,
        );
      } else {
        const { data } = await turnosClient.reanudar(turno.id);
        setSegundos(calcularSegundosActivos({ ...turno, ...data, pausa_actual_inicio: null }));
        setCorriendo(true);
        setTurno((prev) =>
          prev ? { ...prev, estado: data.estado, tiempo_pausa_min: data.tiempo_pausa_min } : prev,
        );
      }
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'No se pudo actualizar el turno.');
    } finally {
      setAccionando(false);
    }
  };

  const handleFinalizar = () => {
    if (!turno) return;
    Alert.alert('Finalizar turno', '¿Seguro que quieres finalizar este turno?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'destructive',
        onPress: async () => {
          setAccionando(true);
          try {
            const { data } = await turnosClient.finalizar(turno.id);
            navigation.replace('ResumenTurno', { turnoId: data.id });
          } catch (e) {
            Alert.alert('Error', e instanceof ApiError ? e.message : 'No se pudo finalizar el turno.');
          } finally {
            setAccionando(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.containerDark}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!turno) {
    return (
      <SafeAreaView style={styles.containerLight}>
        <View style={styles.centro}>
          <Ionicons name="time-outline" size={36} color={colors.textMuted} />
          <Text style={styles.vacioTexto}>No tienes un turno activo en este momento.</Text>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: colors.navy, marginTop: spacing.lg, paddingHorizontal: spacing.xl }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.botonTexto}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pausado = turno.estado === 'PAUSADO';

  return (
    <SafeAreaView style={styles.containerLight} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Header dark ──────────────────────────────────────── */}
        <SafeAreaView edges={['top']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>

            <View style={[styles.badge, { backgroundColor: pausado ? colors.amber : colors.green }]}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>{pausado ? 'EN PAUSA' : 'EN VIVO'}</Text>
            </View>
          </View>

          <Text style={styles.balanceLabel}>Balance acumulado</Text>
          <Text style={styles.balanceMonto}>{formatCOP(turno.ingreso_total_cop)}</Text>

          {/* 3 stat cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValor}>{formatCronometro(segundos)}</Text>
              <Text style={styles.statLabel}>Tiempo activo</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValor}>{turno.total_viajes}</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValor}>{formatKm(turno.km_totales)}</Text>
              <Text style={styles.statLabel}>Km total</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* ── Últimos viajes ───────────────────────────────────── */}
        <View style={styles.cuerpo}>
          <Text style={styles.seccionTitulo}>Últimos viajes</Text>
          {turno.viajes.length === 0 ? (
            <View style={styles.vacioViajes}>
              <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
              <Text style={styles.vacioTexto}>Aún no has registrado viajes en este turno.</Text>
            </View>
          ) : (
            turno.viajes.map((v) => (
              <ViajeCard key={v.id} viaje={v} onPress={(viaje) => navigation.navigate('DetalleViaje', { id: viaje.id })} />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Footer: Pausar/Reanudar + Finalizar ─────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.boton, styles.botonSecundario, { opacity: accionando ? 0.6 : 1 }]}
          onPress={handlePausarReanudar}
          disabled={accionando}
          activeOpacity={0.85}
        >
          <Ionicons name={pausado ? 'play' : 'pause'} size={18} color={colors.navy} />
          <Text style={[styles.botonTexto, { color: colors.navy }]}>
            {pausado ? 'Reanudar' : 'Pausar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boton, { backgroundColor: colors.red, flex: 1, opacity: accionando ? 0.6 : 1 }]}
          onPress={handleFinalizar}
          disabled={accionando}
          activeOpacity={0.85}
        >
          <Ionicons name="stop" size={18} color={colors.white} />
          <Text style={styles.botonTexto}>Finalizar turno</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerDark: { flex: 1, backgroundColor: colors.navy },
  containerLight: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  scroll: { paddingBottom: spacing.xl },

  // Header
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.white },
  badgeText: { fontSize: typography.label.fontSize, fontWeight: '700', color: colors.white, letterSpacing: 0.5 },

  balanceLabel: { fontSize: typography.body.fontSize, color: colors.cyanLight, marginTop: spacing.md },
  balanceMonto: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    color: colors.white,
    marginTop: spacing.xs,
  },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValor: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },
  statLabel: { fontSize: typography.caption.fontSize, color: colors.darkMuted },

  // Cuerpo
  cuerpo: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  seccionTitulo: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  vacioViajes: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  vacioTexto: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  botonSecundario: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
  },
  botonTexto: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },
});
