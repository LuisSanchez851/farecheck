import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card, Text, Button } from '../../components/ui';
import type { ContactosScreenProps } from '../../types/navigation';

interface ContactoEmergencia {
  id: string;
  nombre: string;
  telefono: string;
  relacion?: string;
}

export default function ContactosScreen({ navigation }: ContactosScreenProps) {
  // Estructura lista para CRUD. Los endpoints del backend están pendientes (S4-07);
  // por eso las acciones muestran un aviso provisional en lugar de llamar a la API.
  // TODO(S4-07): cargar con conductorClient.getContactos() en un useEffect.
  const [contactos, setContactos] = useState<ContactoEmergencia[]>([]);

  const handleAgregar = () => {
    // TODO(S4-07): navegar a un formulario / conductorClient.crearContacto(...)
    Alert.alert('Próximamente', 'Pronto podrás agregar tus contactos de emergencia.');
  };

  const handleEliminar = (id: string) => {
    Alert.alert('Eliminar contacto', '¿Seguro que deseas eliminar este contacto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        // TODO(S4-07): conductorClient.eliminarContacto(id) antes de actualizar el estado.
        onPress: () => setContactos((prev) => prev.filter((c) => c.id !== id)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text variant="h2" weight="600" color={colors.navy}>
          Contactos de emergencia
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="body" color={colors.textSecondary} style={styles.intro}>
          Agrega personas a las que avisar en caso de emergencia durante tus turnos.
        </Text>

        {contactos.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={36} color={colors.textMuted} />
            <Text variant="body" color={colors.textSecondary} align="center" style={styles.emptyText}>
              Aún no tienes contactos de emergencia.
            </Text>
            <Button
              label="Agregar contacto"
              onPress={handleAgregar}
              variant="primary"
              size="md"
              icon="add"
            />
          </View>
        ) : (
          contactos.map((c) => (
            <Card key={c.id} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text variant="body" weight="600" color={colors.navy}>
                  {c.nombre}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {c.telefono}
                  {c.relacion ? ` · ${c.relacion}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleEliminar(c.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.red} />
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>

      {/* CTA cuando ya hay contactos */}
      {contactos.length > 0 && (
        <View style={styles.footer}>
          <Button
            label="Agregar contacto"
            onPress={handleAgregar}
            variant="primary"
            size="lg"
            icon="add"
          />
        </View>
      )}
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
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  intro: { marginBottom: spacing.lg },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyText: { paddingHorizontal: spacing.xl },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  contactInfo: { flex: 1, gap: 2 },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
