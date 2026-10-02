/**
 * SYNTARA ERP - ActivityIndicator for Web
 * Simple spinner component for React Native Web
 */

import React from 'react';
import { View } from 'react-native';

export interface ActivityIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  style?: any;
  animating?: boolean;
}

export function ActivityIndicator({ size = 'large', color = '#00C8F5', style, animating = true }: ActivityIndicatorProps) {
  if (!animating) return null;

  const sizeValue = size === 'large' ? 40 : 24;

  return (
    <View
      style={[
        styles.container,
        { width: sizeValue, height: sizeValue, borderColor: color },
        style,
      ]}
    />
  );
}

const styles = {
  container: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: '#00C8F5',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default ActivityIndicator;