import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { formatCOP, formatHora, formatKm } from '../../utils/format';
import type { Viaje, Semaforo } from '../../types/api.types';

const SEMAFORO_COLOR: Record<Semaforo, string> = {
  VERDE:    colors.green,
  AMARILLO: colors.amber,
  ROJO:     colors.red,
};

interface ViajeCardProps {
  viaje: Viaje;
  onPress?: (viaje: Viaje) => void;
}

// Tarjeta reutilizable de un viaje: plataforma + hora a la izquierda,
// valor (en color del semáforo) + km a la derecha, con barra de color del semáforo.
export default function ViajeCard({ viaje, onPress }: ViajeCardProps) {
  const color = SEMAFORO_COLOR[viaje.semaforo];
  const plataforma = viaje.plataforma?.nombre ?? 'Servicio';

  const contenido = (
    <View style={styles.card}>
      <View style={[styles.barra, { backgroundColor: color }]} />

      <View style={styles.izquierda}>
        <Text style={styles.plataforma} numberOfLines={1}>{plataforma}</Text>
        <Text style={styles.hora}>{formatHora(viaje.registrado_en)}</Text>
      </View>

      <View style={styles.derecha}>
        <Text style={[styles.valor, { color }]}>{formatCOP(viaje.valor_cop)}</Text>
        <Text style={styles.km}>{formatKm(viaje.km_recorrido)}</Text>
      </View>
    </View>
  );

  if (!onPress) return contenido;

  return (
    <TouchableOpacity onPress={() => onPress(viaje)} activeOpacity={0.7}>
      {contenido}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    paddingLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  barra: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  izquierda: {
    flex: 1,
  },
  plataforma: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.navy,
  },
  hora: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  derecha: {
    alignItems: 'flex-end',
  },
  valor: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.h1.fontWeight,
  },
  km: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
