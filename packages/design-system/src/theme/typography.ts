/**
 * SYNTARA ERP Design System - Typography Tokens
 *
 * Sistema tipográfico basado en:
 * - Inter como fuente principal (moderna, legible, técnica)
 * - JetBrains Mono para datos numéricos/código
 * - Escala modular 1.25 (major third)
 * - Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
 */

export const typography = {
  // ==========================================
  // FONT FAMILIES
  // ==========================================
  fontFamily: {
    /** Fuente principal - Inter */
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    /** Fuente monoespaciada - JetBrains Mono */
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace',
    /** Fallback del sistema */
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  // ==========================================
  // FONT WEIGHTS
  // ==========================================
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // ==========================================
  // FONT SIZES - Escala modular 1.25
  // Base: 14px (0.875rem)
  // ==========================================
  fontSize: {
    /** 10px / 0.625rem - Micro text, labels pequeños */
    xs: { size: 10, lineHeight: 14, letterSpacing: 0.5 },
    /** 11px / 0.6875rem - Caption, timestamps */
    sm: { size: 11, lineHeight: 16, letterSpacing: 0.5 },
    /** 12px / 0.75rem - Small text, secondary labels */
    baseSm: { size: 12, lineHeight: 17, letterSpacing: 0 },
    /** 13px / 0.8125rem - Body small */
    smMd: { size: 13, lineHeight: 18, letterSpacing: 0 },
    /** 14px / 0.875rem - BASE - Body text principal */
    base: { size: 14, lineHeight: 20, letterSpacing: 0 },
    /** 15px / 0.9375rem - Body large */
    md: { size: 15, lineHeight: 22, letterSpacing: 0 },
    /** 16px / 1rem - Input text, button text */
    lg: { size: 16, lineHeight: 24, letterSpacing: 0 },
    /** 18px / 1.125rem - Subheadings, emphasized text */
    xl: { size: 18, lineHeight: 26, letterSpacing: -0.1 },
    /** 20px / 1.25rem - Section titles */
    '2xl': { size: 20, lineHeight: 28, letterSpacing: -0.2 },
    /** 22px / 1.375rem - Card titles */
    '3xl': { size: 22, lineHeight: 30, letterSpacing: -0.3 },
    /** 24px / 1.5rem - Page titles */
    '4xl': { size: 24, lineHeight: 32, letterSpacing: -0.4 },
    /** 28px / 1.75rem - Hero titles */
    '5xl': { size: 28, lineHeight: 36, letterSpacing: -0.5 },
    /** 32px / 2rem - Large hero */
    '6xl': { size: 32, lineHeight: 40, letterSpacing: -0.6 },
    /** 36px / 2.25rem - Display */
    '7xl': { size: 36, lineHeight: 44, letterSpacing: -0.7 },
    /** 48px / 3rem - Display large */
    '8xl': { size: 48, lineHeight: 56, letterSpacing: -1 },
  },

  // ==========================================
  // LINE HEIGHTS
  // ==========================================
  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // ==========================================
  // LETTER SPACING
  // ==========================================
  letterSpacing: {
    tighter: -0.5,
    tight: -0.3,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
    /** Para labels en mayúsculas */
    uppercase: 1.5,
  },

  // ==========================================
  // TEXT STYLES - Estilos compuestos listos para usar
  // ==========================================
  styles: {
    // --- Display / Hero ---
    displayLarge: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 800,
      fontSize: 48,
      lineHeight: 56,
      letterSpacing: -1,
    },
    displayMedium: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 800,
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -0.7,
    },
    displaySmall: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 800,
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.5,
    },

    // --- Headlines ---
    headlineLarge: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 800,
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.4,
    },
    headlineMedium: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 800,
      fontSize: 22,
      lineHeight: 30,
      letterSpacing: -0.3,
    },
    headlineSmall: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.2,
    },

    // --- Titles ---
    titleLarge: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 18,
      lineHeight: 26,
      letterSpacing: -0.1,
    },
    titleMedium: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
    titleSmall: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },

    // --- Body ---
    bodyLarge: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 400,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    bodySmall: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 400,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 0,
    },

    // --- Labels ---
    labelLarge: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 600,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 600,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 600,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelXSmall: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },

    // --- UI Specific ---
    buttonLarge: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.2,
    },
    buttonMedium: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.2,
    },
    buttonSmall: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 0.5,
    },

    // --- Data / Numbers ---
    dataLarge: {
      fontFamily: '{fontFamily.mono}',
      fontWeight: 700,
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.3,
      tabularNums: true,
    },
    dataMedium: {
      fontFamily: '{fontFamily.mono}',
      fontWeight: 600,
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.2,
      tabularNums: true,
    },
    dataSmall: {
      fontFamily: '{fontFamily.mono}',
      fontWeight: 600,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
      tabularNums: true,
    },
    dataXSmall: {
      fontFamily: '{fontFamily.mono}',
      fontWeight: 500,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 0,
      tabularNums: true,
    },

    // --- Code / Technical ---
    codeInline: {
      fontFamily: '{fontFamily.mono}',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0,
    },
    codeBlock: {
      fontFamily: '{fontFamily.mono}',
      fontWeight: 400,
      fontSize: 12,
      lineHeight: 18,
      letterSpacing: 0,
    },

    // --- Navigation ---
    navItem: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 600,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    navItemActive: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },

    // --- Table ---
    tableHeader: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
    tableCell: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0,
    },
    tableCellMono: {
      fontFamily: '{fontFamily.mono}',
      fontWeight: 500,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 0,
    },

    // --- Form ---
    inputLabel: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 0,
    },
    inputText: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    inputPlaceholder: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    helperText: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0,
    },
    errorText: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 500,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 0,
    },

    // --- Caption ---
    caption: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0,
    },

    // --- Badge / Tag ---
    badgeLarge: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    badgeMedium: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.5,
    },
    badgeSmall: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 9,
      lineHeight: 12,
      letterSpacing: 0.5,
    },

    // --- KPI / Metric ---
    kpiValue: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 800,
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.6,
      tabularNums: true,
    },
    kpiLabel: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: 17,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
    kpiDetail: {
      fontFamily: '{fontFamily.primary}',
      fontWeight: 700,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
} as const;

// Type exports
export type TypographyTokens = typeof typography;
export type FontFamilyTokens = typeof typography.fontFamily;
export type FontWeightTokens = typeof typography.fontWeight;
export type FontSizeTokens = typeof typography.fontSize;
export type LineHeightTokens = typeof typography.lineHeight;
export type LetterSpacingTokens = typeof typography.letterSpacing;
export type TextStyleTokens = typeof typography.styles;