/**
 * SYNTARA ERP Design System - Text Component
 */

import React, { forwardRef, ReactNode } from 'react';
import { Text, TextStyle, StyleProp, Platform } from 'react-native';
import { useTheme } from '../hooks';

export type TextVariant = 'displayLarge' | 'displayMedium' | 'displaySmall' | 'headlineLarge' | 'headlineMedium' | 'headlineSmall' | 'titleLarge' | 'titleMedium' | 'titleSmall' | 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'labelLarge' | 'labelMedium' | 'labelSmall' | 'labelXSmall' | 'buttonLarge' | 'buttonMedium' | 'buttonSmall' | 'dataLarge' | 'dataMedium' | 'dataSmall' | 'dataXSmall' | 'codeInline' | 'codeBlock' | 'navItem' | 'navItemActive' | 'tableHeader' | 'tableCell' | 'tableCellMono' | 'inputLabel' | 'inputText' | 'inputPlaceholder' | 'helperText' | 'errorText' | 'badgeLarge' | 'badgeMedium' | 'badgeSmall' | 'kpiValue' | 'kpiLabel' | 'kpiDetail' | 'caption';

export interface TextProps { children?: ReactNode; variant?: TextVariant; color?: string; weight?: TextStyle['fontWeight']; size?: number; lineHeight?: number; letterSpacing?: number; align?: 'auto' | 'left' | 'right' | 'center' | 'justify'; transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'; truncate?: boolean | number; numberOfLines?: number; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; mono?: boolean; tabularNums?: boolean; style?: StyleProp<TextStyle>; testID?: string; ref?: React.RefObject<Text>; as?: React.ElementType; }

const variantStyleMap: Record<TextVariant, string> = { displayLarge: 'displayLarge', displayMedium: 'displayMedium', displaySmall: 'displaySmall', headlineLarge: 'headlineLarge', headlineMedium: 'headlineMedium', headlineSmall: 'headlineSmall', titleLarge: 'titleLarge', titleMedium: 'titleMedium', titleSmall: 'titleSmall', bodyLarge: 'bodyLarge', bodyMedium: 'bodyMedium', bodySmall: 'bodySmall', labelLarge: 'labelLarge', labelMedium: 'labelMedium', labelSmall: 'labelSmall', labelXSmall: 'labelXSmall', buttonLarge: 'buttonLarge', buttonMedium: 'buttonMedium', buttonSmall: 'buttonSmall', dataLarge: 'dataLarge', dataMedium: 'dataMedium', dataSmall: 'dataSmall', dataXSmall: 'dataXSmall', codeInline: 'codeInline', codeBlock: 'codeBlock', navItem: 'navItem', navItemActive: 'navItemActive', tableHeader: 'tableHeader', tableCell: 'tableCell', tableCellMono: 'tableCellMono', inputLabel: 'inputLabel', inputText: 'inputText', inputPlaceholder: 'inputPlaceholder', helperText: 'helperText', errorText: 'errorText', badgeLarge: 'badgeLarge', badgeMedium: 'badgeMedium', badgeSmall: 'badgeSmall', kpiValue: 'kpiValue', kpiLabel: 'kpiLabel', kpiDetail: 'kpiDetail', caption: 'caption' };

const TextComponent = forwardRef<Text, TextProps>(({ children, variant = 'bodyMedium', color, weight, size, lineHeight, letterSpacing, align, transform, truncate, numberOfLines, bold, italic, underline, strikethrough, mono, tabularNums, style, testID, as: AsComponent = Text, ...rest }, ref) => {
  const { theme, getTypography } = useTheme();
  const variantKey = variant ? variantStyleMap[variant] : 'bodyMedium';
  const variantStyle = getTypography(variantKey);
  const fontFamily = mono ? theme.typography.fontFamily.mono : theme.typography.fontFamily.primary;
  const textStyle: TextStyle = { ...variantStyle, fontFamily, color, fontWeight: bold ? theme.typography.fontWeight.bold : weight, fontSize: size, lineHeight, letterSpacing, textAlign: align, textTransform: transform, fontStyle: italic ? 'italic' : undefined, textDecorationLine: underline ? 'underline' : strikethrough ? 'line-through' : undefined, fontVariant: tabularNums ? ['tabular-nums'] : undefined };
  if (truncate) { const lines = typeof truncate === 'number' ? truncate : 1; (textStyle as any).numberOfLines = lines; if (Platform.OS === 'web') { (textStyle as any).overflow = 'hidden'; (textStyle as any).textOverflow = 'ellipsis'; if (lines === 1) (textStyle as any).whiteSpace = 'nowrap'; else { (textStyle as any).display = '-webkit-box'; (textStyle as any).WebkitLineClamp = lines; (textStyle as any).WebkitBoxOrient = 'vertical'; } } } else if (numberOfLines) (textStyle as any).numberOfLines = numberOfLines;
  return <AsComponent ref={ref} style={[textStyle, style]} testID={testID} {...rest}>{children}</AsComponent>;
});
TextComponent.displayName = 'Text';
export default TextComponent;