/**
 * SYNTARA ERP Design System - Border Radius Tokens
 *
 * Esquinas redondeadas consistentes para una apariencia profesional
 * Valores basados en 4px scale con variantes semánticas
 */

export const radius = {
  // ==========================================
  // BASE SCALE
  // ==========================================
  /** Sin redondeo - 0px */
  none: 0,
  /** Mínimo - 2px */
  xs: 2,
  /** Pequeño - 4px */
  sm: 4,
  /** Base - 6px */
  base: 6,
  /** Mediano - 8px */
  md: 8,
  /** Grande - 10px */
  lg: 10,
  /** Extra grande - 12px */
  xl: 12,
  /** 2xl - 16px */
  '2xl': 16,
  /** 3xl - 20px */
  '3xl': 20,
  /** 4xl - 24px */
  '4xl': 24,
  /** Circular - 9999px (full) */
  full: 9999,

  // ==========================================
  // SEMANTIC RADIUS - Por uso/componente
  // ==========================================
  semantic: {
    /** Botones, inputs, controles interactivos */
    control: 8,
    /** Tarjetas, paneles, superficies elevadas */
    card: 12,
    /** Modales, dialogs, drawers */
    modal: 16,
    /** Dropdowns, popovers, tooltips */
    popover: 10,
    /** Badges, tags, pills */
    badge: 9999,
    /** Avatar, imágenes de perfil */
    avatar: 9999,
    /** Tablas - header y celdas */
    table: 0,
    /** Tabs */
    tab: 8,
    /** Navegación lateral items */
    navItem: 8,
    /** Botones de acción flotante */
    fab: 16,
    /** Chips, filtros */
    chip: 9999,
    /** Progress bars */
    progress: 9999,
    /** Skeleton loaders */
    skeleton: 4,
    /** Imágenes en cards */
    image: 8,
    /** Contenedores de formularios */
    formField: 8,
    /** Divisores */
    divider: 0,
    /** Notificaciones/Toasts */
    toast: 10,
  },

  // ==========================================
  // COMPONENT SPECIFIC - Por componente específico
  // ==========================================
  component: {
    button: {
      sm: 6,
      md: 8,
      lg: 10,
      xl: 12,
      iconOnly: 9999,
    },
    input: {
      sm: 6,
      md: 8,
      lg: 10,
    },
    card: {
      sm: 8,
      md: 12,
      lg: 16,
    },
    modal: {
      sm: 12,
      md: 16,
      lg: 20,
    },
    dropdown: {
      menu: 10,
      item: 6,
    },
    tabs: {
      container: 0,
      item: 8,
      indicator: 3,
    },
    table: {
      container: 10,
      header: 0,
      row: 0,
    },
    badge: {
      sm: 6,
      md: 9999,
      lg: 9999,
    },
    avatar: {
      sm: 9999,
      md: 9999,
      lg: 9999,
      xl: 9999,
    },
    tooltip: {
      container: 6,
    },
    popover: {
      container: 10,
    },
    toast: {
      container: 10,
    },
    progress: {
      bar: 9999,
      track: 9999,
    },
    stepper: {
      step: 9999,
      connector: 0,
    },
    kpiCard: {
      container: 12,
      icon: 10,
    },
    emptyState: {
      container: 16,
      icon: 9999,
    },
    divider: {
      horizontal: 0,
      vertical: 0,
    },
  },

  // ==========================================
  // RESPONSIVE RADIUS - Para diferentes breakpoints
  // ==========================================
  responsive: {
    /** Mobile - radios más pequeños */
    mobile: {
      card: 10,
      modal: 16,
      button: 8,
      input: 8,
    },
    /** Tablet */
    tablet: {
      card: 12,
      modal: 16,
      button: 8,
      input: 8,
    },
    /** Desktop - radios estándar */
    desktop: {
      card: 12,
      modal: 16,
      button: 8,
      input: 8,
    },
  },
} as const;

// Type exports
export type RadiusTokens = typeof radius;
export type RadiusScale = keyof typeof radius;
export type SemanticRadius = typeof radius.semantic;
export type ComponentRadius = typeof radius.component;
export type ResponsiveRadius = typeof radius.responsive;