/**
 * SYNTARA ERP Design System - Spacing Tokens
 *
 * Sistema de espaciado basado en escala de 4px (base unit)
 * Consistencia visual y ritmo vertical/horizontal
 */

export const spacing = {
  // ==========================================
  // BASE UNIT
  // ==========================================
  /** Unidad base: 4px */
  unit: 4,

  // ==========================================
  // SPACING SCALE - Valores nombrados
  // ==========================================
  /** 0px */
  none: 0,
  /** 2px / 0.125rem */
  '0.5': 2,
  /** 4px / 0.25rem - Espaciado mínimo */
  1: 4,
  /** 8px / 0.5rem - Espaciado extra pequeño */
  2: 8,
  /** 12px / 0.75rem - Espaciado pequeño */
  3: 12,
  /** 16px / 1rem - Espaciado base */
  4: 16,
  /** 20px / 1.25rem */
  5: 20,
  /** 24px / 1.5rem - Espaciado medio */
  6: 24,
  /** 28px / 1.75rem */
  7: 28,
  /** 32px / 2rem - Espaciado grande */
  8: 32,
  /** 36px / 2.25rem */
  9: 36,
  /** 40px / 2.5rem */
  10: 40,
  /** 44px / 2.75rem */
  11: 44,
  /** 48px / 3rem - Espaciado extra grande */
  12: 48,
  /** 56px / 3.5rem */
  14: 56,
  /** 64px / 4rem */
  16: 64,
  /** 72px / 4.5rem */
  18: 72,
  /** 80px / 5rem */
  20: 80,
  /** 96px / 6rem */
  24: 96,
  /** 112px / 7rem */
  28: 112,
  /** 128px / 8rem */
  32: 128,

  // ==========================================
  // SEMANTIC SPACING - Espaciado semántico
  // ==========================================
  semantic: {
    /** Espaciado entre elementos inline (icon + text) */
    inline: 8,
    /** Espaciado entre label e input */
    labelGap: 8,
    /** Espaciado entre inputs en formulario */
    fieldGap: 16,
    /** Espaciado entre secciones de formulario */
    sectionGap: 24,
    /** Espaciado entre cards en grid */
    cardGap: 16,
    /** Espaciado interno de card (padding) */
    cardPadding: 20,
    /** Espaciado interno de card compacto */
    cardPaddingCompact: 16,
    /** Espaciado interno de modal/dialog */
    modalPadding: 24,
    /** Espaciado entre botones en fila */
    buttonGap: 12,
    /** Espaciado entre elementos de navegación */
    navGap: 8,
    /** Espaciado sidebar/header */
    layoutGap: 0,
    /** Padding de página/contenido principal */
    pagePadding: 24,
    /** Padding de página en desktop */
    pagePaddingDesktop: 32,
    /** Padding de contenedor max-width */
    containerPadding: 24,
    /** Espaciado entre filas de tabla */
    tableRowGap: 0,
    /** Padding celda tabla */
    tableCellPadding: 12,
    /** Espaciado lista simple */
    listGap: 8,
    /** Espaciado grupo de filtros/tabs */
    filterGap: 8,
    /** Espaciado toast/notification */
    toastGap: 12,
    /** Espaciado skeleton loading */
    skeletonGap: 12,
  },

  // ==========================================
  // COMPONENT SPECIFIC - Espaciado por componente
  // ==========================================
  component: {
    button: {
      paddingHorizontal: { sm: 12, md: 16, lg: 20, xl: 24 },
      paddingVertical: { sm: 8, md: 12, lg: 16, xl: 20 },
      iconGap: 8,
    },
    input: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      iconGap: 10,
    },
    card: {
      padding: { sm: 16, md: 20, lg: 24 },
      gap: 12,
    },
    modal: {
      padding: 24,
      headerGap: 16,
      footerGap: 16,
      footerButtonGap: 12,
    },
    dropdown: {
      itemPaddingHorizontal: 12,
      itemPaddingVertical: 10,
      sectionGap: 8,
    },
    table: {
      headerPaddingHorizontal: 12,
      headerPaddingVertical: 12,
      cellPaddingHorizontal: 12,
      cellPaddingVertical: 10,
    },
    tabs: {
      itemPaddingHorizontal: 16,
      itemPaddingVertical: 12,
      indicatorHeight: 3,
    },
    navigation: {
      itemPaddingHorizontal: 14,
      itemPaddingVertical: 11,
      logoGap: 12,
      sectionGap: 24,
    },
    avatar: {
      size: { xs: 24, sm: 32, md: 40, lg: 48, xl: 56, xxl: 72 },
      textSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24 },
    },
    badge: {
      paddingHorizontal: { sm: 6, md: 8, lg: 10 },
      paddingVertical: { sm: 2, md: 3, lg: 4 },
      gap: 4,
    },
    tooltip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      arrowSize: 6,
    },
    popover: {
      padding: 8,
      arrowSize: 8,
    },
    progress: {
      height: { sm: 4, md: 6, lg: 8 },
      borderRadius: 9999,
    },
    stepper: {
      stepGap: 24,
      lineWidth: 2,
      iconSize: 24,
      iconGap: 12,
    },
    divider: {
      thickness: 1,
      gap: 16,
    },
    kpiCard: {
      padding: 20,
      gap: 12,
      iconSize: 40,
    },
    emptyState: {
      padding: 48,
      iconSize: 64,
      gap: 16,
    },
  },

  // ==========================================
  // LAYOUT - Dimensiones de layout
  // ==========================================
  layout: {
    /** Ancho máximo del contenedor principal */
    maxWidth: 1440,
    /** Ancho sidebar colapsado */
    sidebarCollapsed: 64,
    /** Ancho sidebar expandido */
    sidebarExpanded: 256,
    /** Ancho navigation rail (tablet) */
    navRail: 80,
    /** Alto header/topbar */
    headerHeight: 64,
    /** Alto header móvil */
    mobileHeaderHeight: 56,
    /** Alto bottom navigation (móvil) */
    bottomNavHeight: 72,
    /** Alto footer */
    footerHeight: 48,
    /** Breakpoints responsive */
    breakpoint: {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1440,
    },
    /** Z-index scale */
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
    },
  },
} as const;

// Helper function to get spacing value
export const getSpacing = (multiplier: number): number => spacing.unit * multiplier;

// Type exports
export type SpacingTokens = typeof spacing;
export type SpacingScale = keyof typeof spacing;
export type SemanticSpacing = typeof spacing.semantic;
export type ComponentSpacing = typeof spacing.component;
export type LayoutTokens = typeof spacing.layout;