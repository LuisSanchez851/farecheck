# FASE 3 PASO 1: DIAGNÓSTICO
## Análisis de HomeScreen y Estructura UI Actual

**Fecha:** 2026-06-22  
**Status:** ✅ COMPLETADO

---

## 📊 ANÁLISIS HOMESCREEN.TSX (351 líneas)

### Estructura Actual
```typescript
HomeScreen
├── Imports (firebase, zustand, API clients, tipos)
├── Helper: iniciales(nombre)
├── State (8 hooks):
│   ├── balance (BalanceDiaResponse)
│   ├── turno (TurnoActivoResponse)
│   ├── viajes (Viaje[])
│   ├── loading (boolean)
│   ├── refreshing (boolean)
│   ├── iniciando (boolean)
│   └── balanceError (boolean)
├── Callbacks (3):
│   ├── cargar() → Promise.allSettled([balance, turno, viajes])
│   ├── onRefresh()
│   └── handleIniciarTurno()
│   └── handleVerTurno()
├── Rendering (JSX):
│   ├── Header (avatar + nombre + notificación)
│   ├── BalanceCard (saldo + % comparativa)
│   ├── StatsRow (tiempo, viajes)
│   ├── HistorialViajes (ViajeCard[])
│   └── Footer (botón Iniciar Turno / Ver Turno Activo)
└── Styles (StyleSheet.create ~90 líneas)
```

### Problemas Identificados

#### 🔴 CRÍTICO: Monolitismo
```
HomeScreen concentra TODO:
- UI (avatar, balance, stats, botones)
- Lógica de estado (3 usos de useState)
- Fetching de datos (Promise.allSettled)
- Manejo de errores (balanceError, ApiError)
- Navegación (navigate('TurnoActivo'), navigate('DetalleViaje'))
- Cálculos (comparativa %, formatters)

Línea 200-350: JSX + Styles = imposible de testear componentes
```

#### 🟡 SEVERO: Sin Componentes Reutilizables
```
Componentes visuales NO EXTRAÍDOS:
- BalanceCard (77 líneas JSX)      → Debería ser <BalanceWidget />
- StatsRow (50 líneas JSX)         → Debería ser <TurnoWidget /> o Stats
- ViajeCard[] (90 líneas JSX)      → Ya existe pero usado directamente
- Footer buttons (40 líneas JSX)   → Debería ser <ActionButtons />

Impacto: 
- HomeScreen no es testeable
- Componentes no reutilizables en otras pantallas
- Duplicación de código posible
```

#### 🟡 MODERADO: Base de Componentes UI Vacía
```
components/ui/ actual:
- ViajeCard.tsx ✅ (existe)
- IngresosLineChart.tsx ✅ (existe)
- [FALTA]
  └── Card.tsx (envolvedor genérico)
  └── Text.tsx (tipografía centralizada)
  └── Loader.tsx (spinner reutilizable)
  └── Badge.tsx (badges estado)
  └── Button.tsx (botones base)

Impacto:
- Estilos duplicados en varios componentes
- Inconsistencia visual
- Difícil refactoring global (cambiar color primary = tocar 10 archivos)
```

---

## 📁 ESTRUCTURA ACTUAL vs DESEABLE

### ACTUAL (Monolítico)
```
HomeScreen.tsx (351 líneas)
├── UI + Lógica + Fetching todo mezclado
├── Algunos hooks de BalanceWidget
├── Callback cargar() con Promise.allSettled
└── Estilos hardcodeados
```

### DESEABLE (Componible)
```
HomeScreen.tsx (120 líneas - solo orquestación)
├── useFocusEffect → cargar()
├── Render:
│   ├── <Header />
│   ├── <BalanceWidget balance={balance} error={balanceError} />
│   ├── <TurnoWidget turno={turno} onIniciar={handleIniciarTurno} />
│   ├── <ServicesList viajes={viajes} />
│   └── <ActionButtons turno={turno} />
└── Footer
```

---

## 🎨 COMPONENTES A CREAR

### Nivel 1: Base UI (primitivos)

#### 1. Card.tsx
```typescript
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}
// Envolvedor genérico: borde, shadow, borderRadius, padding
// Usado por: BalanceWidget, TurnoWidget, StatsRow, etc.
```

#### 2. Text.tsx
```typescript
interface TextProps extends React.ComponentProps<typeof RNText> {
  variant: 'h1' | 'h2' | 'body' | 'caption' | 'display';
  weight?: 'regular' | 'bold' | 'semibold';
  color?: string;
  testID?: string;
}
// Tipografía centralizada (elimina repetición de fontSize/fontWeight)
// Usado por: todos
```

#### 3. Loader.tsx
```typescript
interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}
// Spinner reutilizable
// Usado por: HomeScreen, cualquier pantalla con loading
```

#### 4. Badge.tsx
```typescript
interface BadgeProps {
  label: string;
  icon?: string;
  variant: 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
}
// Badge reutilizable (usado en BalanceCard para comparativa)
```

#### 5. Button.tsx
```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}
// Botones reutilizables (reemplaza StyleSheet.boton hardcodeado)
```

---

### Nivel 2: Componentes Home (específicos)

#### 1. BalanceWidget.tsx
```typescript
interface BalanceWidgetProps {
  balance: BalanceDiaResponse | null;
  loading?: boolean;
  error?: boolean;
}
// Renderiza:
// - "Balance del día"
// - Monto en COP (formatCOP)
// - Badge con comparativa % (trending-up/down)
// - Manejo de error state
```

#### 2. TurnoWidget.tsx
```typescript
interface TurnoWidgetProps {
  turno: TurnoActivoResponse | null;
  loading?: boolean;
}
// Renderiza:
// - Si turno activo:
//   - StatsRow (tiempo, viajes completados)
// - Si no hay turno:
//   - Mensaje "Inicia un turno"
// - Nota: botones van en ActionButtons
```

#### 3. ActionButtons.tsx
```typescript
interface ActionButtonsProps {
  turno: TurnoActivoResponse | null;
  onIniciar: () => Promise<void>;
  loading?: boolean;
}
// Renderiza:
// - Si turno: <Button label="Ver turno activo" />
// - Si no: <Button label="Iniciar turno" loading={loading} />
```

#### 4. StatsRow.tsx (opcional)
```typescript
interface StatsRowProps {
  tiempo_min: number;
  viajes: number;
}
// Card con 2 stats:
// - Tiempo activo (formatDuracion)
// - Viajes completados
```

---

## 📋 COMPONENTES EXISTENTES A MEJORAR

### ViajeCard.tsx
```typescript
// Actual:
interface ViajeCardProps {
  viaje: Viaje;
  onPress?: (viaje: Viaje) => void;
}
// Render: plataforma + valor/km + estado (aceptado/rechazado/sin decisión)

// A revisar:
- ¿Incluye semáforo VERDE/AMARILLO/ROJO?
- ¿Es reusable en DetalleViaje, ResumenTurno?
- ¿Estilos consistentes?
```

---

## 🏗️ PANTALLAS A COMPLETAR

### 1. DatosPersonales.tsx
```typescript
// Estado actual: 43 líneas (STUB)
// Necesita:
- Formulario: nombre, email, teléfono, documento
- Upload foto (avatar)
- Botón guardar
- Validación
- Integración con API (PUT /conductores/:id)
- Loading/error states
// Bloqueada por: Cloudinary integration (S2-06)
```

### 2. Contactos.tsx
```typescript
// Estado actual: NO EXISTE
// Necesita:
- Listado de contactos de emergencia
- CRUD: agregar/editar/eliminar
- Integración con API
- Validación teléfono/email
// Ticket: S4-07
```

---

## 🧪 TESTING

### Componentes Base a Testear
```typescript
// Card.tsx
- [ ] Renderiza children
- [ ] Aplica estilos correctamente
- [ ] onPress funciona

// Text.tsx
- [ ] Renders con variant correcto
- [ ] fontWeight se aplica
- [ ] color se aplica

// Badge.tsx
- [ ] Renderiza label + icon
- [ ] Aplica color según variant

// Button.tsx
- [ ] onPress se dispara
- [ ] loading state muestra spinner
- [ ] disabled desactiva
```

### Componentes Home a Testear
```typescript
// BalanceWidget.tsx
- [ ] Renderiza balance cuando carga
- [ ] Muestra error cuando balanceError=true
- [ ] Badge muestra comparativa correcta

// TurnoWidget.tsx
- [ ] Renderiza stats si turno activo
- [ ] Renderiza mensaje si no hay turno

// ActionButtons.tsx
- [ ] Botón "Iniciar turno" si !turno
- [ ] Botón "Ver turno" si turno
- [ ] onIniciar dispara cuando presiona
```

### HomeScreen Integración
```typescript
// HomeScreen.tsx
- [ ] Renderiza sin errores
- [ ] Carga datos al montar
- [ ] Refresh funciona
- [ ] Navegación funciona
```

---

## 🎯 MÉTRICAS ACTUALES

### Líneas de Código
```
HomeScreen.tsx         351 líneas (monolítico)
  - JSX/UI            250 líneas
  - Lógica             60 líneas
  - Styles             41 líneas

Componentes reutilizables   2 (ViajeCard, IngresosLineChart)
Componentes base (ui/)      2 (falta 3-4)
Pantallas stub              1 (DatosPersonales)
Pantallas faltantes         1 (Contactos)
```

### Test Coverage
```
HomeScreen.tsx      0% (no testeado)
Componentes ui/     ~30% (ViajeCard básico)
```

---

## ✅ CHECKLIST DIAGNÓSTICO

- [x] Analizar HomeScreen.tsx
- [x] Identificar componentes a extraer
- [x] Listar componentes base faltantes
- [x] Revisar pantallas stub/faltantes
- [x] Documentar problemas
- [x] Proponer solución

---

## 📌 CONCLUSIONES

### Necesario
1. ✅ **Extraer BalanceWidget** de HomeScreen
2. ✅ **Extraer TurnoWidget** de HomeScreen
3. ✅ **Extraer ActionButtons** de HomeScreen
4. ✅ **Crear componentes base** (Card, Text, Loader, Badge)
5. ✅ **Refactorizar HomeScreen** a 120 líneas (orquestación)
6. ✅ **Completar DatosPersonales.tsx**
7. ✅ **Crear Contactos.tsx**

### Beneficios
- HomeScreen testeable (unit tests)
- Componentes reutilizables en otras pantallas
- Estilos centralizados (Card, Text, etc.)
- Base sólida para FASE 4 (OCR)
- Tests de componentes (70%+ coverage)

---

## 🚀 SIGUIENTE PASO

→ **PASO 2:** Crear `FASE3_PASO2_COMPONENTES_UI.md` (especificación detallada de interfaces y estilos)

