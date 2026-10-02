/**
 * SYNTARA ERP Design System - Badge Component
 */

import React, { forwardRef, ReactNode } from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../hooks';

export type BadgeVariant = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'ghost';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: 'rounded' | 'pill' | 'square';
  dot?: boolean;
  dotColor?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  clickable?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  ref?: React.RefObject<View>;
}

const sizeStyles: Record<BadgeSize, {
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  gap: number;
  iconSize: number;
  dotSize: number;
  minHeight: number;
  borderRadius: number | string;
}> = {
  xs: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 9, gap: 3, iconSize: 10, dotSize: 5, minHeight: 16, borderRadius: 4 },
  sm: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, gap: 4, iconSize: 11, dotSize: 6, minHeight: 18, borderRadius: 9999 },
  md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, gap: 5, iconSize: 12, dotSize: 7, minHeight: 22, borderRadius: 9999 },
  lg: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 12, gap: 6, iconSize: 14, dotSize: 8, minHeight: 26, borderRadius: 9999 },
};

const variantStyles: Record<BadgeVariant, {
  bg: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
}> = {
  default: { bg: '{colors.surface.primary}', textColor: '{colors.text.secondary}', borderColor: '{colors.border.primary}', borderWidth: 1 },
  primary: { bg: '{colors.brand.blue}', textColor: '{colors.text.onBrand}', borderColor: 'transparent', borderWidth: 0 },
  accent: { bg: '{colors.brand.cyanSubtle}', textColor: '{colors.brand.cyan}', borderColor: '{colors.border.focus}', borderWidth: 1 },
  success: { bg: '{colors.semantic.success.subtle}', textColor: '{colors.semantic.success.main}', borderColor: '{colors.border.success}', borderWidth: 1 },
  warning: { bg: '{colors.semantic.warning.subtle}', textColor: '{colors.semantic.warning.main}', borderColor: '{colors.border.warning}', borderWidth: 1 },
  error: { bg: '{colors.semantic.error.subtle}', textColor: '{colors.semantic.error.main}', borderColor: '{colors.border.error}', borderWidth: 1 },
  info: { bg: '{colors.semantic.info.subtle}', textColor: '{colors.semantic.info.main}', borderColor: '{colors.border.focus}', borderWidth: 1 },
  outline: { bg: 'transparent', textColor: '{colors.text.secondary}', borderColor: '{colors.border.primary}', borderWidth: 1 },
  ghost: { bg: 'transparent', textColor: '{colors.text.secondary}', borderColor: 'transparent', borderWidth: 0 },
};

const Badge = forwardRef<View, BadgeProps>(
  ({ children, variant = 'default', size = 'md', shape = 'pill', dot, dotColor, leftIcon, rightIcon, clickable = false, onPress, disabled = false, style, textStyle, testID, ...rest }, forwardedRef) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    const sStyles = sizeStyles[size];
    const vStyles = variantStyles[variant];

    const resolveColor = (colorToken: string): string => {
      if (colorToken.startsWith('{colors.')) {
        const path = colorToken.slice(8, -1);
        return path.split('.').reduce((obj: any, key: string) => obj?.[key] ?? colorToken, colors) as string;
      }
      return colorToken;
    };

    const bgColor = resolveColor(vStyles.bg);
    const textColor = resolveColor(vStyles.textColor);
    const borderColor = resolveColor(vStyles.borderColor);
    const borderWidth = vStyles.borderWidth;

    const borderRadius = shape === 'square' ? 2 : shape === 'rounded' ? 6 : sStyles.borderRadius;

    const badgeStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: sStyles.paddingHorizontal,
      paddingVertical: sStyles.paddingVertical,
      gap: sStyles.gap,
      backgroundColor: bgColor,
      borderWidth,
      borderColor,
      borderRadius,
      minHeight: sStyles.minHeight,
      opacity: disabled ? 0.5 : 1,
    };

    const textStyleBase: TextStyle = {
      fontSize: sStyles.fontSize,
      fontWeight: theme.typography.fontWeight.bold,
      fontFamily: theme.typography.fontFamily.primary,
      color: textColor,
      letterSpacing: 0.5,
      lineHeight: sStyles.fontSize + 4,
      textTransform: 'uppercase',
    };

    const dotStyle: ViewStyle = {
      width: sStyles.dotSize,
      height: sStyles.dotSize,
      borderRadius: sStyles.dotSize / 2,
      backgroundColor: dotColor || textColor,
    };

    const iconStyle: ViewStyle = {
      width: sStyles.iconSize,
      height: sStyles.iconSize,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const handlePress = (event: React.BaseSyntheticEvent) => {
      event.preventDefault();
      if (!disabled && clickable && onPress) {
        onPress();
      }
    };

    if (clickable) {
      return (
        <Pressable
          ref={forwardedRef}
          onPress={handlePress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          testID={testID}
          style={[{ ...badgeStyle, ...(style as ViewStyle) }]}
          {...rest}
        >
          {dot && <View style={dotStyle} />}
          {leftIcon && (
            <View style={iconStyle}>
              {React.isValidElement(leftIcon)
                ? React.cloneElement(leftIcon as React.ReactElement, {
                    width: sStyles.iconSize,
                    height: sStyles.iconSize,
                    color: textColor,
                  } as Record<string, unknown>)
                : leftIcon}
            </View>
          )}
          <Text style={[{ ...textStyleBase, ...(textStyle as TextStyle) }]}>{children}</Text>
          {rightIcon && (
            <View style={iconStyle}>
              {React.isValidElement(rightIcon)
                ? React.cloneElement(rightIcon as React.ReactElement, {
                    width: sStyles.iconSize,
                    height: sStyles.iconSize,
                    color: textColor,
                  } as Record<string, unknown>)
                : rightIcon}
            </View>
          )}
        </Pressable>
      );
    }

    return (
      <View
        ref={forwardedRef}
        testID={testID}
        style={[{ ...badgeStyle, ...(style as ViewStyle) }]}
        {...rest}
      >
        {dot && <View style={dotStyle} />}
        {leftIcon && (
          <View style={iconStyle}>
            {React.isValidElement(leftIcon)
              ? React.cloneElement(leftIcon as React.ReactElement, {
                  width: sStyles.iconSize,
                  height: sStyles.iconSize,
                  color: textColor,
                } as Record<string, unknown>)
              : leftIcon}
          </View>
        )}
        <Text style={[{ ...textStyleBase, ...(textStyle as TextStyle) }]}>{children}</Text>
        {rightIcon && (
          <View style={iconStyle}>
            {React.isValidElement(rightIcon)
              ? React.cloneElement(rightIcon as React.ReactElement, {
                  width: sStyles.iconSize,
                  height: sStyles.iconSize,
                  color: textColor,
                } as Record<string, unknown>)
              : rightIcon}
          </View>
        )}
      </View>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;