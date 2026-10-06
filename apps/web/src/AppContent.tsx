/**
 * SYNTARA ERP - Main Application Content
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ApiClient, type AuthSession, type DashboardSummary, type OrganizationSummary } from '@erp-universal/api-client';
import { useTheme, Box, Text as DSText, Button, Input, Card, CardHeader, CardContent, KPICard, Badge } from '@erp-universal/design-system';
import { DashboardLayout } from './components/DashboardLayout';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getRecoveryTokenFromUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('token') ?? '';
};

const tokenHasAdminRole = (token: string): boolean => {
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return false;
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as { roles?: unknown };
    return Array.isArray(payload.roles) && payload.roles.includes('admin');
  } catch {
    return false;
  }
};

export function AppContent() {
  const [screen, setScreen] = useState<'splash' | 'login' | 'dashboard' | 'inventory' | 'sales' | 'purchases' | 'finance' | 'users' | 'settings' | 'forgot-password'>('splash');
  const [recoveryMode, setRecoveryMode] = useState<'none' | 'forgot-password' | 'reset-password'>(() =>
    getRecoveryTokenFromUrl() ? 'reset-password' : 'none',
  );
  const [organizationId, setOrganizationId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState(getRecoveryTokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);
  const [notice, setNotice] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const api = new ApiClient({ baseUrl: API_BASE_URL, getAccessToken: () => accessToken });
  const { theme } = useTheme();

  useEffect(() => {
    if (resetToken && typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [resetToken]);

  // La pantalla de carga es solo cosmética (no hay sesión ni datos que restaurar):
  // se avanza al login para no quedarse en el splash de forma indefinida.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setScreen((current) => (current === 'splash' ? 'login' : current));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, []);

  const loadDashboard = useCallback(async () => {
    const [currentOrganization, dashboard] = await Promise.all([
      api.getCurrentOrganization(),
      api.getDashboardSummary(),
    ]);
    setOrganization(currentOrganization);
    setSummary(dashboard);
    setError('');
  }, [api]);

  const signIn = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const unauthenticatedApi = new ApiClient({ baseUrl: API_BASE_URL });
      const result = await unauthenticatedApi.login({ organizationId: organizationId.trim(), email: email.trim(), password });
      setSession(result);
      setCanManageUsers(tokenHasAdminRole(result.accessToken));
      setAccessToken(result.accessToken);
      setPassword('');
      await loadDashboard();
    } catch (cause: unknown) {
      setSession(null);
      setAccessToken('');
      setError(cause instanceof Error ? cause.message : 'No se pudo conectar con el ERP');
    } finally {
      setLoading(false);
    }
  }, [api, email, organizationId, loadDashboard]);

  const requestPasswordReset = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const unauthenticatedApi = new ApiClient({ baseUrl: API_BASE_URL });
      await unauthenticatedApi.requestPasswordReset({ organizationId: organizationId.trim(), email: email.trim() });
      setRecoverySubmitted(true);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  }, [email, organizationId]);

  const submitPasswordReset = useCallback(async () => {
    setError('');
    setNotice('');
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const unauthenticatedApi = new ApiClient({ baseUrl: API_BASE_URL });
      await unauthenticatedApi.resetPassword({ token: resetToken, newPassword });
      setNewPassword('');
      setConfirmNewPassword('');
      setResetToken('');
      setRecoveryMode('none');
      setScreen('login');
      setNotice('Contraseña actualizada. Ya puedes iniciar sesión.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'El enlace de recuperación no es válido o expiró.');
    } finally {
      setLoading(false);
    }
  }, [confirmNewPassword, newPassword, resetToken]);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    try {
      await loadDashboard();
    } catch (cause: unknown) {
      if (cause instanceof Error && (cause as any).status === 401) {
        try {
          if (!session) throw cause;
          const refreshed = await api.refresh(session.refreshToken);
          setAccessToken(refreshed.accessToken);
          await loadDashboard();
        } catch {
          setSession(null);
          setAccessToken('');
          setOrganization(null);
          setSummary(null);
          setError('La sesión expiró. Inicia sesión de nuevo.');
        }
      } else {
        setError(cause instanceof Error ? cause.message : 'No se pudieron actualizar los datos.');
      }
    } finally {
      setLoading(false);
    }
  }, [api, session, loadDashboard]);

  const signOut = useCallback(async () => {
    if (session) await api.logout(session.refreshToken).catch(() => undefined);
    setSession(null);
    setCanManageUsers(false);
    setAccessToken('');
    setOrganization(null);
    setSummary(null);
    setScreen('login');
    setPassword('');
    setError('');
  }, [api, session]);

  useEffect(() => {
    if (session) {
      setScreen('dashboard');
    }
  }, [session]);

  // Splash screen
  if (screen === 'splash') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.splashContainer}>
          <View style={styles.splashContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>SYNTARA</Text>
              <Text style={styles.logoSubtext}>ERP</Text>
            </View>
            <View style={styles.cubeContainer}>
              <Text style={styles.cube}>◈</Text>
            </View>
            <View style={styles.spinner} />
            <Text style={styles.loadingText}>Cargando SYNTARA ERP...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (recoveryMode === 'forgot-password') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.loginShell}>
          <View style={[styles.loginCard, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.primary }]}>
            <View style={styles.loginBrand}>
              <Text style={styles.brandLogo}>SYNTARA</Text>
              <Text style={styles.brandSubtext}>ERP</Text>
            </View>
            <DSText variant="titleLarge" style={styles.loginTitle}>Recuperar contraseña</DSText>
            {recoverySubmitted ? (
              <DSText variant="bodyMedium" style={styles.loginCopy}>
                Si existe una cuenta activa con esos datos, enviaremos instrucciones de recuperación.
              </DSText>
            ) : (
              <>
                <DSText variant="bodyMedium" style={styles.loginCopy}>Indica tu organización y correo electrónico.</DSText>
                <Box style={styles.formGroup}>
                  <DSText variant="labelLarge">ID de organización</DSText>
                  <Input accessibilityLabel="ID de organización" autoCapitalize="none" value={organizationId} onChangeText={setOrganizationId} placeholder="Identificador de organización" />
                </Box>
                <Box style={styles.formGroup}>
                  <DSText variant="labelLarge">Correo electrónico</DSText>
                  <Input accessibilityLabel="Correo electrónico" type="email" autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="nombre@empresa.com" />
                </Box>
              </>
            )}
            {error ? <DSText variant="errorText" style={styles.error}>{error}</DSText> : null}
            {!recoverySubmitted ? (
              <Button variant="primary" size="lg" fullWidth loading={loading} onPress={requestPasswordReset} disabled={loading || !organizationId || !email}>
                Enviar instrucciones
              </Button>
            ) : null}
            <Pressable accessibilityRole="button" onPress={() => { setRecoverySubmitted(false); setError(''); setRecoveryMode('none'); }}>
              <DSText variant="bodyMedium" style={styles.loginHint}>Volver a iniciar sesión</DSText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (recoveryMode === 'reset-password') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.loginShell}>
          <View style={[styles.loginCard, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.primary }]}>
            <View style={styles.loginBrand}>
              <Text style={styles.brandLogo}>SYNTARA</Text>
              <Text style={styles.brandSubtext}>ERP</Text>
            </View>
            <DSText variant="titleLarge" style={styles.loginTitle}>Define una nueva contraseña</DSText>
            <DSText variant="bodyMedium" style={styles.loginCopy}>Usa al menos 12 caracteres.</DSText>
            <Box style={styles.formGroup}>
              <DSText variant="labelLarge">Nueva contraseña</DSText>
              <Input accessibilityLabel="Nueva contraseña" type="password" value={newPassword} onChangeText={setNewPassword} placeholder="Nueva contraseña" />
            </Box>
            <Box style={styles.formGroup}>
              <DSText variant="labelLarge">Confirmar contraseña</DSText>
              <Input accessibilityLabel="Confirmar contraseña" type="password" value={confirmNewPassword} onChangeText={setConfirmNewPassword} onSubmitEditing={submitPasswordReset} placeholder="Repite la contraseña" />
            </Box>
            {error ? <DSText variant="errorText" style={styles.error}>{error}</DSText> : null}
            <Button variant="primary" size="lg" fullWidth loading={loading} onPress={submitPasswordReset} disabled={loading || !resetToken || newPassword.length < 12 || !confirmNewPassword}>
              Actualizar contraseña
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Login screen
  if (!session) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.loginShell}>
          <View style={[styles.loginCard, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.primary }]}>
            <View style={styles.loginBrand}>
              <Text style={styles.brandLogo}>SYNTARA</Text>
              <Text style={styles.brandSubtext}>ERP</Text>
            </View>
            <DSText variant="titleLarge" style={styles.loginTitle}>Accede a tu operación</DSText>
            <DSText variant="bodyMedium" style={styles.loginCopy}>Inicia sesión con tu organización para cargar los datos autorizados de tu ERP.</DSText>
            
            <Box style={styles.formGroup}>
              <DSText variant="labelLarge">ID de organización</DSText>
              <Input
                accessibilityLabel="ID de organización"
                autoCapitalize="none"
                value={organizationId}
                onChangeText={setOrganizationId}
                placeholder="Identificador de MongoDB"
                required
              />
            </Box>

            <Box style={styles.formGroup}>
              <DSText variant="labelLarge">Correo electrónico</DSText>
              <Input
                accessibilityLabel="Correo electrónico"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="nombre@empresa.com"
                required
              />
            </Box>

            <Box style={styles.formGroup}>
              <DSText variant="labelLarge">Contraseña</DSText>
              <Input
                accessibilityLabel="Contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={signIn}
                placeholder="Contraseña"
                required
              />
            </Box>

            {error ? <DSText variant="errorText" style={styles.error}>{error}</DSText> : null}
            {notice ? <DSText variant="bodyMedium" style={styles.loginCopy}>{notice}</DSText> : null}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={signIn}
              disabled={loading || !organizationId || !email || !password}
            >
              {loading ? 'Conectando…' : 'Iniciar Sesión'}
            </Button>

            <Pressable accessibilityRole="button" onPress={() => { setError(''); setRecoverySubmitted(false); setRecoveryMode('forgot-password'); }}>
              <DSText variant="bodyMedium" style={styles.loginHint}>¿Olvidaste tu contraseña?</DSText>
            </Pressable>

            <DSText variant="caption" style={styles.loginHint}>La sesión se conserva solo mientras esta página permanezca abierta.</DSText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !summary) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.centerState}>
          <View style={styles.spinner} />
          <DSText variant="titleMedium" style={styles.loadingText}>Cargando información del ERP…</DSText>
        </View>
      </SafeAreaView>
    );
  }

  if (!summary || !organization) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.centerState}>
          <DSText variant="headlineMedium">No pudimos cargar el dashboard</DSText>
          <DSText variant="bodyMedium" style={styles.stateCopy}>{error || 'Comprueba tus permisos y la conexión con la API.'}</DSText>
          <Box style={styles.buttonRow} direction="row" gap={10}>
            <Button variant="secondary" onPress={refreshDashboard} disabled={loading}>
              Reintentar
            </Button>
            <Button variant="secondary" onPress={signOut}>
              Cerrar sesión
            </Button>
          </Box>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <DashboardLayout
      screen="dashboard"
      setScreen={setScreen}
      organization={organization}
      summary={summary}
      api={api}
      loading={loading}
      onRefresh={refreshDashboard}
      error={error}
      canManageUsers={canManageUsers}
      signOut={signOut}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020B17' },
  splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  splashContent: { alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 42, fontWeight: '800', color: '#F5FAFF', letterSpacing: 4 },
  logoSubtext: { fontSize: 18, fontWeight: '600', color: '#00C8F5', letterSpacing: 2, marginTop: 4 },
  cubeContainer: { marginBottom: 32 },
  cube: { fontSize: 80, color: '#00C8F5' },
  spinner: { marginBottom: 16 },
  loadingText: { color: '#9DB3C7', fontSize: 16 },
  loginShell: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { width: '100%', maxWidth: 440, padding: 32, borderRadius: 16, backgroundColor: '#0B2033', borderWidth: 1, borderColor: '#123A55' },
  loginBrand: { alignItems: 'center', marginBottom: 24 },
  brandLogo: { fontSize: 32, fontWeight: '800', color: '#F5FAFF', letterSpacing: 3 },
  brandSubtext: { fontSize: 14, fontWeight: '600', color: '#00C8F5', marginTop: 4 },
  loginTitle: { fontSize: 24, fontWeight: '800', color: '#F5FAFF', textAlign: 'center', marginBottom: 8 },
  loginCopy: { color: '#9DB3C7', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  formGroup: { marginBottom: 16 },
  error: { marginBottom: 16, textAlign: 'center' },
  loginHint: { color: '#668096', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateCopy: { color: '#9DB3C7', textAlign: 'center', marginTop: 8 },
});

export default AppContent;