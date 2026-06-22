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
  const variantStyles: Record<Variant, ViewStyle> = {
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

  const sizeStyles: Record<Size, ViewStyle> = {
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
