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
  const variantColors: Record<Variant, { bg: string; text: string }> = {
    success: { bg: colors.green, text: colors.white },
    danger: { bg: colors.red, text: colors.white },
    warning: { bg: colors.amber, text: colors.textPrimary },
    info: { bg: colors.primary, text: colors.white },
  };

  const sizeStyles: Record<Size, ViewStyle> = {
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
