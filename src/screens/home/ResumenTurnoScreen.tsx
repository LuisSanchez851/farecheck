import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { formatCOP, formatDuracion, formatKm, formatFecha, formatHora } from '../../utils/format';
import { turnosClient, ApiError } from '../../services/api.client';
import type { ResumenTurnoScreenProps } from '../../types/navigation';
import type { TurnoResumenResponse } from '../../types/api.types';

export default function ResumenTurnoScreen({ navigation, route }: ResumenTurnoScreenProps) {
  const { turnoId } = route.params;
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.lg * 2 - spacing.lg * 2;

  const [turno, setTurno] = useState<TurnoResumenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await turnosClient.getById(turnoId);
      setTurno(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porHora = useMemo(() => {
    const m = new Map<number, number>();
    (turno?.viajes ?? []).forEach((v) => {
      if (v.aceptado) {
        const h = new Date(v.registrado_en).getHours();
        m.set(h, (m.get(h) ?? 0) + v.valor_cop);
      }
    });
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([hora, total]) => ({ hora, total }));
  }, [turno]);

  const irHistorial = () => navigation.getParent()?.navigate('BalanceTab');

  const nuevoTurno = async () => {
    setCreando(true);
    try {
      await turnosClient.iniciar();
    } catch (e) {
      // si ya hay turno activo u otro error, igual volvemos a Home
      if (e instanceof ApiError && e.status !== 409) {
        Alert.alert('Aviso', e.message);
      }
    } finally {
      setCreando(false);
      navigation.popToTop();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centro}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (error || !turno) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centro}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
          <Text style={styles.errorTexto}>No pudimos cargar el resumen del turno.</Text>
          <TouchableOpacity style={[styles.boton, styles.botonPrimario, { marginTop: spacing.lg }]} onPress={() => navigation.popToTop()}>
            <Text style={styles.botonTextoPrimario}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const promedioCopKm = turno.km_totales > 0 ? turno.ingreso_total_cop / turno.km_totales : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitulo}>Resumen del turno</Text>
        </View>

        {/* Tarjeta principal */}
        <View style={styles.cardPrincipal}>
          <View style={styles.checkCirculo}>
            <Ionicons name="checkmark" size={28} color={colors.white} />
          </View>
          <Text style={styles.fecha}>{formatFecha(turno.inicio)}</Text>
          <Text style={styles.totalGrande}>{formatCOP(turno.ingreso_total_cop)}</Text>

          <View style={styles.metaRow}>
            <Meta label="Inicio" valor={formatHora(turno.inicio)} />
            <Meta label="Fin" valor={turno.fin ? formatHora(turno.fin) : '—'} />
            <Meta label="Tiempo" valor={formatDuracion(turno.tiempo_activo_min)} />
            <Meta label="Km total" valor={formatKm(turno.km_totales)} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat label="Viajes" valor={String(turno.total_viajes)} sub={`${turno.viajes_aceptados} acept. · ${turno.viajes_rechazados} rech.`} />
          <Stat label="Promedio" valor={`${formatCOP(promedioCopKm)}`} sub="por km" />
        </View>

        {/* Gráfico ingreso por hora */}
        <Text style={styles.seccionTitulo}>Ingreso por hora</Text>
        <View style={styles.chartCard}>
          {porHora.length === 0 ? (
            <Text style={styles.sinDatos}>Sin ingresos registrados en este turno.</Text>
          ) : (
            <BarrasPorHora data={porHora} width={chartWidth} />
          )}
        </View>
      </ScrollView>

      {/* Botones */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={irHistorial} activeOpacity={0.85}>
          <Text style={styles.botonTextoSecundario}>Ver historial</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.boton, styles.botonPrimario, { opacity: creando ? 0.6 : 1 }]}
          onPress={nuevoTurno}
          disabled={creando}
          activeOpacity={0.85}
        >
          {creando ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.botonTextoPrimario}>Nuevo turno</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Meta({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaValor}>{valor}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function Stat({ label, valor, sub }: { label: string; valor: string; sub: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValor} numberOfLines={1}>{valor}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function BarrasPorHora({ data, width }: { data: { hora: number; total: number }[]; width: number }) {
  const height = 130;
  const padBottom = 20;
  const chartH = height - padBottom;
  const max = Math.max(...data.map((d) => d.total), 1);
  const slot = width / data.length;
  const barW = Math.min(28, slot * 0.6);

  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const h = (d.total / max) * (chartH - 8);
        const x = i * slot + (slot - barW) / 2;
        const y = chartH - h;
        return (
          <React.Fragment key={d.hora}>
            <Rect x={x} y={y} width={barW} height={h} rx={4} fill={colors.primary} />
            <SvgText x={x + barW / 2} y={height - 6} fontSize={10} fill={colors.textSecondary} textAnchor="middle">
              {`${d.hora}h`}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  errorTexto: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  headerRow: { paddingVertical: spacing.md },
  headerTitulo: { fontSize: typography.h1.fontSize, fontWeight: typography.h1.fontWeight, color: colors.navy },

  cardPrincipal: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkCirculo: {
    width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.green,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  fecha: { fontSize: typography.body.fontSize, color: colors.cyanLight },
  totalGrande: { fontSize: typography.display.fontSize, fontWeight: typography.display.fontWeight, color: colors.white, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: spacing.xl },
  meta: { alignItems: 'center', flex: 1 },
  metaValor: { fontSize: typography.body.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },
  metaLabel: { fontSize: typography.caption.fontSize, color: colors.darkMuted, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
  },
  statLabel: { fontSize: typography.caption.fontSize, color: colors.textSecondary },
  statValor: { fontSize: typography.h1.fontSize, fontWeight: typography.h1.fontWeight, color: colors.navy, marginTop: spacing.xs },
  statSub: { fontSize: typography.caption.fontSize, color: colors.textSecondary, marginTop: 2 },

  seccionTitulo: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy, marginTop: spacing.md, marginBottom: spacing.md },
  chartCard: { backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  sinDatos: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },

  footer: {
    flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background,
  },
  boton: { flex: 1, paddingVertical: 16, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  botonPrimario: { backgroundColor: colors.primary },
  botonSecundario: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  botonTextoPrimario: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },
  botonTextoSecundario: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy },
});
