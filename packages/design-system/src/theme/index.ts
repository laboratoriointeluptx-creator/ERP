/**
 * SYNTARA ERP Design System - Main Theme Export
 *
 * Tema completo que combina todos los design tokens
 * Listo para usar con styled-components, emotion, o React Native StyleSheet
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './dimensions';

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { dimensions } from './dimensions';

/**
 * Tema completo de SYNTARA ERP
 * Incluye todos los design tokens organizados por categoría
 */
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  dimensions,
  // Metadatos del tema
  meta: {
    name: 'SYNTARA ERP',
    version: '0.1.0',
    description: 'Sistema de diseño empresarial para SYNTARA ERP',
    author: 'SYNTARA Team',
    // Soporte de modo de color
    colorSchemes: ['dark'] as const,
    defaultColorScheme: 'dark' as const,
  },
} as const;

// Type export para el tema completo
export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;
export type ThemeRadius = typeof radius;
export type ThemeShadows = typeof shadows;
export type ThemeDimensions = typeof dimensions;

/**
 * Helper para acceder a valores del tema de forma type-safe
 * Uso: getThemeValue(theme, 'colors.brand.cyan')
 */
export function getThemeValue<T extends Theme, K extends keyof T>(
  themeObj: T,
  path: string
): unknown {
  return path.split('.').reduce((obj: unknown, key: string) => {
    if (obj && typeof obj === 'object' && key in obj) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, themeObj);
}

/**
 * Utilidad para crear estilos condicionales basados en el tema
 */
export const css = {
  /** Aplica estilos solo en modo oscuro (siempre en SYNTARA) */
  dark: (styles: Record<string, unknown>) => ({
    '@media (prefers-color-scheme: dark)': styles,
  }),

  /** Responsive breakpoints */
  responsive: {
    mobile: (styles: Record<string, unknown>) => ({
      '@media (max-width: 767px)': styles,
    }),
    tablet: (styles: Record<string, unknown>) => ({
      '@media (min-width: 768px) and (max-width: 991px)': styles,
    }),
    desktop: (styles: Record<string, unknown>) => ({
      '@media (min-width: 992px)': styles,
    }),
    wide: (styles: Record<string, unknown>) => ({
      '@media (min-width: 1200px)': styles,
    }),
  },

  /** Focus visible para accesibilidad */
  focusVisible: {
    outline: 'none',
    boxShadow: `0 0 0 2px ${colors.border.focus}, 0 0 0 4px ${colors.background.primary}`,
  },

  /** Visualmente oculto pero accesible para screen readers */
  visuallyHidden: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0',
  },

  /** Truncate text con ellipsis */
  truncate: (lines = 1) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis' as const,
    whiteSpace: lines === 1 ? ('nowrap' as const) : undefined,
    display: lines > 1 ? '-webkit-box' : undefined,
    WebkitLineClamp: lines > 1 ? lines : undefined,
    WebkitBoxOrient: lines > 1 ? 'vertical' : undefined,
  }),

  /** Glassmorphism effect para cards/modales */
  glass: (intensity: 'light' | 'medium' | 'strong' = 'medium') => {
    const opacities = { light: 0.05, medium: 0.1, strong: 0.15 };
    const blurs = { light: 8, medium: 16, strong: 24 };
    return {
      backgroundColor: `rgba(11, 32, 51, ${opacities[intensity]})`,
      backdropFilter: `blur(${blurs[intensity]}px)`,
      border: `1px solid ${colors.border.primary}`,
    };
  },

  /** Gradient text para títulos de marca */
  gradientText: (gradient: keyof typeof colors.gradient = 'primary') => ({
    background: colors.gradient[gradient],
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }),
};

export default theme;