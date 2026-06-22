# FASE 3 PASO 2: ESPECIFICACIÓN DE COMPONENTES UI
## Interfaces, Props, Estilos y Arquitectura

**Fecha:** 2026-06-22  
**Status:** 🔄 EN PROCESO (validación con Luis)

---

## 🎨 PALETA DE COLORES (REFERENCE)

```typescript
// src/constants/colors.ts (actual)
export const colors = {
  primary: '#00C8D7',      // Cyan
  green: '#1DB87A',        // Verde
  yellow: '#F5A623',       // Amarillo
  red: '#E53935',          // Rojo
  navy: '#1A2B5E',         // Navy (headers)
  night: '#0D1B3E',        // Night (fondos oscuros)
  background: '#F5F7FA',   // Fondo general
  white: '#FFFFFF',
  textDark: '#1A1A1A',
  textPrimary: '#1A1A1A',
  textSecondary: '#8B93A0',
  textMuted: '#B8C0CC',
  cyanLight: '#6EE7E7',
  border: '#E8E8E8',
};
```

---

## 📦 COMPONENTES BASE UI (primitivos)

### 1. Card.tsx
**Propósito:** Envolvedor genérico para tarjetas reutilizables

```typescript
// src/components/ui/Card.tsx

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  backgroundColor?: string;
  padding?: number;
  testID?: string;
}

export default function Card({
  children,
  style,
  onPress,
  variant = 'default',
  backgroundColor,
  padding = spacing.lg,
  testID,
}: CardProps) {
  const Component = onPress ? TouchableOpacity : View;

  const variantStyles = {
    default: {
      backgroundColor: backgroundColor || colors.white,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    elevated: {
      backgroundColor: backgroundColor || colors.white,
      borderRadius: radius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.border,
    },
  };

  return (
    <Component
      style={[variantStyles[variant], { padding }, style]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      {children}
    </Component>
  );
}

// Styles
const styles = StyleSheet.create({
  // (vacío si todo usa inline styles)
});
```

**Uso:**
```typescript
<Card variant="elevated" padding={spacing.xl}>
  <Text variant="h2">Contenido</Text>
</Card>

<Card onPress={() => navigation.navigate('Detail')}>
  <Text>Presionable</Text>
</Card>
```

---

### 2. Text.tsx
**Propósito:** Componente de texto centralizado con tipografía consistente

```typescript
// src/components/ui/Text.tsx

import React from 'react';
import { Text as RNText, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'overline';
type Weight = 'regular' | '500' | '600' | '700';

interface TextProps extends React.ComponentProps<typeof RNText> {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  align?: 'left' | 'center' | 'right';
  testID?: string;
}

export default function Text({
  variant = 'body',
  weight = 'regular',
  color = colors.textDark,
  align = 'left',
  style,
  children,
  testID,
  ...props
}: TextProps) {
  const typographyStyle = {
    display: {
      fontSize: typography.display.fontSize,
      fontWeight: typography.display.fontWeight as '700',
      lineHeight: 48,
    },
    h1: {
      fontSize: typography.h1.fontSize,
      fontWeight: typography.h1.fontWeight as '600',
      lineHeight: 32,
    },
    h2: {
      fontSize: typography.h2.fontSize,
      fontWeight: typography.h2.fontWeight as '600',
      lineHeight: 26,
    },
    h3: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
    },
    body: {
      fontSize: typography.body.fontSize,
      fontWeight: '400',
      lineHeight: 21,
    },
    caption: {
      fontSize: typography.caption.fontSize,
      fontWeight: '400',
      lineHeight: 18,
    },
    overline: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
      textTransform: 'uppercase' as const,
    },
  };

  const fontWeights: Record<Weight, string> = {
    regular: '400',
    '500': '500',
    '600': '600',
    '700': '700',
  };

  return (
    <RNText
      style={[
        typographyStyle[variant],
        { color, textAlign: align, fontWeight: fontWeights[weight] },
        style,
      ]}
      testID={testID}
      {...props}
    >
      {children}
    </RNText>
  );
}
```

**Uso:**
```typescript
<Text variant="h1" weight="700" color={colors.navy}>Título</Text>
<Text variant="body" color={colors.textSecondary}>Subtítulo</Text>
<Text variant="caption" align="center">Pequeño</Text>
```

---

### 3. Loader.tsx
**Propósito:** Spinner reutilizable

```typescript
// src/components/ui/Loader.tsx

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  testID?: string;
}

export default function Loader({
  size = 'large',
  color = colors.primary,
  fullScreen = false,
  testID,
}: LoaderProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen} testID={testID}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={color} testID={testID} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
```

**Uso:**
```typescript
{loading ? <Loader /> : <Content />}
{loading && <Loader fullScreen />}
```

---

### 4. Badge.tsx
**Propósito:** Etiqueta reutilizable con variantes

```typescript
// src/components/ui/Badge.tsx

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import Text from './Text';

type Variant = 'success' | 'danger' | 'warning' | 'info';
type Size = 'sm' | 'md';

interface BadgeProps {
  label: string;
  icon?: string;
  variant?: Variant;
  size?: Size;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function Badge({
  label,
  icon,
  variant = 'info',
  size = 'md',
  style,
  testID,
}: BadgeProps) {
  const variantColors = {
    success: { bg: colors.green, text: colors.white },
    danger: { bg: colors.red, text: colors.white },
    warning: { bg: colors.yellow, text: colors.textDark },
    info: { bg: colors.primary, text: colors.white },
  };

  const sizeStyles = {
    sm: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      gap: 2,
    },
    md: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      gap: 3,
    },
  };

  const { bg, text } = variantColors[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          ...sizeStyles[size],
        },
        style,
      ]}
      testID={testID}
    >
      {icon && <Ionicons name={icon as any} size={size === 'sm' ? 12 : 14} color={text} />}
      <Text variant={size === 'sm' ? 'caption' : 'body'} color={text} weight="600">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
  },
});
```

**Uso:**
```typescript
<Badge label="+15%" icon="trending-up" variant="success" />
<Badge label="Activo" variant="info" size="md" />
```

---

### 5. Button.tsx
**Propósito:** Botón reutilizable con variantes

```typescript
// src/components/ui/Button.tsx

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import Text from './Text';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: Variant;
  size?: Size;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: colors.navy,
      borderWidth: 0,
    },
    success: {
      backgroundColor: colors.green,
      borderWidth: 0,
    },
    danger: {
      backgroundColor: colors.red,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
  };

  const sizeStyles = {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      height: 32,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
      height: 44,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: spacing.xl,
      height: 56,
    },
  };

  const textColor = variant === 'outline' ? colors.primary : colors.white;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        { opacity: disabled || loading ? 0.6 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon as any} size={18} color={textColor} />}
          <Text weight="700" color={textColor}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
});
```

**Uso:**
```typescript
<Button label="Iniciar turno" onPress={handleIniciar} variant="primary" size="lg" icon="play" />
<Button label="Cancelar" onPress={handleCancel} variant="outline" size="md" />
<Button label="Cargando..." loading={loading} disabled />
```

---

## 🎯 COMPONENTES HOME ESPECÍFICOS

### 1. BalanceWidget.tsx
**Propósito:** Mostrar balance del día

```typescript
// src/components/home/BalanceWidget.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { formatCOP } from '../../utils/format';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Badge from '../ui/Badge';
import Loader from '../ui/Loader';
import type { BalanceDiaResponse } from '../../types/api.types';

interface BalanceWidgetProps {
  balance: BalanceDiaResponse | null;
  loading?: boolean;
  error?: boolean;
  testID?: string;
}

export default function BalanceWidget({
  balance,
  loading = false,
  error = false,
  testID,
}: BalanceWidgetProps) {
  if (loading) {
    return (
      <Card backgroundColor={colors.navy} padding={spacing.xl} testID={`${testID}-loading`}>
        <Loader color={colors.cyanLight} />
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card backgroundColor={colors.navy} padding={spacing.xl} testID={`${testID}-error`}>
        <Text color={colors.cyanLight} variant="body">
          No pudimos cargar tu balance. Desliza para reintentar.
        </Text>
      </Card>
    );
  }

  const comparativa = balance.comparativa_ayer_pct ?? 0;
  const isPositive = comparativa >= 0;

  return (
    <Card
      backgroundColor={colors.navy}
      padding={spacing.xl}
      style={styles.card}
      testID={testID}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="body" color={colors.cyanLight} weight="600">
          Balance del día
        </Text>
        <Badge
          label={`${isPositive ? '+' : ''}${comparativa}%`}
          icon={isPositive ? 'trending-up' : 'trending-down'}
          variant={isPositive ? 'success' : 'danger'}
          size="sm"
        />
      </View>

      {/* Monto */}
      <Text variant="display" color={colors.white} weight="700" style={styles.monto}>
        {formatCOP(balance.total_cop)}
      </Text>

      {/* Footer stats */}
      <View style={styles.footer}>
        <View style={styles.stat}>
          <Ionicons name="car-outline" size={16} color={colors.cyanLight} />
          <Text variant="caption" color={colors.cyanLight}>
            {balance.viajes} viajes
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Ionicons name="navigate-outline" size={16} color={colors.cyanLight} />
          <Text variant="caption" color={colors.cyanLight}>
            {balance.km_total?.toFixed(1) ?? '0'} km
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monto: {
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.navy,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.navy,
  },
});
```

---

### 2. TurnoWidget.tsx
**Propósito:** Mostrar estado del turno activo

```typescript
// src/components/home/TurnoWidget.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { formatDuracion } from '../../utils/format';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Loader from '../ui/Loader';
import type { TurnoActivoResponse } from '../../types/api.types';

interface TurnoWidgetProps {
  turno: TurnoActivoResponse | null;
  loading?: boolean;
  testID?: string;
}

export default function TurnoWidget({
  turno,
  loading = false,
  testID,
}: TurnoWidgetProps) {
  const [duracion, setDuracion] = useState('0h 0m');

  useEffect(() => {
    if (!turno?.fecha_inicio) return;

    const interval = setInterval(() => {
      const ahora = new Date();
      const inicio = new Date(turno.fecha_inicio);
      const minutos = Math.floor((ahora.getTime() - inicio.getTime()) / 1000 / 60);
      setDuracion(formatDuracion(minutos));
    }, 1000);

    return () => clearInterval(interval);
  }, [turno?.fecha_inicio]);

  if (loading) {
    return (
      <Card padding={spacing.lg} testID={`${testID}-loading`}>
        <Loader />
      </Card>
    );
  }

  if (!turno) {
    return (
      <Card padding={spacing.xl} style={styles.emptyCard} testID={`${testID}-empty`}>
        <Text variant="body" color={colors.textSecondary} align="center">
          Inicia un turno para comenzar a registrar viajes.
        </Text>
      </Card>
    );
  }

  return (
    <Card padding={spacing.lg} style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text variant="caption" weight="600" color={colors.green}>
            TURNO ACTIVO
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <View>
            <Text variant="caption" color={colors.textSecondary}>
              Duración
            </Text>
            <Text variant="h2" weight="700" color={colors.navy}>
              {duracion}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <Ionicons name="car-outline" size={20} color={colors.primary} />
          <View>
            <Text variant="caption" color={colors.textSecondary}>
              Viajes
            </Text>
            <Text variant="h2" weight="700" color={colors.navy}>
              {turno.viajes_completados ?? 0}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing.md },
  emptyCard: { minHeight: 100, justifyContent: 'center' },
  header: {
    marginBottom: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
```

---

### 3. ActionButtons.tsx
**Propósito:** Botones de acción en footer

```typescript
// src/components/home/ActionButtons.tsx

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
```

---

## 📝 ÍNDICE DE EXPORTACIONES

```typescript
// src/components/ui/index.ts
export { default as Card } from './Card';
export { default as Text } from './Text';
export { default as Loader } from './Loader';
export { default as Badge } from './Badge';
export { default as Button } from './Button';

// src/components/home/index.ts
export { default as BalanceWidget } from './BalanceWidget';
export { default as TurnoWidget } from './TurnoWidget';
export { default as ActionButtons } from './ActionButtons';

// src/components/index.ts
export * from './ui';
export * from './home';
```

---

## ✅ CHECKLIST ESPECIFICACIÓN

- [x] Card.tsx especificado
- [x] Text.tsx especificado
- [x] Loader.tsx especificado
- [x] Badge.tsx especificado
- [x] Button.tsx especificado
- [x] BalanceWidget.tsx especificado
- [x] TurnoWidget.tsx especificado
- [x] ActionButtons.tsx especificado
- [x] Índices de exportación especificados

---

## 🚀 SIGUIENTE PASO

→ **PASO 3:** Crear `FASE3_PASO3_REFACTOR_HOME.md` (cómo refactorizar HomeScreen.tsx con estos componentes)

