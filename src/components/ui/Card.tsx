import React from 'react';
import { View, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
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
  const Component: React.ComponentType<any> = onPress ? TouchableOpacity : View;

  const variantStyles: Record<NonNullable<CardProps['variant']>, ViewStyle> = {
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
