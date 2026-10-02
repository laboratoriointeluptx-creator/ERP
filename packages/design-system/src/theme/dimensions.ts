/**
 * SYNTARA ERP Design System - Dimension Tokens
 *
 * Tamaños estándar para componentes, iconos, y elementos de UI
 * Basados en escala de 4px para consistencia
 */

export const dimensions = {
  // ==========================================
  // ICON SIZES - Tamaños de iconos
  // ==========================================
  icon: {
    /** 12px - Muy pequeño (badges, chips) */
    xs: 12,
    /** 14px - Pequeño (botones pequeños, tabs) */
    sm: 14,
    /** 16px - Base (botones, inputs, navegación) */
    md: 16,
    /** 18px - Mediano (cards, list items) */
    lg: 18,
    /** 20px - Grande (headers, acciones principales) */
    xl: 20,
    /** 24px - Extra grande (hero, empty states) */
    '2xl': 24,
    /** 32px - Display (KPI cards, splash) */
    '3xl': 32,
    /** 48px - Feature (ilustraciones) */
    '4xl': 48,
    /** 64px - Grande (empty states, onboarding) */
    '5xl': 64,
  },

  // ==========================================
  // AVATAR SIZES - Tamaños de avatar
  // ==========================================
  avatar: {
    /** 24px - XS (lista compacta, mentions) */
    xs: 24,
    /** 32px - SM (tablas, dropdowns) */
    sm: 32,
    /** 40px - MD (cards, headers) */
    md: 40,
    /** 48px - LG (perfil, tarjetas de usuario) */
    lg: 48,
    /** 56px - XL (página de perfil) */
    xl: 56,
    /** 72px - 2XL (hero, splash) */
    '2xl': 72,
    /** 96px - 3XL (pantalla de bienvenida) */
    '3xl': 96,
  },

  // ==========================================
  // BUTTON DIMENSIONS - Dimensiones de botones
  // ==========================================
  button: {
    height: {
      /** 32px - Compacto */
      sm: 32,
      /** 40px - Estándar */
      md: 40,
      /** 48px - Grande */
      lg: 48,
      /** 56px - Extra grande (CTA principal) */
      xl: 56,
    },
    minWidth: {
      sm: 64,
      md: 80,
      lg: 96,
      xl: 120,
    },
    paddingHorizontal: {
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },
    iconGap: 8,
    iconOnlySize: {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 56,
    },
  },

  // ==========================================
  // INPUT DIMENSIONS - Dimensiones de inputs
  // ==========================================
  input: {
    height: {
      /** 36px - Compacto */
      sm: 36,
      /** 44px - Estándar */
      md: 44,
      /** 52px - Grande */
      lg: 52,
    },
    paddingHorizontal: 12,
    paddingVertical: {
      sm: 8,
      md: 12,
      lg: 14,
    },
    iconGap: 10,
    borderWidth: 1,
    borderWidthFocus: 2,
  },

  // ==========================================
  // FORM DIMENSIONS - Dimensiones de formularios
  // ==========================================
  form: {
    labelGap: 8,
    fieldGap: 16,
    sectionGap: 24,
    groupGap: 12,
    helperGap: 6,
    errorGap: 6,
  },

  // ==========================================
  // CARD DIMENSIONS - Dimensiones de tarjetas
  // ==========================================
  card: {
    padding: {
      sm: 16,
      md: 20,
      lg: 24,
    },
    gap: 12,
    minHeight: {
      sm: 80,
      md: 100,
      lg: 120,
    },
  },

  // ==========================================
  // MODAL DIMENSIONS - Dimensiones de modales
  // ==========================================
  modal: {
    width: {
      sm: 360,
      md: 480,
      lg: 640,
      xl: 800,
      full: '100%',
    },
    maxHeight: {
      sm: '70vh',
      md: '80vh',
      lg: '90vh',
      full: '100vh',
    },
    padding: 24,
    headerGap: 16,
    footerGap: 16,
    footerButtonGap: 12,
    borderRadius: 16,
  },

  // ==========================================
  // DROPDOWN / SELECT DIMENSIONS
  // ==========================================
  dropdown: {
    minWidth: 200,
    maxWidth: 400,
    maxHeight: 320,
    itemHeight: 40,
    itemPaddingHorizontal: 12,
    itemPaddingVertical: 10,
    sectionGap: 8,
    borderRadius: 10,
  },

  // ==========================================
  // TABLE DIMENSIONS - Dimensiones de tablas
  // ==========================================
  table: {
    headerHeight: 48,
    rowHeight: 52,
    rowHeightCompact: 44,
    cellPaddingHorizontal: 12,
    cellPaddingVertical: 10,
    minColumnWidth: 80,
    maxColumnWidth: 400,
    borderWidth: 1,
    stickyHeaderOffset: 64,
  },

  // ==========================================
  // TABS DIMENSIONS - Dimensiones de pestañas
  // ==========================================
  tabs: {
    itemPaddingHorizontal: 16,
    itemPaddingVertical: 12,
    itemMinWidth: 80,
    indicatorHeight: 3,
    indicatorBorderRadius: 3,
  },

  // ==========================================
  // NAVIGATION DIMENSIONS - Dimensiones de navegación
  // ==========================================
  navigation: {
    sidebar: {
      collapsedWidth: 64,
      expandedWidth: 256,
      itemHeight: 44,
      itemPaddingHorizontal: 14,
      itemPaddingVertical: 11,
      logoHeight: 64,
      logoGap: 12,
      sectionGap: 24,
    },
    rail: {
      width: 80,
      itemSize: 56,
      iconSize: 24,
      labelGap: 8,
    },
    bottomNav: {
      height: 72,
      itemHeight: 72,
      iconSize: 22,
      labelSize: 10,
      paddingBottom: 8,
    },
    header: {
      height: 64,
      mobileHeight: 56,
      paddingHorizontal: 24,
      itemGap: 16,
      avatarSize: 36,
    },
    breadcrumb: {
      height: 40,
      itemGap: 8,
      separatorSize: 16,
    },
  },

  // ==========================================
  // BADGE DIMENSIONS - Dimensiones de badges
  // ==========================================
  badge: {
    paddingHorizontal: {
      sm: 6,
      md: 8,
      lg: 10,
    },
    paddingVertical: {
      sm: 2,
      md: 3,
      lg: 4,
    },
    minWidth: 18,
    minHeight: 18,
    fontSize: {
      sm: 10,
      md: 11,
      lg: 12,
    },
    iconSize: {
      sm: 10,
      md: 12,
      lg: 14,
    },
    gap: 4,
  },

  // ==========================================
  // TOOLTIP / POPOVER DIMENSIONS
  // ==========================================
  tooltip: {
    maxWidth: 280,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    arrowSize: 6,
    gap: 8,
  },
  popover: {
    minWidth: 240,
    maxWidth: 380,
    padding: 8,
    borderRadius: 10,
    arrowSize: 8,
    gap: 8,
  },

  // ==========================================
  // TOAST / NOTIFICATION DIMENSIONS
  // ==========================================
  toast: {
    minWidth: 280,
    maxWidth: 420,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    iconSize: 20,
    gap: 12,
    actionGap: 12,
  },

  // ==========================================
  // PROGRESS DIMENSIONS
  // ==========================================
  progress: {
    height: {
      sm: 4,
      md: 6,
      lg: 8,
      xl: 12,
    },
    borderRadius: 9999,
    trackHeight: {
      sm: 4,
      md: 6,
      lg: 8,
      xl: 12,
    },
  },

  // ==========================================
  // STEPPER DIMENSIONS
  // ==========================================
  stepper: {
    stepSize: 28,
    stepIconSize: 16,
    stepGap: 24,
    connectorWidth: 2,
    connectorGap: 12,
    labelGap: 8,
    descriptionGap: 4,
  },

  // ==========================================
  // KPI CARD DIMENSIONS
  // ==========================================
  kpiCard: {
    padding: 20,
    gap: 12,
    iconSize: 40,
    iconContainerSize: 48,
    minWidth: 180,
    minHeight: 122,
  },

  // ==========================================
  // EMPTY STATE DIMENSIONS
  // ==========================================
  emptyState: {
    padding: 48,
    iconSize: 64,
    iconContainerSize: 80,
    gap: 16,
    buttonGap: 12,
    maxWidth: 360,
  },

  // ==========================================
  // SKELETON DIMENSIONS
  // ==========================================
  skeleton: {
    borderRadius: 4,
    height: {
      text: 14,
      title: 22,
      avatar: 40,
      button: 40,
      card: 100,
      tableRow: 52,
    },
    width: {
      full: '100%',
      half: '50%',
      quarter: '25%',
      text: '60%',
      title: '40%',
      avatar: 40,
      button: 100,
    },
    gap: 12,
  },

  // ==========================================
  // DIVIDER DIMENSIONS
  // ==========================================
  divider: {
    thickness: 1,
    gap: 16,
    marginHorizontal: 0,
    marginVertical: 16,
  },

  // ==========================================
  // LAYOUT DIMENSIONS - Dimensiones de layout general
  // ==========================================
  layout: {
    maxWidth: 1440,
    containerPadding: 24,
    containerPaddingMobile: 16,
    sectionGap: 32,
    componentGap: 16,
    gridGap: 16,
    sidebar: {
      collapsedWidth: 64,
      expandedWidth: 256,
      minHeight: '100vh',
    },
    header: {
      height: 64,
      mobileHeight: 56,
    },
    footer: {
      height: 48,
      paddingHorizontal: 24,
    },
    content: {
      paddingTop: 24,
      paddingBottom: 32,
    },
  },

  // ==========================================
  // BREAKPOINTS - Puntos de quiebre responsive
  // ==========================================
  breakpoint: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1440,
    // Mobile first breakpoints
    mobile: 0,
    tablet: 768,
    desktop: 992,
    wide: 1200,
    ultraWide: 1440,
  },

  // ==========================================
  // Z-INDEX - Capas de apilamiento
  // ==========================================
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modalBackdrop: 400,
    modal: 500,
    popover: 600,
    tooltip: 700,
    toast: 800,
    loading: 900,
  },
} as const;

// Type exports
export type DimensionTokens = typeof dimensions;
export type IconSize = keyof typeof dimensions.icon;
export type AvatarSize = keyof typeof dimensions.avatar;
export type ButtonSize = keyof typeof dimensions.button.height;
export type InputSize = keyof typeof dimensions.input.height;
export type ModalSize = keyof typeof dimensions.modal.width;
export type Breakpoint = keyof typeof dimensions.breakpoint;