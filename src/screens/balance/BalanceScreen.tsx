import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { formatCOP, formatDuracion, formatKm } from '../../utils/format';
import { balanceClient, viajesClient } from '../../services/api.client';
import ViajeCard from '../../components/ui/ViajeCard';
import IngresosLineChart from '../../components/ui/IngresosLineChart';
import type { BalanceScreenProps } from '../../types/navigation';
import type { BalanceSemanaResponse, Viaje } from '../../types/api.types';

const PAGE_SIZE = 15;
type Tab = 'todos' | 'aceptados';

export default function BalanceScreen(_props: BalanceScreenProps) {
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.lg * 2 - spacing.lg * 2; // padding pantalla + card

  const [semana, setSemana] = useState<BalanceSemanaResponse | null>(null);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [tab, setTab] = useState<Tab>('todos');

  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refs para controlar paginación sin closures obsoletas en onEndReached
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const tabRef = useRef<Tab>('todos');

  const cargarViajes = useCallback(async (reset: boolean) => {
    if (loadingMoreRef.current) return;
    if (!reset && !hasMoreRef.current) return;

    const nextPage = reset ? 1 : pageRef.current + 1;
    loadingMoreRef.current = true;
    if (!reset) setLoadingMore(true);

    try {
      const { data } = await viajesClient.getHistorial({
        page: nextPage,
        limit: PAGE_SIZE,
        estado: tabRef.current,
      });
      pageRef.current = data.page;
      hasMoreRef.current = data.has_more;
      setViajes((prev) => (reset ? data.viajes : [...prev, ...data.viajes]));
    } catch {
      if (reset) {
        setViajes([]);
        hasMoreRef.current = false;
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const cargarSemana = useCallback(async () => {
    try {
      const { data } = await balanceClient.getSemana();
      setSemana(data);
    } catch {
      setSemana(null);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    (async () => {
      await Promise.all([cargarSemana(), cargarViajes(true)]);
      setLoadingInicial(false);
    })();
  }, [cargarSemana, cargarViajes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([cargarSemana(), cargarViajes(true)]);
    setRefreshing(false);
  }, [cargarSemana, cargarViajes]);

  const cambiarTab = (nuevo: Tab) => {
    if (nuevo === tabRef.current) return;
    tabRef.current = nuevo;
    hasMoreRef.current = true;
    pageRef.current = 0;
    setTab(nuevo);
    setViajes([]);
    cargarViajes(true);
  };

  const onEndReached = () => {
    if (!loadingMoreRef.current && hasMoreRef.current) cargarViajes(false);
  };

  const statSummary = (
    <View style={styles.statsGrid}>
      <Stat label="Total" valor={formatCOP(semana?.total_cop ?? 0)} icono="cash-outline" />
      <Stat label="Viajes" valor={String(semana?.viajes ?? 0)} icono="car-outline" />
      <Stat label="Km total" valor={formatKm(semana?.km_total ?? 0)} icono="speedometer-outline" />
      <Stat label="Tiempo" valor={formatDuracion(semana?.tiempo_total_min ?? 0)} icono="time-outline" />
    </View>
  );

  const header = (
    <View>
      {/* Selector de periodo */}
      <View style={styles.headerRow}>
        <Text style={styles.titulo}>Balance</Text>
        <TouchableOpacity
          style={styles.selector}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Periodo', 'Mes y Año estarán disponibles próximamente.')}
        >
          <Text style={styles.selectorTexto}>Semana</Text>
          <Ionicons name="chevron-down" size={15} color={colors.navy} />
        </TouchableOpacity>
      </View>

      {/* Gráfica */}
      <View style={styles.chartCard}>
        {semana ? (
          <IngresosLineChart data={semana.dias} width={chartWidth} />
        ) : (
          <Text style={styles.chartError}>No pudimos cargar la gráfica.</Text>
        )}
      </View>

      {statSummary}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TabBoton label="Todos" activo={tab === 'todos'} onPress={() => cambiarTab('todos')} />
        <TabBoton label="Aceptados" activo={tab === 'aceptados'} onPress={() => cambiarTab('aceptados')} />
      </View>
    </View>
  );

  if (loadingInicial) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={viajes}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => <ViajeCard viaje={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="receipt-outline" size={30} color={colors.textMuted} />
            <Text style={styles.vacioTexto}>No hay viajes para este filtro.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} /> : null
        }
      />
    </SafeAreaView>
  );
}

function Stat({ label, valor, icono }: { label: string; valor: string; icono: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icono} size={18} color={colors.primary} />
      <Text style={styles.statValor} numberOfLines={1}>{valor}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabBoton({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tab, activo && styles.tabActivo]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.tabTexto, activo && styles.tabTextoActivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  titulo: { fontSize: typography.h1.fontSize, fontWeight: typography.h1.fontWeight, color: colors.navy },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorTexto: { fontSize: typography.body.fontSize, fontWeight: typography.label.fontWeight, color: colors.navy },

  chartCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  chartError: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  statValor: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.navy, marginTop: spacing.xs },
  statLabel: { fontSize: typography.caption.fontSize, color: colors.textSecondary },

  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: 'center' },
  tabActivo: { backgroundColor: colors.primary },
  tabTexto: { fontSize: typography.body.fontSize, fontWeight: typography.label.fontWeight, color: colors.textSecondary },
  tabTextoActivo: { color: colors.white },

  vacio: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  vacioTexto: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center' },
});
