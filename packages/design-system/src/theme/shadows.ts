/**
 * SYNTARA ERP Design System - Shadow Tokens
 *
 * Sistema de sombras para profundidad y jerarquía visual
 * Optimizado para tema oscuro con tonos azulados/cyan
 * Basado en elevation levels (Material Design inspired)
 */

export const shadows = {
  // ==========================================
  // ELEVATION LEVELS - Niveles de elevación
  // ==========================================
  /** Sin sombra - Nivel 0 */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  /** Muy sutil - Nivel 1 (hover de cards) */
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 1,
  },

  /** Sutil - Nivel 2 (cards en reposo) */
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  /** Base - Nivel 3 (cards elevadas, dropdowns) */
  base: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },

  /** Media - Nivel 4 (modales pequeños, popovers) */
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  /** Grande - Nivel 5 (modales grandes, drawers) */
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },

  /** Extra grande - Nivel 6 (full screen modales) */
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },

  /** Máxima - Nivel 7 (toasts, notificaciones críticas) */
  '2xl': {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.32,
    shadowRadius: 40,
    elevation: 20,
  },

  // ==========================================
  // BRAND SHADOWS - Sombras con colores de marca
  // ==========================================
  /** Sombra cyan para botones de acento */
  cyan: {
    sm: {
      shadowColor: '#00C8F5',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: '#00C8F5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    lg: {
      shadowColor: '#00C8F5',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
  },

  /** Sombra azul para botones primarios */
  blue: {
    sm: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    lg: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
  },

  /** Sombra de éxito */
  success: {
    sm: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  /** Sombra de error */
  error: {
    sm: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  /** Sombra de advertencia */
  warning: {
    sm: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  /** Sombra interior (inset) para inputs enfocados */
  inset: {
    sm: {
      shadowColor: '#00C8F5',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 0,
    },
    md: {
      shadowColor: '#00C8F5',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 0,
    },
  },

  // ==========================================
  // COMPONENT SHADOWS - Por componente
  // ==========================================
  component: {
    /** Card en reposo */
    card: {
      rest: 'sm',
      hover: 'base',
      pressed: 'xs',
      selected: 'base',
    },
    /** Button */
    button: {
      primary: {
        rest: 'sm',
        hover: 'md',
        pressed: 'xs',
      },
      secondary: {
        rest: 'none',
        hover: 'xs',
        pressed: 'none',
      },
      accent: {
        rest: 'cyan.sm',
        hover: 'cyan.md',
        pressed: 'cyan.sm',
      },
      ghost: {
        rest: 'none',
        hover: 'none',
        pressed: 'none',
      },
    },
    /** Input */
    input: {
      rest: 'none',
      focus: 'inset.md',
      error: 'error.sm',
      disabled: 'none',
    },
    /** Modal */
    modal: {
      backdrop: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 10,
      },
      content: 'lg',
      mobile: 'xl',
    },
    /** Dropdown / Select */
    dropdown: {
      menu: 'md',
      itemHover: 'none',
    },
    /** Popover / Tooltip */
    popover: 'md',
    tooltip: 'sm',
    /** Toast / Notification */
    toast: 'lg',
    /** Navigation */
    navigation: {
      sidebar: 'lg',
      rail: 'md',
      bottomNav: 'xl',
      header: 'sm',
    },
    /** Table */
    table: {
      header: 'xs',
      rowHover: 'none',
      stickyColumn: 'sm',
    },
    /** Tabs */
    tabs: {
      container: 'none',
      indicator: 'none',
    },
    /** Avatar */
    avatar: 'none',
    /** Badge */
    badge: 'none',
    /** KPI Card */
    kpiCard: {
      rest: 'sm',
      hover: 'base',
    },
    /** Empty State */
    emptyState: 'none',
    /** Skeleton */
    skeleton: 'none',
    /** Divider */
    divider: 'none',
    /** Stepper */
    stepper: {
      step: 'none',
      connector: 'none',
    },
  },

  // ==========================================
  // CSS SHADOWS - Para uso en web (CSS box-shadow)
  // ==========================================
  css: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.18)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
    base: '0 4px 8px rgba(0, 0, 0, 0.22)',
    md: '0 8px 16px rgba(0, 0, 0, 0.25)',
    lg: '0 12px 24px rgba(0, 0, 0, 0.28)',
    xl: '0 20px 32px rgba(0, 0, 0, 0.3)',
    '2xl': '0 28px 40px rgba(0, 0, 0, 0.32)',
    cyan: {
      sm: '0 2px 6px rgba(0, 200, 245, 0.2)',
      md: '0 4px 12px rgba(0, 200, 245, 0.25)',
      lg: '0 8px 20px rgba(0, 200, 245, 0.3)',
    },
    blue: {
      sm: '0 2px 6px rgba(0, 119, 182, 0.2)',
      md: '0 4px 12px rgba(0, 119, 182, 0.25)',
      lg: '0 8px 20px rgba(0, 119, 182, 0.3)',
    },
    inset: {
      sm: 'inset 0 0 0 1px rgba(0, 200, 245, 0.3), inset 0 2px 4px rgba(0, 200, 245, 0.15)',
      md: 'inset 0 0 0 2px rgba(0, 200, 245, 0.4), inset 0 2px 8px rgba(0, 200, 245, 0.2)',
    },
    modal: {
      backdrop: '0 0 40px rgba(0, 0, 0, 0.5)',
      content: '0 12px 24px rgba(0, 0, 0, 0.28)',
    },
  },
} as const;

// Type exports
export type ShadowTokens = typeof shadows;
export type ElevationLevel = 'none' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';
export type BrandShadow = 'cyan' | 'blue' | 'success' | 'error' | 'warning';
export type ComponentShadows = typeof shadows.component;
export type CssShadows = typeof shadows.css;