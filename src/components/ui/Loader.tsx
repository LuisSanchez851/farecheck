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
