/**
 * SYNTARA ERP - Dashboard Layout Component
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useTheme, Box, Text as DSText, Button, Card, CardHeader, CardContent, KPICard, Badge } from '@erp-universal/design-system';
import type { DashboardSummary, OrganizationSummary } from '@erp-universal/types';

const STEPS = [
  { key: 'quotation', label: 'Cotización', icon: '📋' },
  { key: 'order', label: 'Pedido', icon: '📦' },
  { key: 'reservation', label: 'Reserva', icon: '🔒' },
  { key: 'preparation', label: 'Preparación', icon: '⚙️' },
  { key: 'shipment', label: 'Envío', icon: '🚚' },
  { key: 'delivery', label: 'Entrega', icon: '✅' },
  { key: 'invoice', label: 'Factura', icon: '🧾' },
  { key: 'payment', label: 'Pago', icon: '💰' },
];

interface DashboardLayoutProps {
  screen: string;
  setScreen: (screen: 'splash' | 'login' | 'dashboard' | 'inventory' | 'sales' | 'purchases' | 'finance' | 'users' | 'settings' | 'forgot-password') => void;
  organization: any;
  summary: any;
  api: any;
  loading: boolean;
  onRefresh: () => void;
  error: string;
  canManageUsers: boolean;
  signOut: () => void;
}

export function DashboardLayout({ screen, setScreen, organization, summary, api, loading, onRefresh, error, canManageUsers, signOut }: DashboardLayoutProps) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.shell}>
        {/* Sidebar */}
        <View style={[styles.sidebar, true ? styles.sidebarOpen : styles.sidebarClosed]}>
          <View style={styles.sidebarHeader}>
            <Text style={[styles.brandLogo, { color: theme.colors.text.primary }]}>SYNTARA</Text>
            <Text style={[styles.brandSubtext, { color: theme.colors.brand.cyan }]}>ERP</Text>
          </View>
          
          <View style={styles.navigation}>
            <NavItem label="Dashboard" icon="📊" active={screen === 'dashboard'} onPress={() => setScreen('dashboard')} />
            <NavItem label="Inventario" icon="📦" active={screen === 'inventory'} onPress={() => setScreen('inventory')} />
            <NavItem label="Ventas" icon="💼" active={screen === 'sales'} onPress={() => setScreen('sales')} />
            <NavItem label="Compras" icon="🛒" active={screen === 'purchases'} onPress={() => setScreen('purchases')} />
            <NavItem label="Finanzas" icon="💰" active={screen === 'finance'} onPress={() => setScreen('finance')} />
            {true && (
              <>
                <NavItem label="Usuarios" icon="👥" active={screen === 'users'} onPress={() => setScreen('users')} />
                <NavItem label="Configuración" icon="⚙️" active={screen === 'settings'} onPress={() => setScreen('settings')} />
              </>
            )}
          </View>
          
          <View style={styles.sidebarBottom}>
            <DSText variant="caption" style={styles.sidebarLabel}>ORGANIZACIÓN</DSText>
            <DSText variant="bodyMedium" style={styles.sidebarOrg}>ORG001</DSText>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <DSText variant="caption" style={styles.eyebrow}>OPERACIONES / dashboard</DSText>
              <DSText variant="headlineLarge" style={styles.pageTitle}>Dashboard</DSText>
            </View>
            <View style={styles.headerRight}>
              <Button variant="ghost" size="sm" onPress={() => {}} disabled={false}>
                🔄 Actualizar
              </Button>
              <Button variant="secondary" size="sm" onPress={() => {}}>
                Salir
              </Button>
            </View>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.content}>
            <DashboardView summary={null} organization={null} api={null} loading={false} onRefresh={() => {}} error="" />
            <InventoryView api={null} />
            <SalesView api={null} />
            <PurchasesView api={null} />
            <FinanceView api={null} />
            <UsersView api={null} canManage={true} />
            <SettingsView />
          </ScrollView>
        </View>
      </View>
      </SafeAreaView>
    );
  }

function NavItem({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.navItem,
        active && styles.navItemActive,
        { backgroundColor: active ? theme.colors.brand.cyanSubtle : 'transparent' }
      ]}
    >
      <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function DashboardView({ summary, organization, api, loading, onRefresh, error }: { summary: any; organization: any; api: any; loading: boolean; onRefresh: () => void; error: string }) {
  const { theme } = useTheme();
  
  return (
    <>
      <Card style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View>
            <DSText variant="headlineMedium" style={styles.heroTitle}>Resumen de operación</DSText>
            <DSText variant="bodyMedium" style={styles.heroText}>Indicadores de acuerdo con tus permisos.</DSText>
          </View>
          <DSText variant="labelMedium" style={styles.heroDate}>
            {new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date())}
          </DSText>
        </View>
      </Card>

      <Card style={styles.emptyCard}>
        <DSText variant="bodyMedium" style={styles.emptyText}>Tu usuario todavía no tiene permisos para ver indicadores.</DSText>
      </Card>

      <Box direction="row" justify="space-between" align="center" style={styles.sectionHeader}>
        <DSText variant="headlineSmall">Actividad reciente</DSText>
      </Box>

      <Card style={styles.emptyCard}>
        <DSText variant="bodyMedium" style={styles.emptyText}>No hay actividad reciente disponible.</DSText>
      </Card>
    </>
  );
}

function InventoryView({ api }: { api: any }) {
  const { theme } = useTheme();
  return (
    <Card>
      <CardHeader title="Inventario" subtitle="Gestión de existencias y almacenes" />
      <CardContent>
        <DSText variant="bodyMedium" style={styles.comingSoon}>
          Módulo de inventario en desarrollo. Próximamente: existencias, almacenes, movimientos, transferencias, conteos cíclicos.
        </DSText>
      </CardContent>
    </Card>
  );
}

function SalesView({ api }: { api: any }) {
  const { theme } = useTheme();
  return (
    <>
      <Card>
        <CardHeader title="Ventas" subtitle="Flujo completo: Cotización → Pedido → Entrega → Factura → Pago" />
        <CardContent>
          <Box direction="row" wrap gap={8} style={styles.flowSteps}>
            {STEPS.map((step) => (
              <Box key={step.key} style={[styles.flowStep, { backgroundColor: '#00C8F51A', borderColor: '#00C8F5' }]}>
                <Text style={styles.flowStepIcon}>{step.icon}</Text>
                <DSText variant="caption" style={styles.flowStepLabel}>{step.label}</DSText>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Pedidos recientes" subtitle="Estado del pipeline de ventas" />
        <CardContent>
          <DSText variant="bodyMedium" style={styles.comingSoon}>
            Lista de pedidos, cotizaciones, envíos, entregas y facturas. En desarrollo.
          </DSText>
        </CardContent>
      </Card>
    </>
  );
}

function PurchasesView({ api }: { api: any }) {
  return (
    <Card>
      <CardHeader title="Compras" subtitle="Solicitud → Aprobación → Orden → Recepción → Factura → Pago → Contabilidad" />
      <CardContent>
        <DSText variant="bodyMedium" style={styles.comingSoon}>
          Módulo de compras en desarrollo. Flujo: solicitudes, aprobaciones, órdenes, recepciones, facturas proveedor, cuentas por pagar.
        </DSText>
      </CardContent>
    </Card>
  );
}

function FinanceView({ api }: { api: any }) {
  return (
    <Card>
      <CardHeader title="Finanzas" subtitle="Cuentas por cobrar, cuentas por pagar, pagos, bancos" />
      <CardContent>
        <DSText variant="bodyMedium" style={styles.comingSoon}>
          Módulo financiero en desarrollo. Facturación interna (no CFDI), pagos, control de saldos.
        </DSText>
      </CardContent>
    </Card>
  );
}

function UsersView({ api, canManage }: { api: any; canManage: boolean }) {
  const { theme } = useTheme();
  return (
    <Card>
      <CardHeader title="Usuarios" subtitle={true ? 'Gestión de usuarios de la organización' : 'Solo lectura'} />
      <CardContent>
        {true ? (
          <DSText variant="bodyMedium" style={styles.comingSoon}>
            CRUD de usuarios, roles, permisos, activación/desactivación. En desarrollo.
          </DSText>
        ) : (
          <DSText variant="bodyMedium" style={styles.comingSoon}>
            No tienes permisos para gestionar usuarios.
          </DSText>
        )}
      </CardContent>
    </Card>
  );
}

function SettingsView() {
  return (
    <Card>
      <CardHeader title="Configuración" subtitle="Preferencias de la organización y cuenta" />
      <CardContent>
        <DSText variant="bodyMedium" style={styles.comingSoon}>
          Configuración de organización, sucursales, almacenes, catálogos, impuestos, series, plantillas.
        </DSText>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020B17' },
  shell: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 260, backgroundColor: '#061525', borderRightWidth: 1, borderRightColor: '#123A55', minHeight: '100%', flexShrink: 0 },
  sidebarOpen: { width: 260 },
  sidebarClosed: { width: 72 },
  sidebarHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#123A55', alignItems: 'center' },
  navigation: { padding: 16, gap: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, gap: 12 },
  navItemActive: { backgroundColor: 'rgba(0, 200, 245, 0.1)' },
  navIcon: { fontSize: 20 },
  navIconActive: { color: '#00C8F5' },
  navLabel: { color: '#9DB3C7', fontSize: 14, fontWeight: '600' },
  navLabelActive: { color: '#00C8F5', fontWeight: '700' },
  sidebarBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopColor: '#123A55' },
  sidebarLabel: { color: '#668096', marginBottom: 4 },
  sidebarOrg: { color: '#F5FAFF', fontWeight: '600' },
  brandLogo: { fontSize: 32, fontWeight: '800', color: '#F5FAFF', letterSpacing: 3 },
  brandSubtext: { fontSize: 14, fontWeight: '600', color: '#00C8F5', marginTop: 4 },
  mainContent: { flex: 1, flexDirection: 'column', backgroundColor: '#020B17' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#123A55', backgroundColor: '#061525' },
  headerLeft: { flex: 1 },
  eyebrow: { color: '#00C8F5', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 },
  pageTitle: { color: '#F5FAFF', fontSize: 28, fontWeight: '800' },
  headerRight: { flexDirection: 'row', gap: 12 },
  content: { padding: 24, gap: 20 },
  heroCard: { marginBottom: 20, backgroundColor: 'rgba(0, 103, 177, 0.08)', borderColor: '#0067B1' },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  heroTitle: { color: '#0067B1', fontSize: 22, fontWeight: '800' },
  heroText: { color: '#9DB3C7', marginTop: 6 },
  heroDate: { color: '#00C8F5', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  emptyCard: { backgroundColor: '#0B2033', borderColor: '#123A55' },
  emptyText: { color: '#9DB3C7', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  comingSoon: { color: '#668096', fontStyle: 'italic', textAlign: 'center', padding: 40 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#123A55' },
  activityContent: { flex: 1 },
  activityLabel: { color: '#F5FAFF', fontWeight: '600' },
  activityDetail: { color: '#9DB3C7', marginTop: 2 },
  flowSteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  flowStep: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 8 },
  flowStepIcon: { fontSize: 18 },
  flowStepLabel: { color: '#00C8F5', fontWeight: '700' },
});

export default DashboardLayout;