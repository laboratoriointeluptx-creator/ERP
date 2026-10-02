/**
 * SYNTARA ERP Design System - Color Tokens
 *
 * Paleta oficial basada en la identidad visual de SYNTARA:
 * - Fondo oscuro tecnológico
 * - Azul corporativo
 * - Cyan como acento principal
 * - Tipografía clara sobre fondos oscuros
 */

export const colors = {
  // ==========================================
  // BACKGROUNDS - Fondos base de la aplicación
  // ==========================================
  background: {
    /** Fondo principal - Negro azulado profundo #020B17 */
    primary: '#020B17',
    /** Fondo secundario - Ligeramente más claro #061525 */
    secondary: '#061525',
    /** Fondo terciario - Para áreas elevadas #0A1B2B */
    tertiary: '#0A1B2B',
    /** Overlay para modales/drawers */
    overlay: 'rgba(2, 11, 23, 0.85)',
  },

  // ==========================================
  // SURFACES - Superficies de componentes
  // ==========================================
  surface: {
    /** Superficie base - Tarjetas, paneles #0B2033 */
    primary: '#0B2033',
    /** Superficie elevada - Modales, dropdowns #0F2A3F */
    elevated: '#0F2A3F',
    /** Superficie hover/pressed */
    hover: '#112D44',
    /** Superficie pressed/active */
    pressed: '#14354D',
    /** Superficie deshabilitada */
    disabled: '#0A1B2B',
  },

  // ==========================================
  // BORDERS - Bordes y divisores
  // ==========================================
  border: {
    /** Borde principal #123A55 */
    primary: '#123A55',
    /** Borde secundario - Más sutil #1A4A6A */
    secondary: '#1A4A6A',
    /** Borde de foco - Cyan */
    focus: '#00C8F5',
    /** Borde de error */
    error: '#EF4444',
    /** Borde de éxito */
    success: '#10B981',
    /** Borde de advertencia */
    warning: '#F59E0B',
  },

  // ==========================================
  // BRAND COLORS - Colores de marca SYNTARA
  // ==========================================
  brand: {
    /** Azul oscuro corporativo #0067B1 */
    blueDark: '#0067B1',
    /** Azul principal #0077B6 */
    blue: '#0077B6',
    /** Azul claro */
    blueLight: '#0096D6',
    /** Cyan principal - COLOR DE ACENTO #00C8F5 */
    cyan: '#00C8F5',
    /** Cyan claro #19D9FF */
    cyanLight: '#19D9FF',
    /** Cyan muy suave para backgrounds sutiles */
    cyanSubtle: 'rgba(0, 200, 245, 0.08)',
    /** Cyan para hover */
    cyanHover: '#00E0FF',
  },

  // ==========================================
  // TEXT - Tipografía
  // ==========================================
  text: {
    /** Texto principal - Blanco azulado #F5FAFF */
    primary: '#F5FAFF',
    /** Texto secundario - Gris azulado #9DB3C7 */
    secondary: '#9DB3C7',
    /** Texto muted/placeholder #668096 */
    muted: '#668096',
    /** Texto sobre color de marca (cyan/azul) */
    onBrand: '#020B17',
    /** Texto invertido (sobre fondos claros) */
    inverse: '#020B17',
    /** Texto de enlace */
    link: '#00C8F5',
    /** Texto de enlace hover */
    linkHover: '#19D9FF',
  },

  // ==========================================
  // SEMANTIC - Colores semánticos/estados
  // ==========================================
  semantic: {
    /** Éxito #10B981 */
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      subtle: 'rgba(16, 185, 129, 0.1)',
      onSuccess: '#020B17',
    },
    /** Advertencia #F59E0B */
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      subtle: 'rgba(245, 158, 11, 0.1)',
      onWarning: '#020B17',
    },
    /** Error #EF4444 */
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      subtle: 'rgba(239, 68, 68, 0.1)',
      onError: '#F5FAFF',
    },
    /** Información #38BDF8 */
    info: {
      main: '#38BDF8',
      light: '#7DD3FC',
      dark: '#0EA5E9',
      subtle: 'rgba(56, 189, 248, 0.1)',
      onInfo: '#020B17',
    },
  },

  // ==========================================
  // STATUS BADGES - Para badges de estado
  // ==========================================
  status: {
    /** Activo/Disponible */
    active: {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#34D399',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    /** Inactivo */
    inactive: {
      bg: 'rgba(148, 163, 184, 0.15)',
      text: '#94A3B8',
      border: 'rgba(148, 163, 184, 0.3)',
    },
    /** Pendiente/En proceso */
    pending: {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: '#FBBF24',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    /** Borrador */
    draft: {
      bg: 'rgba(100, 116, 139, 0.15)',
      text: '#94A3B8',
      border: 'rgba(100, 116, 139, 0.3)',
    },
    /** Completado */
    completed: {
      bg: 'rgba(0, 200, 245, 0.15)',
      text: '#19D9FF',
      border: 'rgba(0, 200, 245, 0.3)',
    },
    /** Cancelado/Rechazado */
    cancelled: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#F87171',
      border: 'rgba(239, 68, 68, 0.3)',
    },
    /** Stock bajo */
    lowStock: {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: '#FBBF24',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    /** Agotado */
    outOfStock: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#F87171',
      border: 'rgba(239, 68, 68, 0.3)',
    },
  },

  // ==========================================
  // INVENTORY SPECIFIC - Estados de inventario
  // ==========================================
  inventory: {
    available: {
      bg: 'rgba(16, 185, 129, 0.12)',
      text: '#34D399',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    reserved: {
      bg: 'rgba(56, 189, 248, 0.12)',
      text: '#7DD3FC',
      border: 'rgba(56, 189, 248, 0.25)',
    },
    low: {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: '#FBBF24',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    out: {
      bg: 'rgba(239, 68, 68, 0.12)',
      text: '#F87171',
      border: 'rgba(239, 68, 68, 0.25)',
    },
  },

  // ==========================================
  // SALES FLOW - Flujo de ventas (stepper)
  // ==========================================
  salesFlow: {
    quotation: { bg: 'rgba(56, 189, 248, 0.12)', text: '#7DD3FC', border: 'rgba(56, 189, 248, 0.25)' },
    order: { bg: 'rgba(0, 200, 245, 0.12)', text: '#19D9FF', border: 'rgba(0, 200, 245, 0.25)' },
    reservation: { bg: 'rgba(139, 92, 246, 0.12)', text: '#C084FC', border: 'rgba(139, 92, 246, 0.25)' },
    preparation: { bg: 'rgba(245, 158, 11, 0.12)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.25)' },
    shipment: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34D399', border: 'rgba(16, 185, 129, 0.25)' },
    delivery: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
    invoice: { bg: 'rgba(0, 119, 182, 0.15)', text: '#00C8F5', border: 'rgba(0, 119, 182, 0.3)' },
    payment: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
  },

  // ==========================================
  // PURCHASE FLOW - Flujo de compras (stepper)
  // ==========================================
  purchaseFlow: {
    request: { bg: 'rgba(56, 189, 248, 0.12)', text: '#7DD3FC', border: 'rgba(56, 189, 248, 0.25)' },
    approval: { bg: 'rgba(139, 92, 246, 0.12)', text: '#C084FC', border: 'rgba(139, 92, 246, 0.25)' },
    order: { bg: 'rgba(0, 200, 245, 0.12)', text: '#19D9FF', border: 'rgba(0, 200, 245, 0.25)' },
    receipt: { bg: 'rgba(245, 158, 11, 0.12)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.25)' },
    supplierInvoice: { bg: 'rgba(0, 119, 182, 0.12)', text: '#00C8F5', border: 'rgba(0, 119, 182, 0.25)' },
    payable: { bg: 'rgba(245, 158, 11, 0.12)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.25)' },
    payment: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
    accounting: { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.3)' },
  },

  // ==========================================
  // SHADOWS - Colores para sombras
  // ==========================================
  shadow: {
    /** Sombra base - Negro con opacidad */
    base: 'rgba(0, 0, 0, 0.4)',
    /** Sombra cyan para elementos de marca */
    cyan: 'rgba(0, 200, 245, 0.15)',
    /** Sombra azul para elementos principales */
    blue: 'rgba(0, 119, 182, 0.2)',
  },

  // ==========================================
  // GRADIENTS - Gradientes de marca
  // ==========================================
  gradient: {
    /** Gradiente principal SYNTARA */
    primary: 'linear-gradient(135deg, #0067B1 0%, #0077B6 50%, #00C8F5 100%)',
    /** Gradiente cyan */
    cyan: 'linear-gradient(135deg, #00C8F5 0%, #19D9FF 100%)',
    /** Gradiente superficie */
    surface: 'linear-gradient(180deg, #0B2033 0%, #0A1B2B 100%)',
    /** Gradiente hero/dashboard */
    hero: 'linear-gradient(135deg, rgba(0, 103, 177, 0.15) 0%, rgba(0, 200, 245, 0.08) 100%)',
    /** Gradiente para botones primarios */
    buttonPrimary: 'linear-gradient(135deg, #0077B6 0%, #0067B1 100%)',
    /** Gradiente para botones cyan (acento) */
    buttonAccent: 'linear-gradient(135deg, #00C8F5 0%, #00A8CC 100%)',
  },
} as const;

// Type exports
export type ColorTokens = typeof colors;
export type BackgroundColors = typeof colors.background;
export type SurfaceColors = typeof colors.surface;
export type BorderColors = typeof colors.border;
export type BrandColors = typeof colors.brand;
export type TextColors = typeof colors.text;
export type SemanticColors = typeof colors.semantic;
export type StatusColors = typeof colors.status;
export type InventoryColors = typeof colors.inventory;
export type SalesFlowColors = typeof colors.salesFlow;
export type PurchaseFlowColors = typeof colors.purchaseFlow;
export type ShadowColors = typeof colors.shadow;
export type GradientColors = typeof colors.gradient;