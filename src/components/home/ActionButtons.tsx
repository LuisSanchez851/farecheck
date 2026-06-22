import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../constants/spacing';
import Button from '../ui/Button';
import type { TurnoActivoResponse } from '../../types/api.types';

interface ActionButtonsProps {
  turno: TurnoActivoResponse | null;
  onIniciar: () => Promise<void>;
  onVerTurno?: () => void;
  loading?: boolean;
  testID?: string;
}

export default function ActionButtons({
  turno,
  onIniciar,
  onVerTurno,
  loading = false,
  testID,
}: ActionButtonsProps) {
  return (
    <View style={styles.container} testID={testID}>
      {turno ? (
        <Button
          label="Ver turno activo"
          onPress={onVerTurno || (() => {})}
          variant="success"
          size="lg"
          icon="radio-outline"
          testID={`${testID}-ver-turno`}
        />
      ) : (
        <Button
          label="Iniciar turno"
          onPress={onIniciar}
          variant="primary"
          size="lg"
          icon="play"
          loading={loading}
          testID={`${testID}-iniciar`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
});
