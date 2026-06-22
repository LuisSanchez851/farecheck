import React from 'react';
import { Text as RNText, StyleProp, TextStyle } from 'react-native';
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
  color = colors.textPrimary,
  align = 'left',
  style,
  children,
  testID,
  ...props
}: TextProps) {
  const typographyStyle: Record<Variant, TextStyle> = {
    display: {
      fontSize: typography.display.fontSize,
      fontWeight: typography.display.fontWeight,
      lineHeight: 48,
    },
    h1: {
      fontSize: typography.h1.fontSize,
      fontWeight: typography.h1.fontWeight,
      lineHeight: 32,
    },
    h2: {
      fontSize: typography.h2.fontSize,
      fontWeight: typography.h2.fontWeight,
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
      textTransform: 'uppercase',
    },
  };

  const fontWeights: Record<Weight, TextStyle['fontWeight']> = {
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
