import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { formatCOP } from '../../utils/format';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Badge from '../ui/Badge';
import Loader from '../ui/Loader';
import type { BalanceDiaResponse } from '../../types/api.types';

interface BalanceWidgetProps {
  balance: BalanceDiaResponse | null;
  loading?: boolean;
  error?: boolean;
  testID?: string;
}

export default function BalanceWidget({
  balance,
  loading = false,
  error = false,
  testID,
}: BalanceWidgetProps) {
  if (loading) {
    return (
      <Card backgroundColor={colors.navy} padding={spacing.xl} testID={`${testID}-loading`}>
        <Loader color={colors.cyanLight} />
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card backgroundColor={colors.navy} padding={spacing.xl} testID={`${testID}-error`}>
        <Text color={colors.cyanLight} variant="body">
          No pudimos cargar tu balance. Desliza para reintentar.
        </Text>
      </Card>
    );
  }

  const comparativa = balance.comparativa_ayer_pct ?? 0;
  const isPositive = comparativa >= 0;

  return (
    <Card
      backgroundColor={colors.navy}
      padding={spacing.xl}
      style={styles.card}
      testID={testID}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="body" color={colors.cyanLight} weight="600">
          Balance del día
        </Text>
        <Badge
          label={`${isPositive ? '+' : ''}${comparativa}%`}
          icon={isPositive ? 'trending-up' : 'trending-down'}
          variant={isPositive ? 'success' : 'danger'}
          size="sm"
        />
      </View>

      {/* Monto */}
      <Text variant="display" color={colors.white} weight="700" style={styles.monto}>
        {formatCOP(balance.total_cop)}
      </Text>

      {/* Footer stats */}
      <View style={styles.footer}>
        <View style={styles.stat}>
          <Ionicons name="car-outline" size={16} color={colors.cyanLight} />
          <Text variant="caption" color={colors.cyanLight}>
            {balance.viajes} viajes
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Ionicons name="navigate-outline" size={16} color={colors.cyanLight} />
          <Text variant="caption" color={colors.cyanLight}>
            {balance.km_total?.toFixed(1) ?? '0'} km
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monto: {
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.navy,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.navy,
  },
});
