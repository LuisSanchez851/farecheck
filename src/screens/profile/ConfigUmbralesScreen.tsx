import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { formatCOP } from '../../utils/format';
import { conductorClient, ApiError } from '../../services/api.client';
import { useAuthStore } from '../../store/auth.store';
import type { ConfigUmbralesScreenProps } from '../../types/navigation';

const MIN = 100;
const MAX = 10_000;
const STEP = 100;
const clamp = (v: number) => Math.max(MIN, Math.min(MAX, v));

// Diámetro ilustrativo del círculo según el valor COP/km (40–88px en el rango 600–3000)
const sizeFor = (cop: number) => 40 + Math.max(0, Math.min(1, (cop - 600) / 2400)) * 48;

export default function ConfigUmbralesScreen({ navigation }: ConfigUmbralesScreenProps) {
  const conductor = useAuthStore((s) => s.conductor);
  const setConductor = useAuthStore((s) => s.setConductor);

  const [verde, setVerde] = useState<number>(conductor?.umbral_verde_copkm ?? 1500);
  const [amarillo, setAmarillo] = useState<number>(conductor?.umbral_amarillo_copkm ?? 900);
  const [guardando, setGuardando] = useState(false);

  const enRango = (v: number) => v >= MIN && v <= MAX;
  const error = useMemo(() => {
    if (!enRango(verde) || !enRango(amarillo)) {
      return `Los valores deben estar entre ${formatCOP(MIN)} y ${formatCOP(MAX)} por km.`;
    }
    if (amarillo >= verde) return 'El umbral amarillo debe ser menor al verde.';
    return null;
  }, [verde, amarillo]);

  const sinCambios =
    verde === (conductor?.umbral_verde_copkm ?? 1500) &&
    amarillo === (conductor?.umbral_amarillo_copkm ?? 900);

  const guardar = async () => {
    if (error) return;
    setGuardando(true);
    try {
      await conductorClient.updateUmbrales(verde, amarillo);
      if (conductor) {
        setConductor({ ...conductor, umbral_verde_copkm: verde, umbral_amarillo_copkm: amarillo });
      }
      Alert.alert('Listo', 'Tu semáforo se actualizó correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'No se pudo guardar la configuración.');
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
        <Text style={styles.headerTitulo}>Configurar umbrales</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitulo}>Tu semáforo</Text>

        {/* Caja de info */}
        <View style={styles.info}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.infoTexto}>
            FareCheck usa la tarifa por kilómetro para clasificar cada oferta. Define desde qué
            valor un servicio es bueno (verde) o dudoso (amarillo).
          </Text>
        </View>

        {/* Círculos ilustrativos */}
        <View style={styles.circulos}>
          <Circulo color={colors.green} size={sizeFor(verde)} />
          <Circulo color={colors.amber} size={sizeFor(amarillo)} />
          <Circulo color={colors.red} size={sizeFor(Math.max(0, amarillo - STEP))} />
        </View>

        {/* Fila VERDE */}
        <UmbralFila
          color={colors.green}
          titulo="Verde — Aceptar"
          descripcion={`Mayor o igual a ${formatCOP(verde)} / km`}
          valor={verde}
          onChange={(v) => setVerde(clamp(v))}
        />

        {/* Fila AMARILLO */}
        <UmbralFila
          color={colors.amber}
          titulo="Amarillo — Evaluar"
          descripcion={`Entre ${formatCOP(amarillo)} y ${formatCOP(verde)} / km`}
          valor={amarillo}
          onChange={(v) => setAmarillo(clamp(v))}
        />

        {/* Fila ROJO (derivada) */}
        <View style={[styles.fila, styles.filaRojo]}>
          <View style={[styles.dot, { backgroundColor: colors.red }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.filaTitulo}>Rojo — Rechazar</Text>
            <Text style={styles.filaDescripcion}>Menor a {formatCOP(amarillo)} / km</Text>
          </View>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {/* Botón guardar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.boton, { opacity: error || guardando || sinCambios ? 0.45 : 1 }]}
          onPress={guardar}
          disabled={!!error || guardando || sinCambios}
          activeOpacity={0.85}
        >
          {guardando ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.botonTexto}>Guardar configuración</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Circulo({ color, size }: { color: string; size: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

function UmbralFila({
  color,
  titulo,
  descripcion,
  valor,
  onChange,
}: {
  color: string;
  titulo: string;
  descripcion: string;
  valor: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.fila}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        <Text style={styles.filaDescripcion}>{descripcion}</Text>
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(valor - STEP)} hitSlop={6}>
          <Ionicons name="remove" size={18} color={colors.navy} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={String(valor)}
          keyboardType="number-pad"
          onChangeText={(t) => onChange(Number(t.replace(/\D/g, '')) || 0)}
          maxLength={5}
          selectTextOnFocus
        />
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(valor + STEP)} hitSlop={6}>
          <Ionicons name="add" size={18} color={colors.navy} />
        </TouchableOpacity>
      </View>
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
  headerTitulo: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  subtitulo: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.navy,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  info: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.cyanLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoTexto: { flex: 1, fontSize: typography.caption.fontSize, color: colors.navy, lineHeight: 18 },

  circulos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    height: 100,
    marginBottom: spacing.xl,
  },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  filaRojo: { opacity: 0.9 },
  dot: { width: 14, height: 14, borderRadius: radius.full },
  filaTitulo: { fontSize: typography.body.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy },
  filaDescripcion: { fontSize: typography.caption.fontSize, color: colors.textSecondary, marginTop: 2 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  stepBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, backgroundColor: colors.background },
  input: {
    width: 56,
    textAlign: 'center',
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.navy,
    paddingVertical: spacing.sm,
  },

  error: { fontSize: typography.caption.fontSize, color: colors.red, textAlign: 'center', marginTop: spacing.sm },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  boton: {
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  botonTexto: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.white },
});
