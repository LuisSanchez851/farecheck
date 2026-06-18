import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { formatCOP, formatDuracion, formatKm, formatHora } from '../../utils/format';
import { viajesClient } from '../../services/api.client';
import type { DetalleViajeScreenProps } from '../../types/navigation';
import type { Semaforo, Viaje } from '../../types/api.types';

const SEM: Record<Semaforo, { color: string; bg: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  VERDE:    { color: colors.green, bg: colors.greenBg, label: 'Buen servicio',  icon: 'checkmark-circle' },
  AMARILLO: { color: colors.amber, bg: colors.amberBg, label: 'Evalúa antes',   icon: 'help-circle' },
  ROJO:     { color: colors.red,   bg: colors.redBg,   label: 'No rentable',    icon: 'close-circle' },
};

function estadoBadge(aceptado: boolean | null) {
  if (aceptado === true) return { label: 'Aceptado', color: colors.green, bg: colors.greenBg };
  if (aceptado === false) return { label: 'Rechazado', color: colors.red, bg: colors.redBg };
  return { label: 'Sin decisión', color: colors.textSecondary, bg: colors.background };
}

export default function DetalleViajeScreen({ navigation, route }: DetalleViajeScreenProps) {
  const { id } = route.params;
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await viajesClient.getById(id);
      setViaje(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const Header = (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color={colors.navy} />
      </TouchableOpacity>
      <Text style={styles.headerTitulo}>Detalle del viaje</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {Header}
        <View style={styles.centro}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (error || !viaje) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {Header}
        <View style={styles.centro}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
          <Text style={styles.errorTexto}>No pudimos cargar este viaje.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sem = SEM[viaje.semaforo];
  const estado = estadoBadge(viaje.aceptado);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Header}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cabecera tintada por semáforo */}
        <View style={[styles.hero, { backgroundColor: sem.bg, borderTopColor: sem.color }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.plataforma}>{viaje.plataforma?.nombre ?? 'Servicio'}</Text>
              <Text style={styles.hora}>{formatHora(viaje.registrado_en)}</Text>
            </View>
            <View style={[styles.semBadge, { backgroundColor: sem.color }]}>
              <Ionicons name={sem.icon} size={14} color={colors.white} />
              <Text style={styles.semBadgeTexto}>{viaje.semaforo}</Text>
            </View>
          </View>
          <Text style={[styles.valor, { color: sem.color }]}>{formatCOP(viaje.valor_cop)}</Text>
          <Text style={styles.semLabel}>{sem.label}</Text>
        </View>

        {/* Estado */}
        <View style={styles.estadoRow}>
          <Text style={styles.estadoLabel}>Estado</Text>
          <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
            <Text style={[styles.estadoTexto, { color: estado.color }]}>{estado.label}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Dato label="COP / km" valor={formatCOP(viaje.valor_copkm)} />
          <Dato label="Km recorrido" valor={formatKm(viaje.km_recorrido)} />
          <Dato label="Tiempo total" valor={formatDuracion(viaje.tiempo_total_min)} />
          <Dato label="Km recogida" valor={formatKm(viaje.km_recogida)} />
        </View>

        {/* Ruta (sin direcciones — el OCR aún no las captura; mostramos las distancias) */}
        <Text style={styles.seccionTitulo}>Ruta</Text>
        <View style={styles.rutaCard}>
          <View style={styles.rutaPunto}>
            <View style={[styles.rutaDot, { backgroundColor: colors.primary }]} />
            <View style={styles.rutaTextoBloque}>
              <Text style={styles.rutaTitulo}>Punto de recogida</Text>
              <Text style={styles.rutaSub}>{formatKm(viaje.km_recogida)} · {formatDuracion(viaje.tiempo_recogida_min)}</Text>
            </View>
          </View>
          <View style={styles.rutaLinea} />
          <View style={styles.rutaPunto}>
            <View style={[styles.rutaDot, { backgroundColor: colors.navy }]} />
            <View style={styles.rutaTextoBloque}>
              <Text style={styles.rutaTitulo}>Destino</Text>
              <Text style={styles.rutaSub}>{formatKm(viaje.km_recorrido)} de recorrido</Text>
            </View>
          </View>
        </View>

        {/* Pasajero (si hay datos) */}
        {(viaje.calificacion_pasajero != null || viaje.viajes_pasajero != null) && (
          <>
            <Text style={styles.seccionTitulo}>Pasajero</Text>
            <View style={styles.pasajeroCard}>
              {viaje.calificacion_pasajero != null && (
                <View style={styles.pasajeroItem}>
                  <Ionicons name="star" size={16} color={colors.amber} />
                  <Text style={styles.pasajeroTexto}>{viaje.calificacion_pasajero.toFixed(1)}</Text>
                </View>
              )}
              {viaje.viajes_pasajero != null && (
                <View style={styles.pasajeroItem}>
                  <Ionicons name="car" size={16} color={colors.textSecondary} />
                  <Text style={styles.pasajeroTexto}>{viaje.viajes_pasajero} viajes</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Botón */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.boton} onPress={() => navigation.navigate('TurnoActivo')} activeOpacity={0.85}>
          <Text style={styles.botonTexto}>Ver turno</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoValor} numberOfLines={1}>{valor}</Text>
      <Text style={styles.datoLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  errorTexto: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  headerTitulo: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy },

  hero: {
    borderRadius: radius.xl,
    borderTopWidth: 3,
    padding: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  plataforma: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy },
  hora: { fontSize: typography.caption.fontSize, color: colors.textSecondary, marginTop: 2 },
  semBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  semBadgeTexto: { fontSize: typography.label.fontSize, fontWeight: '700', color: colors.white, letterSpacing: 0.4 },
  valor: { fontSize: typography.display.fontSize, fontWeight: typography.display.fontWeight, marginTop: spacing.lg },
  semLabel: { fontSize: typography.body.fontSize, color: colors.textSecondary, marginTop: 2 },

  estadoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.md,
  },
  estadoLabel: { fontSize: typography.body.fontSize, color: colors.navy, fontWeight: typography.label.fontWeight },
  estadoBadge: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full },
  estadoTexto: { fontSize: typography.caption.fontSize, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  dato: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  datoValor: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy },
  datoLabel: { fontSize: typography.caption.fontSize, color: colors.textSecondary, marginTop: 2 },

  seccionTitulo: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy, marginTop: spacing.sm, marginBottom: spacing.md },
  rutaCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  rutaPunto: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rutaDot: { width: 12, height: 12, borderRadius: radius.full },
  rutaLinea: { width: 1, height: 20, backgroundColor: colors.border, marginLeft: 5, marginVertical: 2 },
  rutaTextoBloque: { flex: 1 },
  rutaTitulo: { fontSize: typography.body.fontSize, color: colors.navy, fontWeight: typography.label.fontWeight },
  rutaSub: { fontSize: typography.caption.fontSize, color: colors.textSecondary, marginTop: 2 },

  pasajeroCard: {
    flexDirection: 'row', gap: spacing.xl, backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md,
  },
  pasajeroItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pasajeroTexto: { fontSize: typography.body.fontSize, color: colors.navy },

  footer: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background,
  },
  boton: { paddingVertical: 16, borderRadius: radius.md, backgroundColor: colors.navy, alignItems: 'center' },
  botonTexto: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },
});
