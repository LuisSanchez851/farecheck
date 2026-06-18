import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Modal,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { signOut } from '../../services/auth.service';
import { conductorClient } from '../../services/api.client';
import { useAuthStore } from '../../store/auth.store';
import type { ProfileScreenProps } from '../../types/navigation';

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const conductor = useAuthStore((s) => s.conductor);
  const setConductor = useAuthStore((s) => s.setConductor);
  const reset = useAuthStore((s) => s.reset);

  const [refreshing, setRefreshing] = useState(false);
  const [fotoModal, setFotoModal] = useState(false);

  const cargarPerfil = useCallback(async () => {
    try {
      const { data } = await conductorClient.getPerfil();
      setConductor(data);
    } catch {
      // se conserva lo que ya hay en el store
    }
  }, [setConductor]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarPerfil();
    setRefreshing(false);
  }, [cargarPerfil]);

  const handleCerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Confirmas que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          reset(); // RootNavigator vuelve al AuthStack (Login)
        },
      },
    ]);
  };

  const fotoPlaceholder = (origen: string) => {
    setFotoModal(false);
    Alert.alert('Foto de perfil', `Subir foto (${origen}) estará disponible en S4-06 con Cloudinary.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.headerTitulo}>Perfil</Text>

        {/* ── Avatar + nombre ──────────────────────────────────── */}
        <View style={styles.avatarBloque}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setFotoModal(true)}>
            {conductor?.foto_url ? (
              <Image source={{ uri: conductor.foto_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{iniciales(conductor?.nombre ?? '')}</Text>
              </View>
            )}
            <View style={styles.camara}>
              <Ionicons name="camera" size={15} color={colors.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.nombre}>{conductor?.nombre ?? 'Conductor'}</Text>
          {!!(conductor?.email || conductor?.telefono) && (
            <Text style={styles.contacto}>{conductor?.email ?? conductor?.telefono}</Text>
          )}
        </View>

        {/* ── Opciones ─────────────────────────────────────────── */}
        <View style={styles.grupo}>
          <Opcion
            icono="options-outline"
            label="Configurar umbrales"
            onPress={() => navigation.navigate('ConfigUmbrales')}
          />
          <View style={styles.separador} />
          <Opcion
            icono="person-outline"
            label="Mis datos personales"
            onPress={() => navigation.navigate('DatosPersonales')}
          />
        </View>

        <View style={styles.grupo}>
          <Opcion
            icono="log-out-outline"
            label="Cerrar sesión"
            color={colors.red}
            ocultarChevron
            onPress={handleCerrarSesion}
          />
        </View>
      </ScrollView>

      {/* ── Bottom sheet de foto ─────────────────────────────────── */}
      <Modal visible={fotoModal} transparent animationType="slide" onRequestClose={() => setFotoModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setFotoModal(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitulo}>Foto de perfil</Text>
            <SheetOpcion icono="camera-outline" label="Tomar foto" onPress={() => fotoPlaceholder('cámara')} />
            <SheetOpcion icono="image-outline" label="Elegir de la galería" onPress={() => fotoPlaceholder('galería')} />
            <TouchableOpacity style={styles.sheetCancelar} onPress={() => setFotoModal(false)} activeOpacity={0.7}>
              <Text style={styles.sheetCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Opcion({
  icono,
  label,
  onPress,
  color = colors.navy,
  ocultarChevron = false,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  ocultarChevron?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.opcion} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icono} size={20} color={color} />
      <Text style={[styles.opcionLabel, { color }]}>{label}</Text>
      {!ocultarChevron && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

function SheetOpcion({
  icono,
  label,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.sheetOpcion} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icono} size={20} color={colors.navy} />
      <Text style={styles.sheetOpcionTexto}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  headerTitulo: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.navy,
    paddingVertical: spacing.md,
  },

  avatarBloque: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  avatar: { width: 96, height: 96, borderRadius: radius.full },
  avatarFallback: { backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.primary, fontSize: 32, fontWeight: '700' },
  camara: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  nombre: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.navy,
    marginTop: spacing.md,
  },
  contacto: { fontSize: typography.body.fontSize, color: colors.textSecondary, marginTop: spacing.xs },

  grupo: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  opcionLabel: { flex: 1, fontSize: typography.body.fontSize, fontWeight: typography.label.fontWeight },
  separador: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xxl },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  sheetTitulo: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  sheetOpcion: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  sheetOpcionTexto: { fontSize: typography.body.fontSize, color: colors.navy },
  sheetCancelar: { marginTop: spacing.md, paddingVertical: spacing.md, alignItems: 'center' },
  sheetCancelarTexto: { fontSize: typography.body.fontSize, fontWeight: typography.h2.fontWeight, color: colors.textSecondary },
});
