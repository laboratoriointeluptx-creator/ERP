/**
 * SYNTARA ERP Design System - Card Component
 */

import React, { forwardRef, ReactNode, useState } from 'react';
import { View, Pressable, Text, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../hooks';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardHover = 'none' | 'lift' | 'shadow' | 'border';

export interface CardProps { children?: ReactNode; variant?: CardVariant; padding?: CardPadding; hover?: CardHover; clickable?: boolean; onPress?: () => void; onLongPress?: () => void; disabled?: boolean; fullWidth?: boolean; bg?: string; radius?: number; borderWidth?: number; borderColor?: string; shadow?: string; style?: StyleProp<ViewStyle>; testID?: string; accessibilityRole?: 'button' | 'link' | 'none'; accessibilityLabel?: string; }

export interface CardHeaderProps { children?: ReactNode; title?: string; subtitle?: string; action?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string; }
export interface CardContentProps { children?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string; }
export interface CardFooterProps { children?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string; divider?: boolean; }
export interface KPICardProps { value: string | number; label: string; detail?: string; icon?: ReactNode; accentColor?: 'cyan' | 'blue' | 'success' | 'warning' | 'error' | 'info'; trend?: { value: string; type: 'up' | 'down' | 'neutral' }; clickable?: boolean; onPress?: () => void; loading?: boolean; style?: StyleProp<ViewStyle>; testID?: string; }

const paddingStyles: Record<CardPadding, number> = { none: 0, sm: 16, md: 20, lg: 24 };
const variantStyles: Record<CardVariant, { bg: string; borderColor: string; borderWidth: number }> = { default: { bg: '{colors.surface.primary}', borderColor: '{colors.border.primary}', borderWidth: 1 }, elevated: { bg: '{colors.surface.elevated}', borderColor: 'transparent', borderWidth: 0 }, outlined: { bg: 'transparent', borderColor: '{colors.border.primary}', borderWidth: 1 }, filled: { bg: '{colors.background.secondary}', borderColor: '{colors.border.primary}', borderWidth: 1 }, glass: { bg: 'rgba(11, 32, 51, 0.7)', borderColor: '{colors.border.primary}', borderWidth: 1 } };

const Card = forwardRef<any, CardProps>(({ children, variant = 'default', padding = 'md', hover = 'none', clickable = false, onPress, onLongPress, disabled = false, fullWidth = false, bg, radius, borderWidth, borderColor, shadow, style, testID, accessibilityRole, accessibilityLabel }, ref) => {
  const { theme } = useTheme(); const colors = theme.colors; const [hovered, setHovered] = useState(false); const [pressed, setPressed] = useState(false);
  const isInteractive = clickable && !disabled; const vStyles = variantStyles[variant]; const pValue = paddingStyles[padding];
  const resolveColor = (colorToken: string) => colorToken.startsWith('{colors.') ? colorToken.slice(8, -1).split('.').reduce((obj: any, key: string) => obj?.[key] ?? colorToken, colors) : colorToken;
  const backgroundColor = bg || resolveColor(vStyles.bg); const resolvedBorderColor = borderColor || resolveColor(vStyles.borderColor); const resolvedBorderWidth = borderWidth !== undefined ? borderWidth : vStyles.borderWidth; const resolvedRadius = radius !== undefined ? radius : theme.radius.semantic.card;
  let effectiveBg = backgroundColor; let effectiveBorderColor = resolvedBorderColor; let effectiveShadow: string | undefined = shadow;
  if (isInteractive && hover !== 'none') { if (hovered && !pressed) { switch (hover) { case 'lift': effectiveShadow = 'md'; break; case 'shadow': effectiveShadow = 'lg'; break; case 'border': effectiveBorderColor = colors.border.focus; break; } } if (pressed) effectiveBg = resolveColor('{colors.surface.pressed}'); }
  const cardStyle: ViewStyle = { backgroundColor: effectiveBg, borderWidth: resolvedBorderWidth, borderColor: effectiveBorderColor, borderRadius: resolvedRadius, padding: pValue, width: fullWidth ? '100%' : undefined, opacity: disabled ? 0.6 : 1 };
  if (effectiveShadow) { const ss = theme.shadows[effectiveShadow as keyof typeof theme.shadows]; if (ss && effectiveShadow !== 'none') Object.assign(cardStyle, ss); }
  const handlePressIn = () => { if (isInteractive) setPressed(true); }; const handlePressOut = () => { if (isInteractive) setPressed(false); };
  const Component = isInteractive ? Pressable : View;
  const combinedStyle = style ? (Array.isArray(style) ? [...style, cardStyle] : [style, cardStyle]) : cardStyle;
  return <Component ref={ref} onPress={onPress} onLongPress={onLongPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} accessibilityRole={accessibilityRole || (clickable ? 'button' : 'none')} accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} testID={testID} style={combinedStyle}><View>{children}</View></Component>;
});
Card.displayName = 'Card';

const CardHeader = forwardRef<View, CardHeaderProps>(({ children, title, subtitle, action, style, testID }, ref) => {
  const { theme } = useTheme();
  const headerStyle: ViewStyle = { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.semantic.inline, marginBottom: theme.spacing.semantic.sectionGap };
  if (style) { Object.assign(headerStyle, style); }
  const titleTextStyle: TextStyle = { fontSize: theme.typography.styles.titleLarge.fontSize, fontWeight: theme.typography.styles.titleLarge.fontWeight, fontFamily: theme.typography.fontFamily.primary, color: theme.colors.text.primary, lineHeight: theme.typography.styles.titleLarge.lineHeight, letterSpacing: theme.typography.styles.titleLarge.letterSpacing };
  const subtitleTextStyle: TextStyle = { fontSize: theme.typography.styles.bodySmall.fontSize, fontWeight: theme.typography.styles.bodySmall.fontWeight, fontFamily: theme.typography.fontFamily.primary, color: theme.colors.text.secondary, lineHeight: theme.typography.styles.bodySmall.lineHeight, marginTop: 2 };
  return <View ref={ref} style={headerStyle} testID={testID}><View style={{ flex: 1, minWidth: 0 }}>{title && <Text style={titleTextStyle}>{title}</Text>}{subtitle && <Text style={subtitleTextStyle}>{subtitle}</Text>}{children && !title && !subtitle && children}</View>{action && <View style={{ flexShrink: 0, marginLeft: theme.spacing.semantic.inline }}>{action}</View>}</View>;
});
CardHeader.displayName = 'CardHeader';

const CardContent = forwardRef<View, CardContentProps>(({ children, style, testID }, ref) => <View ref={ref} style={[{ flex: 1 }, style]} testID={testID}>{children}</View>);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<View, CardFooterProps>(({ children, style, testID, divider = true }, ref) => {
  const { theme } = useTheme(); const footerStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: theme.spacing.semantic.buttonGap, paddingTop: theme.spacing.semantic.sectionGap, marginTop: theme.spacing.semantic.sectionGap, borderTopWidth: divider ? 1 : 0, borderTopColor: theme.colors.border.primary };
  if (style) { Object.assign(footerStyle, style); }
  return <View ref={ref} style={footerStyle} testID={testID}>{children}</View>;
});
CardFooter.displayName = 'CardFooter';

const KPICard = forwardRef<any, KPICardProps>(({ value, label, detail, icon, accentColor = 'cyan', trend, clickable = false, onPress, loading = false, style, testID }, ref) => {
  const { theme } = useTheme(); const colors = theme.colors; const [hovered, setHovered] = useState(false);
  const accentColors = { cyan: { bg: colors.brand.cyanSubtle, text: colors.brand.cyan, border: colors.border.focus }, blue: { bg: 'rgba(0, 119, 182, 0.1)', text: colors.brand.blue, border: colors.brand.blue }, success: { bg: colors.semantic.success.subtle, text: colors.semantic.success.main, border: colors.border.success }, warning: { bg: colors.semantic.warning.subtle, text: colors.semantic.warning.main, border: colors.border.warning }, error: { bg: colors.semantic.error.subtle, text: colors.semantic.error.main, border: colors.border.error }, info: { bg: colors.semantic.info.subtle, text: colors.semantic.info.main, border: colors.border.focus } };
  const accent = accentColors[accentColor];
  const cardStyle: ViewStyle = { backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.primary, borderRadius: 12, padding: 20, minWidth: 180, minHeight: 122, gap: 12, opacity: clickable && hovered ? 0.9 : 1 };
  if (style) { Object.assign(cardStyle, style); }
  const iconContainerStyle: ViewStyle = { width: 40, height: 40, borderRadius: 10, backgroundColor: accent.bg, alignItems: 'center', justifyContent: 'center' };
  const valueStyle: TextStyle = { fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', color: '#F5FAFF', lineHeight: 36, letterSpacing: -0.3, fontVariant: ['tabular-nums'] };
  const labelStyle: TextStyle = { fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', color: '#9DB3C7', lineHeight: 17, letterSpacing: 1, textTransform: 'uppercase' };
  const detailStyle: TextStyle = { fontSize: 11, fontWeight: 'bold', fontFamily: 'Inter', color: accent.text, lineHeight: 16, letterSpacing: 0.5 };
  const trendColors = { up: '#10B981', down: '#EF4444', neutral: '#9DB3C7' };
  const trendStyle: TextStyle = { fontSize: 12, fontWeight: 'bold', fontFamily: 'JetBrains Mono', color: trendColors[trend?.type || 'neutral'], lineHeight: 17 };
  return <Pressable ref={ref} onPress={onPress} disabled={!clickable} accessibilityRole={clickable ? 'button' : 'none'} testID={testID} style={cardStyle}><View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}><View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', color: '#9DB3C7', lineHeight: 17, letterSpacing: 1, textTransform: 'uppercase' }} numberOfLines={1}>{label}</Text>{loading ? <View style={{ marginTop: 8, height: 32, width: '60%', backgroundColor: '#112D44', borderRadius: 4 }} /> : (<><Text style={{ fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter', color: '#F5FAFF', lineHeight: 36, letterSpacing: -0.3, fontVariant: ['tabular-nums'] }} numberOfLines={1}>{value}</Text>{(detail || trend) && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>{detail && <Text style={{ fontSize: 11, fontWeight: 'bold', fontFamily: 'Inter', color: accent.text, lineHeight: 16, letterSpacing: 0.5 }}>{detail}</Text>}{trend && <Text style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'JetBrains Mono', color: trendColors[trend?.type || 'neutral'], lineHeight: 17 }}>{trend.type === 'up' ? '↑' : trend.type === 'down' ? '↓' : '→'} {trend.value}</Text>}</View>}</>)}</View>{icon && <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: accent.bg, alignItems: 'center', justifyContent: 'center' }}>{React.isValidElement(icon) ? React.cloneElement(icon as any, { width: 40, height: 40, color: accent.text }) : icon}</View>}</View></Pressable>;
});
KPICard.displayName = 'KPICard';

export { Card, CardHeader, CardContent, CardFooter, KPICard };
export default Card;