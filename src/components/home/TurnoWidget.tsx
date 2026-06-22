import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { formatDuracion } from '../../utils/format';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Loader from '../ui/Loader';
import type { TurnoActivoResponse } from '../../types/api.types';

interface TurnoWidgetProps {
  turno: TurnoActivoResponse | null;
  loading?: boolean;
  testID?: string;
}

export default function TurnoWidget({
  turno,
  loading = false,
  testID,
}: TurnoWidgetProps) {
  const [duracion, setDuracion] = useState('0h 0m');

  useEffect(() => {
    if (!turno?.inicio) return;
    const inicioStr = turno.inicio;

    const interval = setInterval(() => {
      const ahora = new Date();
      const inicio = new Date(inicioStr);
      const minutos = Math.floor((ahora.getTime() - inicio.getTime()) / 1000 / 60);
      setDuracion(formatDuracion(minutos));
    }, 1000);

    return () => clearInterval(interval);
  }, [turno?.inicio]);

  if (loading) {
    return (
      <Card padding={spacing.lg} testID={`${testID}-loading`}>
        <Loader />
      </Card>
    );
  }

  if (!turno) {
    return (
      <Card padding={spacing.xl} style={styles.emptyCard} testID={`${testID}-empty`}>
        <Text variant="body" color={colors.textSecondary} align="center">
          Inicia un turno para comenzar a registrar viajes.
        </Text>
      </Card>
    );
  }

  return (
    <Card padding={spacing.lg} style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text variant="caption" weight="600" color={colors.green}>
            TURNO ACTIVO
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <View>
            <Text variant="caption" color={colors.textSecondary}>
              Duración
            </Text>
            <Text variant="h2" weight="700" color={colors.navy}>
              {duracion}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <Ionicons name="car-outline" size={20} color={colors.primary} />
          <View>
            <Text variant="caption" color={colors.textSecondary}>
              Viajes
            </Text>
            <Text variant="h2" weight="700" color={colors.navy}>
              {turno.total_viajes ?? 0}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing.md },
  emptyCard: { minHeight: 100, justifyContent: 'center' },
  header: {
    marginBottom: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
