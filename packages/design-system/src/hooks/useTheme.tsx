/**
 * SYNTARA ERP Design System - Theme Hooks
 */

import { useContext, createContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { theme, type Theme } from '../theme';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: 'dark';
  setColorScheme: (scheme: 'dark') => void;
  getColor: (path: string) => string;
  getSpacing: (multiplier: number) => number;
  getRadius: (key: string) => number;
  getShadow: (key: string) => object;
  getDimension: (path: string) => number | string;
  getTypography: (path: string) => object;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const defaultThemeContext: ThemeContextValue = {
  theme,
  colorScheme: 'dark',
  setColorScheme: () => {},
  getColor: (path) => getNestedValue(theme.colors, path) as string || '',
  getSpacing: (multiplier) => theme.spacing.unit * multiplier,
  getRadius: (key) => (theme.radius.semantic as any)[key] || 0,
  getShadow: (key) => (theme.shadows.component as any)[key] || theme.shadows.none,
  getDimension: (path) => getNestedValue(theme.dimensions, path) as number | string || 0,
  getTypography: (path) => getNestedValue(theme.typography.styles, path) as object || {},
};

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

interface ThemeProviderProps {
  children: ReactNode;
  customTheme?: Partial<Theme>;
}

export function ThemeProvider({ children, customTheme }: ThemeProviderProps) {
  const [colorScheme] = useState<'dark'>('dark');
  const mergedTheme = useMemo(() => customTheme ? deepMerge(theme, customTheme) : theme, [customTheme]);

  const value = useMemo((): ThemeContextValue => ({
    theme: mergedTheme,
    colorScheme,
    setColorScheme: () => {},
    getColor: (path: string) => getNestedValue(mergedTheme.colors, path) as string || '',
    getSpacing: (multiplier: number) => mergedTheme.spacing.unit * multiplier,
    getRadius: (key: string) => (mergedTheme.radius.semantic as any)[key] || 0,
    getShadow: (key: string) => (mergedTheme.shadows.component as any)[key] || mergedTheme.shadows.none,
    getDimension: (path: string) => getNestedValue(mergedTheme.dimensions, path) as number | string || 0,
    getTypography: (path: string) => getNestedValue(mergedTheme.typography.styles, path) as object || {},
  }), [mergedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
      (result as any)[key] = deepMerge(targetValue as any, sourceValue as any);
    } else if (sourceValue !== undefined) {
      (result as any)[key] = sourceValue;
    }
  }
  return result;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    if (process.env.NODE_ENV !== 'production') console.warn('useTheme usado fuera de ThemeProvider');
    return defaultThemeContext;
  }
  return context;
}

export function useColors() { const { theme } = useTheme(); return theme.colors; }
export function useSpacing() { const { theme } = useTheme(); return theme.spacing; }
export function useTypography() { const { theme } = useTheme(); return theme.typography; }
export function useRadius() { const { theme } = useTheme(); return theme.radius; }
export function useShadows() { const { theme } = useTheme(); return theme.shadows; }
export function useDimensions() { const { theme } = useTheme(); return theme.dimensions; }

export function useColor(path: string): string { const { getColor } = useTheme(); return useMemo(() => getColor(path), [getColor, path]); }
export function useSpacingValue(multiplier: number): number { const { getSpacing } = useTheme(); return useMemo(() => getSpacing(multiplier), [getSpacing, multiplier]); }
export function useRadiusValue(key: string): number { const { getRadius } = useTheme(); return useMemo(() => getRadius(key), [getRadius, key]); }
export function useShadow(key: string): object { const { getShadow } = useTheme(); return useMemo(() => getShadow(key), [getShadow, key]); }

export function useBreakpoint() {
  const [windowSize, setWindowSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1024, height: typeof window !== 'undefined' ? window.innerHeight : 768 });
  const breakpoints = theme.dimensions.breakpoint;
  const breakpoint = useMemo(() => { const { width } = windowSize; if (width >= breakpoints.xxl) return 'xxl'; if (width >= breakpoints.xl) return 'xl'; if (width >= breakpoints.lg) return 'lg'; if (width >= breakpoints.md) return 'md'; if (width >= breakpoints.sm) return 'sm'; return 'xs'; }, [windowSize.width, breakpoints]);
  const isMobile = windowSize.width < breakpoints.tablet;
  const isTablet = windowSize.width >= breakpoints.tablet && windowSize.width < breakpoints.desktop;
  const isDesktop = windowSize.width >= breakpoints.desktop && windowSize.width < breakpoints.wide;
  const isWide = windowSize.width >= breakpoints.wide;
  useEffect(() => { if (typeof window === 'undefined') return; const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight }); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
  return { width: windowSize.width, height: windowSize.height, isMobile, isTablet, isDesktop, isWide, breakpoint };
}

export function useMediaQuery(query: string): boolean { const [matches, setMatches] = useState(false); useEffect(() => { if (typeof window === 'undefined') return; const mq = window.matchMedia(query); setMatches(mq.matches); const handler = (e: MediaQueryListEvent) => setMatches(e.matches); mq.addEventListener('change', handler); return () => mq.removeEventListener('change', handler); }, [query]); return matches; }

export function useTextStyle<K extends keyof typeof theme.typography.styles>(styleKey: K): typeof theme.typography.styles[K] { const { getTypography } = useTheme(); return useMemo(() => getTypography(styleKey) as typeof theme.typography.styles[K], [getTypography, styleKey]); }