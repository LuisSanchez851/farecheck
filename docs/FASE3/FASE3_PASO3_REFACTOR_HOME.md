# FASE 3 PASO 3: PLAN DE REFACTORIZACIÓN HOMESCREEN
## Arquitectura y Strategy de descomposición

**Fecha:** 2026-06-22  
**Status:** 🔄 EN PROCESO (validación con Luis)

---

## 🎯 OBJETIVO

Transformar HomeScreen.tsx de:
- **351 líneas monolíticas** (UI + lógica + styles)

A:
- **~130 líneas de orquestación** (componentes reutilizables)
- **100% testeable** (cada componente aislado)
- **Composable** (reutilizable en otras pantallas)

---

## 📊 MAPEO: VIEJO → NUEVO

### HomeScreen Actual (351 líneas)
```typescript
HomeScreen.tsx (monolítico)
├── State: balance, turno, viajes, loading, refreshing, iniciando, balanceError (8 variables)
├── Callbacks: cargar(), onRefresh, handleIniciarTurno(), handleVerTurno()
├── Rendering (JSX)
│   ├── Header (avatar, nombre, campana)
│   ├── balanceCard (77 líneas JSX hardcodeado)
│   ├── statsRow (50 líneas JSX hardcodeado)
│   ├── Historial de viajes (ViajeCard[])
│   └── Footer (botón)
└── Styles (90+ líneas de StyleSheet)
```

### HomeScreen Refactorizado (~130 líneas)
```typescript
HomeScreen.tsx (orquestación)
├── State: balance, turno, viajes, loading, refreshing, iniciando
├── Callbacks: cargar(), onRefresh, handleIniciarTurno(), handleVerTurno()
├── Rendering (JSX)
│   ├── Header (avatar, nombre, campana) ← MISMO
│   ├── <BalanceWidget balance={} loading={} error={} /> ← EXTRAÍDO
│   ├── <TurnoWidget turno={} loading={} /> ← EXTRAÍDO
│   ├── ViajeCard[] (map directo)
│   └── <ActionButtons turno={} onIniciar={} /> ← EXTRAÍDO
└── Styles (solo container/scroll)
```

---

## 🔄 STRATEGY DE MIGRACIÓN

### FASE 3A: Crear Componentes (sin modificar HomeScreen)
1. Crear `src/components/ui/` base (Card, Text, Loader, Badge, Button)
2. Crear `src/components/home/` específicos (BalanceWidget, TurnoWidget, ActionButtons)
3. Tests de componentes

### FASE 3B: Refactorizar HomeScreen
1. Reemplazar balanceCard JSX por `<BalanceWidget />`
2. Reemplazar statsRow JSX por `<TurnoWidget />`
3. Reemplazar footer JSX por `<ActionButtons />`
4. Limpiar styles
5. Tests de HomeScreen

### FASE 3C: Completar Pantallas
1. Implementar DatosPersonales.tsx
2. Crear Contactos.tsx

---

## 📝 HOMESCREEN REFACTORIZADO (VISTA PREVIA)

```typescript
// src/screens/home/HomeScreen.tsx (refactorizado ~130 líneas)

import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/auth.store';
import { balanceClient, turnosClient, viajesClient, ApiError } from '../../services/api.client';

// NUEVO: Importar componentes
import {
  BalanceWidget,
  TurnoWidget,
  ActionButtons,
} from '../../components/home';
import ViajeCard from '../../components/ui/ViajeCard';
import { Text, Loader } from '../../components/ui';

import type { HomeScreenProps } from '../../types/navigation';
import type { BalanceDiaResponse, TurnoActivoResponse, Viaje } from '../../types/api.types';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const conductor = useAuthStore((s) => s.conductor);

  // State (sin cambios)
  const [balance, setBalance] = useState<BalanceDiaResponse | null>(null);
  const [turno, setTurno] = useState<TurnoActivoResponse>(null);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [balanceError, setBalanceError] = useState(false);

  // Callbacks (sin cambios)
  const cargar = useCallback(async () => {
    setBalanceError(false);
    const [bRes, tRes, vRes] = await Promise.allSettled([
      balanceClient.getDia(),
      turnosClient.getActivo(),
      viajesClient.getHistorial({ limit: 10 }),
    ]);

    if (bRes.status === 'fulfilled') setBalance(bRes.value.data);
    else setBalanceError(true);

    if (tRes.status === 'fulfilled') setTurno(tRes.value.data);
    if (vRes.status === 'fulfilled') setViajes(vRes.value.data.viajes ?? []);
    else setViajes([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        await cargar();
        if (activo) setLoading(false);
      })();
      return () => {
        activo = false;
      };
    }, [cargar]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }, [cargar]);

  const handleIniciarTurno = async () => {
    setIniciando(true);
    try {
      await turnosClient.iniciar();
      await cargar();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo iniciar el turno.';
      Alert.alert('Error', msg);
    } finally {
      setIniciando(false);
    }
  };

  const handleVerTurno = () => {
    navigation.navigate('TurnoActivo');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Loader fullScreen />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Header (SIN CAMBIOS) ────────────────────── */}
        {/* ... avatar + nombre + campana JSX ... */}

        {/* ── NUEVO: BalanceWidget ────────────────────── */}
        <BalanceWidget
          balance={balance}
          loading={false}
          error={balanceError}
          testID="balance-widget"
        />

        {/* ── NUEVO: TurnoWidget ──────────────────────── */}
        <TurnoWidget
          turno={turno}
          loading={false}
          testID="turno-widget"
        />

        {/* ── Historial de viajes (SIN CAMBIOS) ──────── */}
        <Text variant="h2" weight="600" style={styles.sectionTitle}>
          Historial de viajes
        </Text>

        {viajes.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" color={colors.textSecondary} align="center">
              Aún no hay viajes registrados. Inicia un turno para comenzar.
            </Text>
          </View>
        ) : (
          viajes.map((v) => (
            <ViajeCard
              key={v.id}
              viaje={v}
              onPress={(viaje) => navigation.navigate('DetalleViaje', { id: viaje.id })}
            />
          ))
        )}
      </ScrollView>

      {/* ── NUEVO: ActionButtons ───────────────────── */}
      <ActionButtons
        turno={turno}
        onIniciar={handleIniciarTurno}
        onVerTurno={handleVerTurno}
        loading={iniciando}
        testID="action-buttons"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
});
```

---

## 🔍 COMPARACIÓN: ANTES vs DESPUÉS

### ANTES (monolítico)
```
HomeScreen.tsx
├── balanceCard
│   ├── View style=balanceCard
│   ├── View style=balanceTop
│   ├── Text "Balance del día"
│   ├── View style=badge
│   ├── Ionicons trending-up/down
│   ├── Text badgeText "%"
│   ├── Text balanceMonto
│   └── Text balanceError
│
├── statsRow
│   ├── View style=statsRow
│   ├── View style=statCard
│   ├── Ionicons time-outline
│   ├── Text statValor
│   ├── Text statLabel
│   ├── View style=statCard
│   ├── Ionicons car-outline
│   ├── Text statValor
│   └── Text statLabel
│
└── footer
    ├── View style=footer
    └── TouchableOpacity style=boton
        ├── Ionicons play/radio-outline
        └── Text botonTexto

Líneas de código: 351
Testeable: ❌ (todo mezclado)
Reutilizable: ❌ (hardcodeado)
Mantenible: ❌ (cambiar un estilo = buscar en 300+ líneas)
```

### DESPUÉS (componible)
```
HomeScreen.tsx
├── imports { BalanceWidget, TurnoWidget, ActionButtons }
├── state (balance, turno, viajes, loading...)
├── callbacks (cargar, onRefresh, handleIniciarTurno...)
├── Header JSX (~30 líneas)
├── <BalanceWidget balance={} error={} />
├── <TurnoWidget turno={} />
├── HistorialViajes JSX (~20 líneas)
└── <ActionButtons turno={} onIniciar={} />

Líneas de código: ~130
Testeable: ✅ (componentes aislados)
Reutilizable: ✅ (componentes genéricos)
Mantenible: ✅ (cada componente en su archivo)
```

---

## 📊 DESCOMPOSICIÓN DE RESPONSABILIDADES

### HomeScreen (ORQUESTACIÓN)
**Responsabilidad:** Coordinar datos y componentes
```typescript
- Cargar datos (cargar())
- Manejar estado global (loading, refreshing, iniciando)
- Navegar entre pantallas (navigate)
- Disparar acciones (handleIniciarTurno)
```

### BalanceWidget (PRESENTACIÓN)
**Responsabilidad:** Mostrar balance del día
```typescript
- Recibir props: balance, loading, error
- Renderizar balance + comparativa + stats
- No hace fetching
- No navega
```

### TurnoWidget (PRESENTACIÓN)
**Responsabilidad:** Mostrar estado del turno
```typescript
- Recibir props: turno, loading
- Renderizar tiempo activo + viajes
- Timer que se actualiza cada segundo
- No hace fetching
```

### ActionButtons (PRESENTACIÓN)
**Responsabilidad:** Botones de acción en footer
```typescript
- Recibir props: turno, onIniciar, loading
- Cambiar botón según estado del turno
- Disparar callbacks
- No hace lógica compleja
```

---

## 🧪 TESTING STRATEGY

### Unit Tests (Componentes)
```typescript
// __tests__/components/home/BalanceWidget.test.tsx
describe('BalanceWidget', () => {
  it('renders balance when loaded', () => { ... });
  it('shows error message when error=true', () => { ... });
  it('displays loader when loading=true', () => { ... });
  it('shows comparativa badge', () => { ... });
});

// __tests__/components/home/TurnoWidget.test.tsx
describe('TurnoWidget', () => {
  it('renders turno when active', () => { ... });
  it('shows empty state when turno is null', () => { ... });
  it('updates timer every second', () => { ... });
});

// __tests__/components/home/ActionButtons.test.tsx
describe('ActionButtons', () => {
  it('shows "Iniciar turno" button when no turno', () => { ... });
  it('shows "Ver turno activo" button when turno exists', () => { ... });
  it('calls onIniciar when button pressed', () => { ... });
});
```

### Integration Tests (HomeScreen)
```typescript
// __tests__/screens/home/HomeScreen.test.tsx
describe('HomeScreen Integration', () => {
  it('loads and displays all data', () => { ... });
  it('refreshes on pull-down', () => { ... });
  it('navigates to DetalleViaje on ViajeCard press', () => { ... });
  it('calls handleIniciarTurno on button press', () => { ... });
});
```

---

## ✅ CHECKLIST REFACTORIZACIÓN

### Paso 3A: Crear Componentes
- [ ] Crear `src/components/ui/Card.tsx`
- [ ] Crear `src/components/ui/Text.tsx`
- [ ] Crear `src/components/ui/Loader.tsx`
- [ ] Crear `src/components/ui/Badge.tsx`
- [ ] Crear `src/components/ui/Button.tsx`
- [ ] Crear `src/components/ui/index.ts`
- [ ] Crear `src/components/home/BalanceWidget.tsx`
- [ ] Crear `src/components/home/TurnoWidget.tsx`
- [ ] Crear `src/components/home/ActionButtons.tsx`
- [ ] Crear `src/components/home/index.ts`
- [ ] Actualizar `src/components/index.ts`

### Paso 3B: Refactorizar HomeScreen
- [ ] Importar componentes home
- [ ] Reemplazar balanceCard JSX por `<BalanceWidget />`
- [ ] Reemplazar statsRow JSX por `<TurnoWidget />`
- [ ] Reemplazar footer JSX por `<ActionButtons />`
- [ ] Limpiar styles innecesarios
- [ ] Verificar que sigue compilando
- [ ] Verificar que funciona igual que antes

### Paso 3C: Tests
- [ ] Tests unitarios BalanceWidget
- [ ] Tests unitarios TurnoWidget
- [ ] Tests unitarios ActionButtons
- [ ] Tests integración HomeScreen
- [ ] Coverage > 70%

### Paso 3D: Validación
- [ ] `tsc --noEmit` compila sin errores
- [ ] `npm run test` pasa todos los tests
- [ ] Manual: login → HomeScreen → ver balance, turno, viajes
- [ ] Manual: click "Iniciar turno" funciona
- [ ] Manual: pull-to-refresh funciona
- [ ] Manual: click ViajeCard → DetalleViaje

---

## 📁 ÁRBOL FINAL DESPUÉS DE REFACTORIZACIÓN

```
farecheck/src
├── components/
│   ├── ui/
│   │   ├── Card.tsx              ← NUEVO
│   │   ├── Text.tsx              ← NUEVO
│   │   ├── Loader.tsx            ← NUEVO
│   │   ├── Badge.tsx             ← NUEVO
│   │   ├── Button.tsx            ← NUEVO
│   │   ├── ViajeCard.tsx         (sin cambios)
│   │   ├── IngresosLineChart.tsx (sin cambios)
│   │   └── index.ts              ← ACTUALIZADO
│   ├── home/
│   │   ├── BalanceWidget.tsx     ← NUEVO
│   │   ├── TurnoWidget.tsx       ← NUEVO
│   │   ├── ActionButtons.tsx     ← NUEVO
│   │   └── index.ts              ← NUEVO
│   └── index.ts                  ← ACTUALIZADO
├── screens/
│   └── home/
│       ├── HomeScreen.tsx        ← REFACTORIZADO (351 → 130 líneas)
│       ├── (otros sin cambios)
├── __tests__/
│   ├── components/
│   │   └── home/
│   │       ├── BalanceWidget.test.tsx
│   │       ├── TurnoWidget.test.tsx
│   │       ├── ActionButtons.test.tsx
│   │       └── index.test.tsx
│   └── screens/
│       └── home/
│           └── HomeScreen.test.tsx
```

---

## 🚀 SIGUIENTE PASO

→ **PASO 4:** Crear `FASE3_PASO4_IMPL_COMPONENTES.md` (especificación completa para Claude Code)

