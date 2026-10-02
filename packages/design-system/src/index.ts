/**
 * SYNTARA ERP Design System - Main Export
 */

// Theme tokens (explicit exports to avoid duplicate type conflicts)
export { colors } from './theme/colors';
export { typography } from './theme/typography';
export { spacing } from './theme/spacing';
export { radius } from './theme/radius';
export { shadows } from './theme/shadows';
export { dimensions } from './theme/dimensions';
export { theme } from './theme';
export type { ColorTokens, BackgroundColors, SurfaceColors, BorderColors, BrandColors, TextColors, SemanticColors, StatusColors, InventoryColors, SalesFlowColors, PurchaseFlowColors, ShadowColors, GradientColors } from './theme/colors';
export type { TypographyTokens, FontFamilyTokens, FontWeightTokens, FontSizeTokens, LineHeightTokens, LetterSpacingTokens, TextStyleTokens } from './theme/typography';
export type { SpacingTokens, SpacingScale, SemanticSpacing, ComponentSpacing, LayoutTokens } from './theme/spacing';
export type { RadiusTokens, RadiusScale, SemanticRadius, ComponentRadius, ResponsiveRadius } from './theme/radius';
export type { ShadowTokens, ElevationLevel, BrandShadow, ComponentShadows, CssShadows } from './theme/shadows';
export type { DimensionTokens, IconSize, AvatarSize, ButtonSize, InputSize, ModalSize, Breakpoint } from './theme/dimensions';
export type { Theme, ThemeColors, ThemeTypography, ThemeSpacing, ThemeRadius, ThemeShadows, ThemeDimensions } from './theme';

// Components
export * from './components';

// Hooks
export * from './hooks';