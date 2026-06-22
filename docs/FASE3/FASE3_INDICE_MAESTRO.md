# 📋 FASE 3: HOMESCREEN & UI COMPONENTS
## ÍNDICE MAESTRO

**Status:** 🔄 En planificación  
**Fecha inicio:** 2026-06-22  
**Objetivo:** Refactorizar HomeScreen en componentes reutilizables + completar pantallas stub

---

## 🎯 OBJETIVO FASE 3

Convertir el HomeScreen monolítico (351 líneas) en:
1. ✅ Componentes reutilizables (BalanceWidget, TurnoWidget, ViajeCard, ActionButtons)
2. ✅ Base de componentes UI (Card, Text, Loader, Badge, etc.)
3. ✅ HomeScreen refactorizado (limpio, composable)
4. ✅ Completar DatosPersonales.tsx (actualmente stub)
5. ✅ Crear Contactos.tsx (S4-07)
6. ✅ Tests unitarios de componentes

---

## 📁 DOCUMENTOS FASE 3

### Paso 1: Diagnóstico y Análisis ✅
- **Archivo:** `FASE3_PASO1_DIAGNOSTICO.md`
- **Estado:** COMPLETADO
- **Contenido:** Análisis de HomeScreen actual, componentes existentes, estructura UI

### Paso 2: Especificación de Componentes
- **Archivo:** `FASE3_PASO2_COMPONENTES_UI.md`
- **Estado:** PENDIENTE
- **Contenido:** Interfaces, props, estilos de componentes base

### Paso 3: Plan de Refactorización HomeScreen
- **Archivo:** `FASE3_PASO3_REFACTOR_HOME.md`
- **Estado:** PENDIENTE
- **Contenido:** Estrategia de descomposición, nueva estructura

### Paso 4: Implementación Componentes Base
- **Archivo:** `FASE3_PASO4_IMPL_COMPONENTES.md`
- **Estado:** PENDIENTE
- **Contenido:** Spec para Claude Code - crear componentes/ui base

### Paso 5: Refactorizar HomeScreen
- **Archivo:** `FASE3_PASO5_IMPL_HOME_REFACTOR.md`
- **Estado:** PENDIENTE
- **Contenido:** Spec para Claude Code - refactorizar HomeScreen.tsx

### Paso 6: Completar Pantallas Stub
- **Archivo:** `FASE3_PASO6_STUB_SCREENS.md`
- **Estado:** PENDIENTE
- **Contenido:** Spec para Claude Code - DatosPersonales + Contactos

### Paso 7: Tests Unitarios
- **Archivo:** `FASE3_PASO7_TESTS.md`
- **Estado:** PENDIENTE
- **Contenido:** Spec para Claude Code - tests de componentes

### Paso 8: Validación y Cierre
- **Archivo:** `FASE3_PASO8_CIERRE.md`
- **Estado:** PENDIENTE
- **Contenido:** Checklist final, validación manual, documentación

---

## 📊 HALLAZGOS CLAVE DEL DIAGNÓSTICO

### HomeScreen Actual (351 líneas)
```typescript
// Problemas encontrados:
- ✅ Funciona y integra APIs FASE 2
- ❌ TODO está en un componente (monolítico)
- ❌ Lógica de balance, turno, viajes mezclada
- ❌ Sin componentes reutilizables
```

### Componentes Existentes
```
components/ui/
  ├── ViajeCard.tsx ✅
  ├── IngresosLineChart.tsx ✅
  └── (falta: Card, Text, Loader, Badge)

components/home/
  ├── (VACÍO - necesita crear)
  ├── BalanceWidget.tsx (nuevo)
  ├── TurnoWidget.tsx (nuevo)
  ├── ActionButtons.tsx (nuevo)
```

### Pantallas a Completar
```
profile/
  ├── DatosPersonales.tsx ❌ STUB (43 líneas)
  └── Contactos.tsx ❌ NO EXISTE (S4-07)
```

---

## 🎯 CRITERIOS DE ACEPTACIÓN FASE 3

- [ ] Componentes base UI creados (Card, Text, Loader, Badge)
- [ ] HomeScreen refactorizado y funcionando
- [ ] BalanceWidget componentizado y testeado
- [ ] TurnoWidget componentizado y testeado
- [ ] ViajeCard mejorado y reusable
- [ ] ActionButtons componentizado y testeado
- [ ] DatosPersonales.tsx completado
- [ ] Contactos.tsx creado
- [ ] Tests: cobertura > 70% en componentes
- [ ] Build limpio (tsc --noEmit)
- [ ] Validación manual: login → Home → interacciones
- [ ] Documentación: UI_COMPONENTS.md creado
- [ ] Git: commits limpios y pusheados

---

## 🚀 WORKFLOW FASE 3

1. **Paso 1:** Leer este índice ← AQUÍ
2. **Paso 2:** Leer FASE3_PASO1_DIAGNOSTICO.md
3. **Paso 3:** Crear FASE3_PASO2_COMPONENTES_UI.md (especificación)
4. **Paso 4:** Crear FASE3_PASO3_REFACTOR_HOME.md (arquitectura)
5. **Paso 5-8:** Crear specs para Claude Code y ejecutar
6. **Paso 9:** Validación manual y merge

---

## 📁 ESTRUCTURA DESPUÉS DE FASE 3

```
farecheck/src
├── components/
│   ├── ui/
│   │   ├── Card.tsx          ← NUEVO
│   │   ├── Text.tsx          ← NUEVO
│   │   ├── Loader.tsx        ← NUEVO
│   │   ├── Badge.tsx         ← NUEVO
│   │   ├── ViajeCard.tsx     ← MEJORADO
│   │   ├── IngresosLineChart.tsx
│   │   └── index.ts          ← ACTUALIZADO
│   ├── home/
│   │   ├── BalanceWidget.tsx     ← NUEVO
│   │   ├── TurnoWidget.tsx       ← NUEVO
│   │   ├── ActionButtons.tsx     ← NUEVO
│   │   └── index.ts            ← NUEVO
│   └── index.ts              ← ACTUALIZADO
│
├── screens/
│   └── home/
│       ├── HomeScreen.tsx    ← REFACTORIZADO
│       ├── TurnoActivo.tsx   ← SIN CAMBIOS
│       ├── ResumenTurno.tsx  ← SIN CAMBIOS
│       ├── DetalleViaje.tsx  ← SIN CAMBIOS
│   └── profile/
│       ├── Profile.tsx       ← SIN CAMBIOS
│       ├── DatosPersonales.tsx ← COMPLETADO
│       ├── ConfigUmbrales.tsx ← SIN CAMBIOS
│       └── Contactos.tsx     ← NUEVO
│
└── docs/
    └── FASE3/
        ├── FASE3_INDICE_MAESTRO.md       ← ESTE ARCHIVO
        ├── FASE3_PASO1_DIAGNOSTICO.md
        ├── FASE3_PASO2_COMPONENTES_UI.md
        ├── FASE3_PASO3_REFACTOR_HOME.md
        ├── FASE3_PASO4_IMPL_COMPONENTES.md
        ├── FASE3_PASO5_IMPL_HOME_REFACTOR.md
        ├── FASE3_PASO6_STUB_SCREENS.md
        ├── FASE3_PASO7_TESTS.md
        └── FASE3_PASO8_CIERRE.md
```

---

## ⚡ PRÓXIMOS PASOS

✅ **AHORA:** Crear FASE3_PASO1_DIAGNOSTICO.md (análisis detallado)  
↓  
**LUEGO:** Crear FASE3_PASO2_COMPONENTES_UI.md (especificación)  
↓  
**LUEGO:** Crear FASE3_PASO3_REFACTOR_HOME.md (arquitectura)  
↓  
**FINALMENTE:** Crear specs para Claude Code (PASO4-PASO8)

---

**¿Comenzamos con PASO 1?** 👇
