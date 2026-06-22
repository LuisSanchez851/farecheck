import React, { useMemo, useState } from 'react';
import { View, TextInput, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { conductorClient, ApiError } from '../../services/api.client';
import { useAuthStore } from '../../store/auth.store';
import { Card, Text, Button } from '../../components/ui';
import type { DatosPersonalesScreenProps } from '../../types/navigation';

export default function DatosPersonalesScreen({ navigation }: DatosPersonalesScreenProps) {
  const conductor = useAuthStore((s) => s.conductor);
  const setConductor = useAuthStore((s) => s.setConductor);

  const [nombre, setNombre] = useState(conductor?.nombre ?? '');
  const [guardando, setGuardando] = useState(false);

  const nombreLimpio = nombre.trim();

  // El backend (UpdatePerfilBody) solo permite editar el nombre por ahora;
  // correo, teléfono y documento se muestran como información de cuenta.
  const error = useMemo(() => {
    if (nombreLimpio.length < 2) return 'Ingresa tu nombre (mínimo 2 caracteres).';
    return null;
  }, [nombreLimpio]);

  const sinCambios = nombreLimpio === (conductor?.nombre ?? '').trim();

  const guardar = async () => {
    if (error || sinCambios) return;
    setGuardando(true);
    try {
      const { data } = await conductorClient.updatePerfil({ nombre: nombreLimpio });
      setConductor(data);
      Alert.alert('Listo', 'Tus datos se actualizaron correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'No se pudieron guardar tus datos.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text variant="h2" weight="600" color={colors.navy}>
          Mis datos personales
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Editable */}
        <Card style={styles.card}>
          <Text variant="overline" color={colors.textSecondary} style={styles.label}>
            Nombre completo
          </Text>
          <TextInput
            style={styles.inputField}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            maxLength={80}
            returnKeyType="done"
          />
          {!!error && <Text variant="caption" color={colors.red} style={styles.error}>{error}</Text>}
        </Card>

        {/* Información de cuenta (solo lectura) */}
        <Text variant="overline" color={colors.textSecondary} style={styles.seccion}>
          Información de cuenta
        </Text>
        <Card style={styles.card}>
          <InfoRow label="Correo" value={conductor?.email ?? 'No registrado'} />
          <View style={styles.separator} />
          <InfoRow label="Teléfono" value={conductor?.telefono ?? 'No registrado'} />
          <View style={styles.separator} />
          <InfoRow label="Documento" value="No registrado" />
        </Card>
        <Text variant="caption" color={colors.textMuted} style={styles.nota}>
          Para cambiar tu correo, teléfono o documento, escríbenos a soporte.
        </Text>
      </ScrollView>

      {/* Guardar */}
      <View style={styles.footer}>
        <Button
          label="Guardar cambios"
          onPress={guardar}
          variant="primary"
          size="lg"
          loading={guardando}
          disabled={!!error || sinCambios}
        />
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="body" color={colors.textSecondary}>
        {label}
      </Text>
      <Text variant="body" weight="600" color={colors.navy} numberOfLines={1} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  card: { marginBottom: spacing.md },
  label: { marginBottom: spacing.sm },
  inputField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  error: { marginTop: spacing.sm },

  seccion: { marginTop: spacing.md, marginBottom: spacing.sm },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  separator: { height: 1, backgroundColor: colors.border },
  nota: { marginTop: spacing.sm, paddingHorizontal: spacing.xs },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
