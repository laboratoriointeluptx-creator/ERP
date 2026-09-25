import { useMemo, useRef, useState } from 'react';
import { ApiClient, ApiClientError } from '@erp-universal/api-client';
import type { AuthSession, DashboardSummary, OrganizationSummary } from '@erp-universal/types';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function App() {
  const [organizationId, setOrganizationId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const accessToken = useRef<string>();
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const api = useMemo(() => new ApiClient({ baseUrl: API_BASE_URL, getAccessToken: () => accessToken.current }), []);

  const loadDashboard = async (client: ApiClient = api) => {
    const [currentOrganization, dashboard] = await Promise.all([client.getCurrentOrganization(), client.getDashboardSummary()]);
    setOrganization(currentOrganization);
    setSummary(dashboard);
    setError('');
  };

  const signIn = async () => {
    setLoading(true);
    setError('');
    try {
      const unauthenticatedApi = new ApiClient({ baseUrl: API_BASE_URL });
      const result = await unauthenticatedApi.login({ organizationId: organizationId.trim(), email: email.trim(), password });
      setSession(result);
      accessToken.current = result.accessToken;
      setPassword('');
      await loadDashboard(api);
    } catch (cause: unknown) {
      setSession(null);
      accessToken.current = undefined;
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo conectar con el ERP. Verifica la URL de la API y vuelve a intentar.');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      await loadDashboard();
    } catch (cause: unknown) {
      if (cause instanceof ApiClientError && cause.status === 401) {
        try {
          if (!session) throw cause;
          const refreshed = await api.refresh(session.refreshToken);
          accessToken.current = refreshed.accessToken;
          await loadDashboard();
        } catch {
          setSession(null);
          accessToken.current = undefined;
          setOrganization(null);
          setSummary(null);
          setError('La sesión expiró. Inicia sesión de nuevo.');
        }
      } else {
        setError(cause instanceof ApiClientError ? cause.message : 'No se pudieron actualizar los datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (session) await api.logout(session.refreshToken).catch(() => undefined);
    setSession(null);
    accessToken.current = undefined;
    setOrganization(null);
    setSummary(null);
    setPassword('');
    setError('');
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loginShell}>
          <View style={styles.loginCard}>
            <Text style={styles.brand}>NEXO ERP</Text>
            <Text style={styles.loginTitle}>Accede a tu operación</Text>
            <Text style={styles.loginCopy}>Inicia sesión con tu organización para cargar los datos autorizados de tu ERP.</Text>
            <Text style={styles.inputLabel}>ID de organización</Text>
            <TextInput accessibilityLabel="ID de organización" autoCapitalize="none" style={styles.input} value={organizationId} onChangeText={setOrganizationId} placeholder="Identificador de MongoDB" />
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput accessibilityLabel="Correo electrónico" autoCapitalize="none" keyboardType="email-address" style={styles.input} value={email} onChangeText={setEmail} placeholder="nombre@empresa.com" />
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput accessibilityLabel="Contraseña" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} onSubmitEditing={() => void signIn()} placeholder="Contraseña" />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" disabled={loading || !organizationId || !email || !password} onPress={() => void signIn()} style={[styles.primaryButton, (loading || !organizationId || !email || !password) && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>{loading ? 'Conectando…' : 'Iniciar sesión'}</Text>
            </Pressable>
            <Text style={styles.loginHint}>La sesión se conserva solo mientras esta página permanezca abierta.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !summary) {
    return <SafeAreaView style={styles.safe}><View style={styles.centerState}><Text style={styles.sectionTitle}>Cargando información del ERP…</Text></View></SafeAreaView>;
  }

  if (!summary || !organization) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.sectionTitle}>No pudimos cargar el dashboard</Text>
          <Text style={styles.stateCopy}>{error || 'Comprueba tus permisos y la conexión con la API.'}</Text>
          <View style={styles.buttonRow}>
            <ActionButton label="Reintentar" onPress={() => void refreshDashboard()} />
            <ActionButton label="Cerrar sesión" onPress={() => void signOut()} secondary />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.sidebar}>
          <Text style={styles.brand}>NEXO ERP</Text>
          <Text style={styles.caption}>{organization.name.toUpperCase()}</Text>
          <View style={styles.sidebarBottom}>
            <Text style={styles.caption}>ORGANIZACIÓN</Text>
            <Text style={styles.user}>{organization.code}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topbar}>
            <View><Text style={styles.eyebrow}>OPERACIONES / RESUMEN</Text><Text style={styles.title}>Dashboard</Text></View>
            <View style={styles.buttonRow}>
              <ActionButton label={loading ? 'Actualizando…' : 'Actualizar'} onPress={() => void refreshDashboard()} disabled={loading} secondary />
              <ActionButton label="Salir" onPress={() => void signOut()} secondary />
            </View>
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
          <View style={styles.hero}>
            <View><Text style={styles.heroTitle}>Resumen de operación</Text><Text style={styles.heroText}>Indicadores de acuerdo con tus permisos.</Text></View>
            <Text style={styles.heroDate}>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(summary.generatedAt))}</Text>
          </View>
          {summary.metrics.length ? (
            <View style={styles.metricGrid}>
              {summary.metrics.map((metric) => <View key={metric.key} style={styles.metric}><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricValue}>{new Intl.NumberFormat('es-MX').format(metric.value)}</Text><Text style={styles.metricDetail}>Registros activos</Text></View>)}
            </View>
          ) : <EmptyState message="Tu usuario todavía no tiene permisos para ver indicadores." />}
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Actividad reciente</Text></View>
          {summary.recentActivity.length ? (
            <View style={styles.activity}>
              {summary.recentActivity.map((item) => <Activity key={`${item.module}-${item.id}`} module={item.module} reference={item.reference} status={item.status} createdAt={item.createdAt} />)}
            </View>
          ) : <EmptyState message="No hay actividad reciente disponible." />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[secondary ? styles.secondaryButton : styles.primaryButton, disabled && styles.disabledButton]}><Text style={secondary ? styles.secondaryButtonText : styles.primaryButtonText}>{label}</Text></Pressable>;
}

function EmptyState({ message }: { message: string }) {
  return <View style={styles.empty}><Text style={styles.stateCopy}>{message}</Text></View>;
}

function Activity({ module, reference, status, createdAt }: { module: string; reference: string; status: string; createdAt: string }) {
  return <View style={styles.activityRow}><View><Text style={styles.activityLabel}>{reference}</Text><Text style={styles.activityDetail}>{module} · {new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(createdAt))}</Text></View><Text style={styles.activityStatus}>{status.replace(/_/g, ' ')}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f6f8' }, shell: { flex: 1, flexDirection: 'row' }, sidebar: { width: 238, backgroundColor: '#102a43', padding: 28, minHeight: '100%' }, brand: { color: '#f7fbfc', fontSize: 22, fontWeight: '800', letterSpacing: 2 }, caption: { color: '#8faabd', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginTop: 8, marginBottom: 28 }, sidebarBottom: { marginTop: 'auto' }, user: { color: '#f7fbfc', fontSize: 14, fontWeight: '600' },
  content: { padding: 38, maxWidth: 1180, width: '100%', alignSelf: 'center' }, topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 }, eyebrow: { color: '#66808f', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }, title: { color: '#102a43', fontSize: 34, fontWeight: '800', marginTop: 6 }, hero: { backgroundColor: '#dcecf0', borderRadius: 12, padding: 27, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, gap: 15 }, heroTitle: { color: '#143b51', fontSize: 22, fontWeight: '800' }, heroText: { color: '#527080', marginTop: 6, fontSize: 14 }, heroDate: { color: '#527080', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 34 }, metric: { backgroundColor: '#fff', borderRadius: 10, padding: 20, flexGrow: 1, flexBasis: 180, minHeight: 122, borderWidth: 1, borderColor: '#e1e9ed' }, metricLabel: { color: '#66808f', fontSize: 12, fontWeight: '700' }, metricValue: { color: '#102a43', fontSize: 27, fontWeight: '800', marginTop: 13 }, metricDetail: { color: '#2aa876', fontSize: 12, marginTop: 7, fontWeight: '700' }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { color: '#102a43', fontSize: 18, fontWeight: '800' }, activity: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e1e9ed' }, activityRow: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#edf1f3', flexDirection: 'row', alignItems: 'center', gap: 18 }, activityLabel: { color: '#173b52', fontSize: 14, fontWeight: '700' }, activityDetail: { color: '#78909c', fontSize: 12, marginTop: 4 }, activityStatus: { marginLeft: 'auto', color: '#2a8a70', textAlign: 'right', fontSize: 12, fontWeight: '700' },
  loginShell: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, loginCard: { width: '100%', maxWidth: 460, backgroundColor: '#fff', borderRadius: 16, padding: 32, borderWidth: 1, borderColor: '#e1e9ed' }, loginTitle: { color: '#102a43', fontSize: 25, fontWeight: '800', marginTop: 26 }, loginCopy: { color: '#66808f', lineHeight: 21, marginTop: 8, marginBottom: 24 }, inputLabel: { color: '#173b52', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 12 }, input: { borderWidth: 1, borderColor: '#d5e0e5', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 12, color: '#102a43', backgroundColor: '#fff' }, primaryButton: { backgroundColor: '#167d9a', paddingHorizontal: 17, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 }, secondaryButton: { borderWidth: 1, borderColor: '#cbd9df', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, secondaryButtonText: { color: '#245269', fontWeight: '700', fontSize: 13 }, disabledButton: { opacity: 0.5 }, loginHint: { color: '#78909c', fontSize: 11, marginTop: 18, lineHeight: 17 }, error: { color: '#a12e35', marginTop: 12, fontSize: 13 }, inlineError: { color: '#a12e35', marginBottom: 15 }, centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, stateCopy: { color: '#66808f', lineHeight: 21, textAlign: 'center', marginTop: 8 }, buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 18 }, empty: { backgroundColor: '#fff', borderRadius: 10, padding: 28, borderWidth: 1, borderColor: '#e1e9ed', alignItems: 'center', marginBottom: 22 },
});
