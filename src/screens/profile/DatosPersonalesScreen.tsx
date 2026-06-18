import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import type { DatosPersonalesScreenProps } from '../../types/navigation';

// Placeholder — la edición completa de datos personales y del vehículo se
// implementa más adelante (S2-06 / Sprint 4 con subida de foto a Cloudinary).
export default function DatosPersonalesScreen({ navigation }: DatosPersonalesScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Mis datos personales</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.centro}>
        <Ionicons name="person-outline" size={36} color={colors.textMuted} />
        <Text style={styles.texto}>La edición de datos personales y del vehículo llega pronto.</Text>
      </View>
    </SafeAreaView>
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
  titulo: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  texto: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center' },
});
