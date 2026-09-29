import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiClient, ApiClientError, type MasterDataResource } from '@erp-universal/api-client';
import type { AuthSession, DashboardSummary, OrganizationSummary } from '@erp-universal/types';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

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

export function App() {
  const [screen, setScreen] = useState<'dashboard' | 'users' | 'master-data' | 'inventory' | 'finance' | 'orders'>('dashboard');
  const [organizationId, setOrganizationId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [canManageUsers, setCanManageUsers] = useState(false);
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
      setCanManageUsers(tokenHasAdminRole(result.accessToken));
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
    setCanManageUsers(false);
    accessToken.current = undefined;
    setOrganization(null);
    setSummary(null);
    setScreen('dashboard');
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
          <View style={styles.navigation}>
            <NavigationButton label="Dashboard" active={screen === 'dashboard'} onPress={() => setScreen('dashboard')} />
            <NavigationButton label="Inventario" active={screen === 'inventory'} onPress={() => setScreen('inventory')} />
            <NavigationButton label="Ventas y compras" active={screen === 'orders'} onPress={() => setScreen('orders')} />
            {canManageUsers ? <>
              <NavigationButton label="Usuarios" active={screen === 'users'} onPress={() => setScreen('users')} />
              <NavigationButton label="Datos maestros" active={screen === 'master-data'} onPress={() => setScreen('master-data')} />
              <NavigationButton label="Finanzas" active={screen === 'finance'} onPress={() => setScreen('finance')} />
            </> : null}
          </View>
          <View style={styles.sidebarBottom}>
            <Text style={styles.caption}>ORGANIZACIÓN</Text>
            <Text style={styles.user}>{organization.code}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topbar}>
            <View><Text style={styles.eyebrow}>OPERACIONES / {screen === 'dashboard' ? 'RESUMEN' : screen === 'inventory' ? 'INVENTARIO' : screen === 'finance' ? 'FINANZAS' : screen === 'orders' ? 'VENTAS Y COMPRAS' : 'ADMINISTRACIÓN'}</Text><Text style={styles.title}>{screen === 'dashboard' ? 'Dashboard' : screen === 'users' ? 'Usuarios' : screen === 'inventory' ? 'Inventario' : screen === 'finance' ? 'Finanzas' : screen === 'orders' ? 'Ventas y compras' : 'Datos maestros'}</Text></View>
            <View style={styles.buttonRow}>
              {screen === 'dashboard' ? <ActionButton label={loading ? 'Actualizando…' : 'Actualizar'} onPress={() => void refreshDashboard()} disabled={loading} secondary /> : null}
              <ActionButton label="Salir" onPress={() => void signOut()} secondary />
            </View>
          </View>
          {screen === 'dashboard' ? <>
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
          </> : screen === 'users' ? <UsersManagement api={api} /> : screen === 'master-data' ? <MasterDataManagement api={api} /> : screen === 'finance' ? <FinanceManagement api={api} /> : screen === 'orders' ? <OrdersManagement api={api} canOperate={canManageUsers} /> : <InventoryManagement api={api} />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function NavigationButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}${active ? ', seleccionado' : ''}`} onPress={onPress} style={[styles.navigationButton, active && styles.navigationButtonActive]}><Text style={[styles.navigationButtonText, active && styles.navigationButtonTextActive]}>{label}</Text></Pressable>;
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}${active ? ', seleccionado' : ''}`} onPress={onPress} style={[styles.filterButton, active && styles.filterButtonActive]}><Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>{label}</Text></Pressable>;
}

function InventoryManagement({ api }: { api: ApiClient }) {
  const [balances, setBalances] = useState<Awaited<ReturnType<ApiClient['getInventoryBalances']>>['items']>([]);
  const [movements, setMovements] = useState<Awaited<ReturnType<ApiClient['getInventoryMovements']>>['items']>([]);
  const [transfers, setTransfers] = useState<Awaited<ReturnType<ApiClient['getInventoryTransfers']>>['items']>([]);
  const [cycleCounts, setCycleCounts] = useState<Awaited<ReturnType<ApiClient['getInventoryCycleCounts']>>['items']>([]);
  const [returns, setReturns] = useState<Awaited<ReturnType<ApiClient['getInventoryReturns']>>['items']>([]);
  const [returnableSalesOrders, setReturnableSalesOrders] = useState<Awaited<ReturnType<ApiClient['getReturnableSalesOrders']>>['items']>([]);
  const [returnablePurchaseOrders, setReturnablePurchaseOrders] = useState<Awaited<ReturnType<ApiClient['getReturnablePurchaseOrders']>>['items']>([]);
  const [returnKind, setReturnKind] = useState<'SALE_ORDER' | 'PURCHASE_ORDER'>('SALE_ORDER');
  const [salesOrderId, setSalesOrderId] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, string>>({});
  const [returnReason, setReturnReason] = useState('');
  const [warehouses, setWarehouses] = useState<Awaited<ReturnType<ApiClient['getMasterData']>>['items']>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<ApiClient['getMasterData']>>['items']>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [movementType, setMovementType] = useState<'ADJUSTMENT' | 'DAMAGE'>('ADJUSTMENT');
  const [direction, setDirection] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [cycleCountReason, setCycleCountReason] = useState('');
  const [selectedCycleCount, setSelectedCycleCount] = useState<Awaited<ReturnType<ApiClient['getInventoryCycleCounts']>>['items'][number] | null>(null);
  const [countedValues, setCountedValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [balancePage, movementPage, transferPage, cycleCountPage, returnPage] = await Promise.all([
        api.getInventoryBalances({ page, limit: 20, ...(warehouseId ? { warehouseId } : {}), ...(productId ? { productId } : {}) }),
        api.getInventoryMovements({ page, limit: 20, ...(warehouseId ? { warehouseId } : {}), ...(productId ? { productId } : {}) }),
        api.getInventoryTransfers({ page, limit: 20, ...(warehouseId ? { warehouseId } : {}), ...(productId ? { productId } : {}) }),
        api.getInventoryCycleCounts({ page, limit: 20, ...(warehouseId ? { warehouseId } : {}) }),
        api.getInventoryReturns({ page, limit: 20, ...(warehouseId ? { warehouseId } : {}), ...(productId ? { productId } : {}) }),
      ]);
      setBalances(balancePage.items);
      setMovements(movementPage.items);
      setTransfers(transferPage.items);
      setCycleCounts(cycleCountPage.items);
      setReturns(returnPage.items);
      setTotal(balancePage.total);
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError && cause.status === 403 ? 'Tu usuario no tiene permiso para consultar inventario.' : cause instanceof ApiClientError ? cause.message : 'No se pudo cargar el inventario.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      api.getMasterData('warehouses', { limit: 100, active: true }),
      api.getMasterData('products', { limit: 100, active: true }),
    ]).then(([warehouseResult, productResult]) => {
      if (cancelled) return;
      setWarehouses(warehouseResult.items);
      setProducts(productResult.items);
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof ApiClientError ? cause.message : 'No se pudieron cargar almacenes y productos.');
    });
    return () => { cancelled = true; };
  }, [api]);
  useEffect(() => { void load(); }, [api, page, warehouseId, productId]);
  useEffect(() => {
    let cancelled = false;
    void Promise.all([api.getReturnableSalesOrders({ limit: 100 }), api.getReturnablePurchaseOrders({ limit: 100 })]).then(([sales, purchases]) => {
      if (cancelled) return;
      setReturnableSalesOrders(sales.items);
      setReturnablePurchaseOrders(purchases.items);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [api]);

  const submitMovement = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      await api.createInventoryMovement({ warehouseId, productId, type: movementType, ...(movementType === 'ADJUSTMENT' ? { direction } : {}), quantity: quantity.trim(), reason: reason.trim() });
      setNotice('Movimiento registrado y auditado.'); setQuantity(''); setReason(''); await load();
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo registrar el movimiento.');
    } finally { setSaving(false); }
  };
  const submitTransfer = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      await api.createInventoryTransfer({ sourceWarehouseId: warehouseId, destinationWarehouseId, productId, quantity: quantity.trim(), reason: reason.trim() });
      setNotice('Transferencia registrada entre almacenes.'); setQuantity(''); setReason(''); await load();
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo registrar la transferencia.');
    } finally { setSaving(false); }
  };
  const startCycleCount = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      const count = await api.createInventoryCycleCount({ warehouseId, reason: cycleCountReason.trim() });
      setSelectedCycleCount(count);
      setCountedValues(Object.fromEntries(count.lines.map((line) => [line.productId, ''])));
      setCycleCountReason('');
      setNotice('Conteo iniciado. Captura la cantidad física de cada producto y ciérralo.');
      await load();
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo iniciar el conteo.');
    } finally { setSaving(false); }
  };
  const completeSelectedCycleCount = async () => {
    if (!selectedCycleCount) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const count = await api.completeInventoryCycleCount(selectedCycleCount._id, selectedCycleCount.lines.map((line) => ({ productId: line.productId, countedQuantity: countedValues[line.productId]!.trim() })));
      setSelectedCycleCount(count);
      setNotice('Conteo cerrado. Las diferencias quedaron aplicadas y auditadas.');
      await load();
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo cerrar el conteo.');
    } finally { setSaving(false); }
  };
  const submitReturn = async () => {
    setSaving(true); setError(''); setNotice('');
    const lines = Object.entries(returnQuantities).filter(([, value]) => /^\d+(\.\d{1,4})?$/.test(value.trim()) && Number(value) > 0).map(([productId, value]) => ({ productId, quantity: value.trim() }));
    try {
      if (returnKind === 'SALE_ORDER') await api.createSalesReturn({ salesOrderId, reason: returnReason.trim(), lines });
      else await api.createPurchaseReturn({ purchaseOrderId, warehouseId, reason: returnReason.trim(), lines });
      setNotice('Devolución registrada y auditada.'); setReturnQuantities({}); setReturnReason(''); await load();
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo registrar la devolución.');
    } finally { setSaving(false); }
  };
  const warehouseName = (id: string) => String(warehouses.find((item) => item._id === id)?.name ?? id);
  const productName = (id: string) => String(products.find((item) => item._id === id)?.name ?? id);
  const available = (onHand: string, reserved: string) => {
    const units = (value: string) => { const [whole, fraction = ''] = value.split('.'); return BigInt(whole || '0') * 10000n + BigInt(fraction.padEnd(4, '0').slice(0, 4)); };
    const remaining = units(onHand) - units(reserved);
    const whole = remaining / 10000n;
    const fraction = String(remaining % 10000n).padStart(4, '0').replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : String(whole);
  };
  const pages = Math.max(1, Math.ceil(total / 20));
  const quantityValid = /^\d+(\.\d{1,4})?$/.test(quantity.trim()) && Number(quantity) > 0;
  const selectedSalesOrder = returnableSalesOrders.find((order) => order._id === salesOrderId);
  const selectedPurchaseOrder = returnablePurchaseOrders.find((order) => order._id === purchaseOrderId);
  const returnLines = returnKind === 'SALE_ORDER' ? selectedSalesOrder?.lines ?? [] : selectedPurchaseOrder?.lines ?? [];
  const returnReady = returnLines.some((line) => /^\d+(\.\d{1,4})?$/.test(returnQuantities[line.productId] ?? '') && Number(returnQuantities[line.productId]) > 0);
  const countReady = Boolean(selectedCycleCount && selectedCycleCount.lines.length && selectedCycleCount.lines.every((line) => /^\d+(\.\d{1,4})?$/.test(countedValues[line.productId] ?? '')));

  return <View>
    <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Existencias</Text><Text style={styles.stateCopy}>{total} productos por almacén</Text></View></View>
    {notice ? <Text style={styles.successMessage}>{notice}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Registrar ajuste o daño</Text>
      <Text style={styles.inputLabel}>Almacén</Text>
      <View style={styles.resourceTabs}><FilterButton label="Todos" active={!warehouseId} onPress={() => setWarehouseId('')} />{warehouses.map((item) => <FilterButton key={item._id} label={`${String(item.code)} · ${String(item.name)}`} active={warehouseId === item._id} onPress={() => setWarehouseId(item._id)} />)}</View>
      <Text style={styles.inputLabel}>Producto</Text>
      <View style={styles.resourceTabs}><FilterButton label="Todos" active={!productId} onPress={() => setProductId('')} />{products.map((item) => <FilterButton key={item._id} label={`${String(item.sku)} · ${String(item.name)}`} active={productId === item._id} onPress={() => setProductId(item._id)} />)}</View>
      <Text style={styles.inputLabel}>Tipo</Text>
      <View style={styles.resourceTabs}><FilterButton label="Ajuste" active={movementType === 'ADJUSTMENT'} onPress={() => setMovementType('ADJUSTMENT')} /><FilterButton label="Daño" active={movementType === 'DAMAGE'} onPress={() => setMovementType('DAMAGE')} /></View>
      {movementType === 'ADJUSTMENT' ? <><Text style={styles.inputLabel}>Dirección del ajuste</Text><View style={styles.resourceTabs}><FilterButton label="Entrada" active={direction === 'INCREASE'} onPress={() => setDirection('INCREASE')} /><FilterButton label="Salida" active={direction === 'DECREASE'} onPress={() => setDirection('DECREASE')} /></View></> : null}
      <Text style={styles.inputLabel}>Cantidad</Text>
      <TextInput accessibilityLabel="Cantidad del movimiento" keyboardType="decimal-pad" style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="Ej. 2.5" />
      <Text style={styles.inputLabel}>Motivo (obligatorio)</Text>
      <TextInput accessibilityLabel="Motivo del movimiento" style={styles.input} value={reason} onChangeText={setReason} placeholder="Describe por qué cambia la existencia" />
      <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Registrar movimiento'} disabled={saving || !warehouseId || !productId || !quantityValid || reason.trim().length < 3} onPress={() => void submitMovement()} /></View>
    </View>
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Transferir existencias</Text>
      <Text style={styles.inputLabel}>Almacén de origen</Text>
      <View style={styles.resourceTabs}>{warehouses.map((item) => <FilterButton key={item._id} label={`${String(item.code)} · ${String(item.name)}`} active={warehouseId === item._id} onPress={() => setWarehouseId(item._id)} />)}</View>
      <Text style={styles.inputLabel}>Almacén de destino</Text>
      <View style={styles.resourceTabs}>{warehouses.map((item) => <FilterButton key={item._id} label={`${String(item.code)} · ${String(item.name)}`} active={destinationWarehouseId === item._id} onPress={() => setDestinationWarehouseId(item._id)} />)}</View>
      <Text style={styles.inputLabel}>Producto</Text>
      <View style={styles.resourceTabs}>{products.map((item) => <FilterButton key={item._id} label={`${String(item.sku)} · ${String(item.name)}`} active={productId === item._id} onPress={() => setProductId(item._id)} />)}</View>
      <Text style={styles.inputLabel}>Cantidad a transferir</Text>
      <TextInput accessibilityLabel="Cantidad a transferir" keyboardType="decimal-pad" style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="Ej. 2.5" />
      <Text style={styles.inputLabel}>Motivo</Text>
      <TextInput accessibilityLabel="Motivo de transferencia" style={styles.input} value={reason} onChangeText={setReason} placeholder="Describe por qué se mueve el producto" />
      <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Transferir'} disabled={saving || !warehouseId || !destinationWarehouseId || warehouseId === destinationWarehouseId || !productId || !quantityValid || reason.trim().length < 3} onPress={() => void submitTransfer()} /></View>
    </View>
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Conteo físico cíclico</Text>
      <Text style={styles.stateCopy}>El conteo toma una instantánea del almacén. Si sus saldos cambian antes del cierre, deberás iniciar uno nuevo.</Text>
      <Text style={styles.inputLabel}>Almacén a contar</Text>
      <View style={styles.resourceTabs}>{warehouses.map((item) => <FilterButton key={item._id} label={`${String(item.code)} · ${String(item.name)}`} active={warehouseId === item._id} onPress={() => setWarehouseId(item._id)} />)}</View>
      <Text style={styles.inputLabel}>Motivo del conteo</Text>
      <TextInput accessibilityLabel="Motivo del conteo" style={styles.input} value={cycleCountReason} onChangeText={setCycleCountReason} placeholder="Conteo cíclico semanal, auditoría, etc." />
      <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Iniciar conteo'} disabled={saving || !warehouseId || cycleCountReason.trim().length < 3} onPress={() => void startCycleCount()} /></View>
      {cycleCounts.length ? <View style={styles.activity}>{cycleCounts.map((count) => <View key={count._id} style={styles.masterRow}>
        <Text style={[styles.activityDetail, styles.masterCell]}>{count.status === 'DRAFT' ? 'Abierto' : 'Cerrado'} · {count.lines.length} productos</Text>
        <Text style={[styles.activityDetail, styles.masterCell]}>{count.reason}</Text>
        <ActionButton label={count.status === 'DRAFT' ? 'Capturar' : 'Ver'} secondary onPress={() => { setSelectedCycleCount(count); setCountedValues(Object.fromEntries(count.lines.map((line) => [line.productId, line.countedQuantity ?? '']))); setError(''); }} />
      </View>)}</View> : <EmptyState message="No hay conteos para este almacén." />}
      {selectedCycleCount ? <View style={styles.activity}>
        <Text style={styles.sectionTitle}>Conteo {selectedCycleCount.status === 'DRAFT' ? 'abierto' : 'cerrado'} · {warehouseName(selectedCycleCount.warehouseId)}</Text>
        {selectedCycleCount.lines.map((line) => <View key={line.productId} style={styles.masterRow}>
          <Text style={[styles.activityDetail, styles.masterCell]}>{productName(line.productId)}</Text>
          <Text style={[styles.activityDetail, styles.masterCell]}>Esperado: {line.expectedQuantity} · reservado: {line.reservedQuantity}</Text>
          {selectedCycleCount.status === 'DRAFT' ? <TextInput accessibilityLabel={`Cantidad contada de ${productName(line.productId)}`} keyboardType="decimal-pad" style={[styles.input, styles.masterCell]} value={countedValues[line.productId] ?? ''} onChangeText={(value) => setCountedValues((current) => ({ ...current, [line.productId]: value }))} placeholder="Cantidad física" /> : <Text style={[styles.activityDetail, styles.masterCell]}>Contado: {line.countedQuantity ?? '—'} · diferencia: {line.variance ?? '—'}</Text>}
        </View>)}
        {selectedCycleCount.status === 'DRAFT' ? <View style={styles.buttonRow}><ActionButton label={saving ? 'Cerrando…' : 'Cerrar y aplicar diferencias'} disabled={saving || !countReady} onPress={() => void completeSelectedCycleCount()} /></View> : null}
      </View> : null}
    </View>
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Devoluciones de ventas y compras</Text>
      <View style={styles.resourceTabs}>
        <FilterButton label="De cliente" active={returnKind === 'SALE_ORDER'} onPress={() => { setReturnKind('SALE_ORDER'); setReturnQuantities({}); }} />
        <FilterButton label="A proveedor" active={returnKind === 'PURCHASE_ORDER'} onPress={() => { setReturnKind('PURCHASE_ORDER'); setReturnQuantities({}); }} />
      </View>
      <Text style={styles.inputLabel}>{returnKind === 'SALE_ORDER' ? 'Pedido de venta despachado' : 'Pedido de compra recibido'}</Text>
      <View style={styles.resourceTabs}>{returnKind === 'SALE_ORDER'
        ? returnableSalesOrders.map((order) => <FilterButton key={order._id} label={`${order.code} · ${order.status}`} active={salesOrderId === order._id} onPress={() => { setSalesOrderId(order._id); setReturnQuantities({}); }} />)
        : returnablePurchaseOrders.map((order) => <FilterButton key={order._id} label={`${order.code} · ${order.status}`} active={purchaseOrderId === order._id} onPress={() => { setPurchaseOrderId(order._id); setReturnQuantities({}); }} />)}</View>
      {returnKind === 'PURCHASE_ORDER' ? <><Text style={styles.inputLabel}>Almacén donde se recibieron los productos</Text><View style={styles.resourceTabs}>{warehouses.map((item) => <FilterButton key={item._id} label={`${String(item.code)} · ${String(item.name)}`} active={warehouseId === item._id} onPress={() => setWarehouseId(item._id)} />)}</View></> : null}
      {returnLines.map((line) => <View key={line.productId} style={styles.masterRow}>
        <Text style={[styles.activityDetail, styles.masterCell]}>{productName(line.productId)} · Cantidad del pedido: {returnKind === 'PURCHASE_ORDER' ? line.receivedQuantity ?? '0' : line.quantity}</Text>
        <TextInput accessibilityLabel={`Cantidad devuelta de ${productName(line.productId)}`} keyboardType="decimal-pad" style={[styles.input, styles.masterCell]} value={returnQuantities[line.productId] ?? ''} onChangeText={(value) => setReturnQuantities((current) => ({ ...current, [line.productId]: value }))} placeholder="Cantidad a devolver" />
      </View>)}
      <Text style={styles.inputLabel}>Motivo</Text>
      <TextInput accessibilityLabel="Motivo de devolución" style={styles.input} value={returnReason} onChangeText={setReturnReason} placeholder="Describe el motivo de la devolución" />
      <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Registrar devolución'} disabled={saving || !(returnKind === 'SALE_ORDER' ? salesOrderId : purchaseOrderId) || (returnKind === 'PURCHASE_ORDER' && !warehouseId) || !returnReady || returnReason.trim().length < 3} onPress={() => void submitReturn()} /></View>
      {returnLines.length === 0 ? <EmptyState message="Selecciona un pedido para ver sus productos disponibles para devolución." /> : null}
    </View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Saldos por almacén</Text></View>
    {loading ? <EmptyState message="Cargando existencias…" /> : balances.length ? <View style={styles.activity}>
      <View style={styles.masterHeader}>{['Almacén', 'Producto', 'Disponible', 'Reservado'].map((label) => <Text key={label} style={[styles.metricLabel, styles.masterCell]}>{label}</Text>)}</View>
      {balances.map((balance) => <View key={balance._id} style={styles.masterRow}>
        <Text style={[styles.activityDetail, styles.masterCell]}>{warehouseName(balance.warehouseId)}</Text><Text style={[styles.activityDetail, styles.masterCell]}>{productName(balance.productId)}</Text>
        <Text style={[styles.activityDetail, styles.masterCell]}>{available(balance.quantity, balance.reservedQuantity)}</Text><Text style={[styles.activityDetail, styles.masterCell]}>{balance.reservedQuantity}</Text>
      </View>)}
    </View> : <EmptyState message="No hay existencias para estos filtros." />}
    <View style={styles.pagination}><ActionButton label="Anterior" secondary disabled={page <= 1 || loading} onPress={() => setPage(page - 1)} /><Text style={styles.activityDetail}>Página {page} de {pages}</Text><ActionButton label="Siguiente" secondary disabled={page >= pages || loading} onPress={() => setPage(page + 1)} /></View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Movimientos recientes</Text></View>
    {movements.length ? <View style={styles.activity}>{movements.map((movement) => <View key={movement._id} style={styles.masterRow}>
      <Text style={[styles.activityDetail, styles.masterCell]}>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(movement.occurredAt))}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{movement.type === 'ADJUSTMENT' ? `Ajuste ${movement.direction === 'INCREASE' ? 'entrada' : 'salida'}` : movement.type}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{movement.quantity} · {productName(movement.productId)}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{String(movement.reason || movement.referenceType || '—')}</Text>
    </View>)}</View> : <EmptyState message="Todavía no hay movimientos para estos filtros." />}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Transferencias entre almacenes</Text></View>
    {transfers.length ? <View style={styles.activity}>{transfers.map((transfer) => <View key={transfer._id} style={styles.masterRow}>
      <Text style={[styles.activityDetail, styles.masterCell]}>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(transfer.occurredAt))}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{warehouseName(transfer.sourceWarehouseId)} → {warehouseName(transfer.destinationWarehouseId)}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{transfer.quantity} · {productName(transfer.productId)}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{transfer.reason}</Text>
    </View>)}</View> : <EmptyState message="No hay transferencias para estos filtros." />}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Devoluciones registradas</Text></View>
    {returns.length ? <View style={styles.activity}>{returns.map((item) => <View key={item._id} style={styles.masterRow}>
      <Text style={[styles.activityDetail, styles.masterCell]}>{item.sourceType === 'SALE_ORDER' ? 'Cliente' : 'Proveedor'} · {item.sourceDocumentId}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{warehouseName(item.warehouseId)}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{item.lines.map((line) => `${line.quantity} ${productName(line.productId)}`).join(', ')}</Text>
      <Text style={[styles.activityDetail, styles.masterCell]}>{item.reason}</Text>
    </View>)}</View> : <EmptyState message="No hay devoluciones con estos filtros." />}
  </View>;
}

interface MasterField {
  key: string;
  label: string;
  required?: boolean;
  numeric?: boolean;
  secure?: boolean;
}

interface MasterResourceConfig {
  id: MasterDataResource;
  label: string;
  fields: MasterField[];
  columns: { key: string; label: string }[];
}

const masterResources: MasterResourceConfig[] = [
  { id: 'customers', label: 'Clientes', fields: [
    { key: 'code', label: 'Código', required: true }, { key: 'name', label: 'Nombre', required: true },
    { key: 'email', label: 'Correo electrónico' }, { key: 'phone', label: 'Teléfono' }, { key: 'taxId', label: 'RFC' },
  ], columns: [{ key: 'code', label: 'Código' }, { key: 'name', label: 'Nombre' }, { key: 'email', label: 'Correo' }, { key: 'taxId', label: 'RFC' }] },
  { id: 'suppliers', label: 'Proveedores', fields: [
    { key: 'code', label: 'Código', required: true }, { key: 'name', label: 'Nombre', required: true },
    { key: 'email', label: 'Correo electrónico' }, { key: 'phone', label: 'Teléfono' }, { key: 'taxId', label: 'RFC' },
  ], columns: [{ key: 'code', label: 'Código' }, { key: 'name', label: 'Nombre' }, { key: 'email', label: 'Correo' }, { key: 'taxId', label: 'RFC' }] },
  { id: 'products', label: 'Productos', fields: [
    { key: 'sku', label: 'SKU', required: true }, { key: 'name', label: 'Nombre', required: true },
    { key: 'unit', label: 'Unidad', required: true }, { key: 'salePrice', label: 'Precio de venta', required: true },
    { key: 'description', label: 'Descripción' },
  ], columns: [{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Nombre' }, { key: 'unit', label: 'Unidad' }, { key: 'salePrice', label: 'Precio' }] },
  { id: 'branches', label: 'Sucursales', fields: [
    { key: 'code', label: 'Código', required: true }, { key: 'name', label: 'Nombre', required: true },
    { key: 'timezone', label: 'Zona horaria' }, { key: 'address', label: 'Dirección' },
  ], columns: [{ key: 'code', label: 'Código' }, { key: 'name', label: 'Nombre' }, { key: 'timezone', label: 'Zona horaria' }] },
  { id: 'warehouses', label: 'Almacenes', fields: [
    { key: 'code', label: 'Código', required: true }, { key: 'name', label: 'Nombre', required: true },
    { key: 'branchId', label: 'Sucursal (opcional)' },
  ], columns: [{ key: 'code', label: 'Código' }, { key: 'name', label: 'Nombre' }, { key: 'branchId', label: 'Sucursal' }] },
  { id: 'categories', label: 'Categorías', fields: [
    { key: 'code', label: 'Código', required: true }, { key: 'name', label: 'Nombre', required: true },
    { key: 'parentId', label: 'Categoría padre (opcional)' },
  ], columns: [{ key: 'code', label: 'Código' }, { key: 'name', label: 'Nombre' }, { key: 'parentId', label: 'Categoría padre' }] },
  { id: 'units', label: 'Unidades', fields: [
    { key: 'code', label: 'Código', required: true }, { key: 'name', label: 'Nombre', required: true },
    { key: 'decimals', label: 'Decimales permitidos', numeric: true },
  ], columns: [{ key: 'code', label: 'Código' }, { key: 'name', label: 'Nombre' }, { key: 'decimals', label: 'Decimales' }] },
];

function MasterDataManagement({ api }: { api: ApiClient }) {
  const [resourceId, setResourceId] = useState<MasterDataResource>('customers');
  const resource = masterResources.find((item) => item.id === resourceId) ?? masterResources[0]!;
  const [items, setItems] = useState<Awaited<ReturnType<ApiClient['getMasterData']>>['items']>([]);
  const [referenceOptions, setReferenceOptions] = useState<Awaited<ReturnType<ApiClient['getMasterData']>>['items']>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getMasterData(resourceId, { page, limit: 20, search: appliedSearch, active: activeFilter });
      setItems(result.items);
      setTotal(result.total);
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError && cause.status === 403
        ? 'Tu usuario no tiene permiso para consultar este catálogo.'
        : cause instanceof ApiClientError ? cause.message : 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [api, resourceId, page, appliedSearch, activeFilter]);
  useEffect(() => { setValues({}); setPage(1); setSearch(''); setAppliedSearch(''); setShowCreate(false); setEditingItem(null); setNotice(''); }, [resourceId]);
  useEffect(() => {
    const referenceResource = resourceId === 'warehouses' ? 'branches' : resourceId === 'categories' ? 'categories' : undefined;
    if (!showCreate || !referenceResource) { setReferenceOptions([]); return; }
    let cancelled = false;
    void api.getMasterData(referenceResource, { limit: 100, active: true }).then((result) => {
      if (!cancelled) setReferenceOptions(result.items);
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof ApiClientError ? cause.message : 'No se pudieron cargar las opciones relacionadas.');
    });
    return () => { cancelled = true; };
  }, [api, resourceId, showCreate]);

  const create = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    const payload: Record<string, unknown> = {};
    for (const field of resource.fields) {
      const value = values[field.key]?.trim();
      if (!value) continue;
      payload[field.key] = field.numeric ? Number(value) : value;
    }
    try {
      if (editingItem) {
        await api.updateMasterData(resourceId, editingItem, payload);
        setNotice(`Registro actualizado en ${resource.label}.`);
      } else {
        await api.createMasterData(resourceId, payload);
        setNotice(`Registro creado en ${resource.label}.`);
      }
      setEditingItem(null);
      setShowCreate(false);
      setValues({});
      setPage(1);
      setAppliedSearch('');
      setSearch('');
      const result = await api.getMasterData(resourceId, { page: 1, limit: 20, active: activeFilter });
      setItems(result.items);
      setTotal(result.total);
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo crear el registro.');
    } finally {
      setSaving(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 20));
  const requiredReady = resource.fields.filter((field) => field.required).every((field) => values[field.key]?.trim());

  return <View>
    <View style={styles.resourceTabs}>
      {masterResources.map((option) => <FilterButton key={option.id} label={option.label} active={resourceId === option.id} onPress={() => setResourceId(option.id)} />)}
    </View>
    <View style={styles.sectionHeader}>
      <View><Text style={styles.sectionTitle}>{resource.label}</Text><Text style={styles.stateCopy}>{total} registros</Text></View>
      <ActionButton label={showCreate ? 'Cancelar' : 'Agregar registro'} secondary onPress={() => { setShowCreate(!showCreate); setEditingItem(null); setValues({}); setError(''); }} />
    </View>
    {notice ? <Text style={styles.successMessage}>{notice}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
    {showCreate ? <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>{editingItem ? 'Editar registro' : 'Nuevo registro'} · {resource.label}</Text>
      {resource.fields.map((field) => <View key={field.key}>
        <Text style={styles.inputLabel}>{field.label}{field.required ? ' *' : ''}</Text>
        {field.key === 'branchId' || field.key === 'parentId' ? <View style={styles.resourceTabs}>
          <FilterButton label={field.key === 'branchId' ? 'Sin sucursal' : 'Sin categoría padre'} active={!values[field.key]} onPress={() => setValues((current) => ({ ...current, [field.key]: '' }))} />
          {referenceOptions.filter((option) => option._id !== editingItem).map((option) => <FilterButton key={option._id} label={`${String(option.code ?? '')} · ${String(option.name ?? '')}`} active={values[field.key] === option._id} onPress={() => setValues((current) => ({ ...current, [field.key]: option._id }))} />)}
          {referenceOptions.length === 0 ? <Text style={styles.stateCopy}>No hay opciones activas disponibles.</Text> : null}
        </View> : <TextInput accessibilityLabel={field.label} keyboardType={field.numeric ? 'numeric' : 'default'} secureTextEntry={field.secure} style={styles.input} value={values[field.key] ?? ''} onChangeText={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />}
      </View>)}
      <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : editingItem ? 'Guardar cambios' : 'Crear registro'} disabled={saving || !requiredReady} onPress={() => void create()} /></View>
    </View> : null}
    <View style={styles.toolbar}>
      <FilterButton label="Activos" active={activeFilter} onPress={() => { setActiveFilter(true); setPage(1); }} />
      <FilterButton label="Inactivos" active={!activeFilter} onPress={() => { setActiveFilter(false); setPage(1); }} />
      <TextInput accessibilityLabel={`Buscar ${resource.label.toLowerCase()}`} style={[styles.input, styles.searchInput]} value={search} onChangeText={setSearch} onSubmitEditing={() => { setPage(1); setAppliedSearch(search.trim()); }} placeholder="Buscar por código o nombre" />
      <ActionButton label="Buscar" secondary onPress={() => { setPage(1); setAppliedSearch(search.trim()); }} />
    </View>
    {loading ? <EmptyState message={`Cargando ${resource.label.toLowerCase()}…`} /> : items.length ? <View style={styles.activity}>
      <View style={styles.masterHeader}>{resource.columns.map((column) => <Text key={column.key} style={[styles.metricLabel, styles.masterCell]}>{column.label}</Text>)}</View>
      {items.map((item) => <View key={item._id} style={styles.masterRow}>
        {resource.columns.map((column) => <Text key={column.key} style={[styles.activityDetail, styles.masterCell]} numberOfLines={2}>{item[column.key] === undefined || item[column.key] === null ? '—' : String(item[column.key])}</Text>)}
        <ActionButton label="Editar" secondary onPress={() => { setEditingItem(item._id); setShowCreate(true); setValues(Object.fromEntries(resource.fields.map((field) => [field.key, item[field.key] === undefined || item[field.key] === null ? '' : String(item[field.key])]))); setError(''); }} />
        <ActionButton label={item.active === false ? 'Reactivar' : 'Desactivar'} secondary disabled={saving} onPress={() => { void (async () => { setSaving(true); setError(''); try { await api.updateMasterData(resourceId, item._id, { active: item.active === false }); setNotice(item.active === false ? 'Registro reactivado.' : 'Registro desactivado.'); await load(); } catch (cause: unknown) { setError(cause instanceof ApiClientError ? cause.message : 'No se pudo cambiar el estado.'); } finally { setSaving(false); } })(); }} />
      </View>)}
    </View> : <EmptyState message={`No hay registros en ${resource.label.toLowerCase()} con estos filtros.`} />}
    <View style={styles.pagination}>
      <ActionButton label="Anterior" secondary disabled={page <= 1 || loading} onPress={() => setPage(page - 1)} />
      <Text style={styles.activityDetail}>Página {page} de {pages}</Text>
      <ActionButton label="Siguiente" secondary disabled={page >= pages || loading} onPress={() => setPage(page + 1)} />
    </View>
  </View>;
}

function UsersManagement({ api }: { api: ApiClient }) {
  const [users, setUsers] = useState<Awaited<ReturnType<ApiClient['getUsers']>>['items']>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [initialPassword, setInitialPassword] = useState('');

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError('');
    try {
      const result = await api.getUsers({
        page,
        limit: 20,
        search: appliedSearch,
        ...(filter === 'all' ? {} : { active: filter === 'active' }),
      });
      setUsers(result.items);
      setTotal(result.total);
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError && cause.status === 403
        ? 'Tu usuario no tiene permiso para administrar usuarios.'
        : cause instanceof ApiClientError ? cause.message : 'No se pudo cargar la lista de usuarios.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { void loadUsers(); }, [api, page, appliedSearch, filter]);

  const createUser = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.createUser({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), initialPassword });
      setFirstName('');
      setLastName('');
      setEmail('');
      setInitialPassword('');
      setPage(1);
      setAppliedSearch('');
      setSearch('');
      setFilter('all');
      setShowCreate(false);
      setNotice('Usuario creado. Comparte la contraseña inicial por un canal seguro.');
      const result = await api.getUsers({ page: 1, limit: 20 });
      setUsers(result.items);
      setTotal(result.total);
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (userId: string, active: boolean) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.updateUserStatus(userId, !active);
      setNotice(active ? 'Usuario desactivado y sesiones renovables revocadas.' : 'Usuario activado.');
      await loadUsers();
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo actualizar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 20));

  return <View>
    <View style={styles.sectionHeader}>
      <View><Text style={styles.sectionTitle}>Equipo de la organización</Text><Text style={styles.stateCopy}>{total} usuarios</Text></View>
      <ActionButton label={showCreate ? 'Cancelar' : 'Agregar usuario'} onPress={() => { setShowCreate(!showCreate); setError(''); }} secondary />
    </View>
    {notice ? <Text style={styles.successMessage}>{notice}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
    {showCreate ? <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Nuevo usuario</Text>
      <Text style={styles.inputLabel}>Nombre</Text>
      <TextInput accessibilityLabel="Nombre" style={styles.input} value={firstName} onChangeText={setFirstName} />
      <Text style={styles.inputLabel}>Apellidos</Text>
      <TextInput accessibilityLabel="Apellidos" style={styles.input} value={lastName} onChangeText={setLastName} />
      <Text style={styles.inputLabel}>Correo</Text>
      <TextInput accessibilityLabel="Correo" autoCapitalize="none" keyboardType="email-address" style={styles.input} value={email} onChangeText={setEmail} />
      <Text style={styles.inputLabel}>Contraseña inicial (mínimo 12 caracteres)</Text>
      <TextInput accessibilityLabel="Contraseña inicial" secureTextEntry style={styles.input} value={initialPassword} onChangeText={setInitialPassword} />
      <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Crear usuario'} disabled={saving || !firstName.trim() || !lastName.trim() || !email.trim() || initialPassword.length < 12} onPress={() => void createUser()} /></View>
    </View> : null}
    <View style={styles.toolbar}>
      <TextInput accessibilityLabel="Buscar usuarios" style={[styles.input, styles.searchInput]} value={search} onChangeText={setSearch} onSubmitEditing={() => { setPage(1); setAppliedSearch(search.trim()); }} placeholder="Buscar por nombre o correo" />
      <ActionButton label="Buscar" secondary onPress={() => { setPage(1); setAppliedSearch(search.trim()); }} />
      <View style={styles.filterGroup}>
        <FilterButton label="Todos" active={filter === 'all'} onPress={() => { setPage(1); setFilter('all'); }} />
        <FilterButton label="Activos" active={filter === 'active'} onPress={() => { setPage(1); setFilter('active'); }} />
        <FilterButton label="Inactivos" active={filter === 'inactive'} onPress={() => { setPage(1); setFilter('inactive'); }} />
      </View>
    </View>
    {loadingUsers ? <EmptyState message="Cargando usuarios…" /> : users.length ? <View style={styles.activity}>
      {users.map((user) => <View key={user.id} style={styles.userRow}>
        <View style={styles.userDetails}><Text style={styles.activityLabel}>{user.firstName} {user.lastName}</Text><Text style={styles.activityDetail}>{user.email} · {user.roles.join(', ')}</Text></View>
        <Text style={[styles.statusBadge, user.active ? styles.statusActive : styles.statusInactive]}>{user.active ? 'Activo' : 'Inactivo'}</Text>
        <ActionButton label={user.active ? 'Desactivar' : 'Activar'} secondary disabled={saving} onPress={() => void toggleStatus(user.id, user.active)} />
      </View>)}
    </View> : <EmptyState message="No hay usuarios para mostrar con estos filtros." />}
    <View style={styles.pagination}>
      <ActionButton label="Anterior" secondary disabled={page <= 1 || loadingUsers} onPress={() => setPage(page - 1)} />
      <Text style={styles.activityDetail}>Página {page} de {pages}</Text>
      <ActionButton label="Siguiente" secondary disabled={page >= pages || loadingUsers} onPress={() => setPage(page + 1)} />
    </View>
  </View>;
}

function FinanceManagement({ api }: { api: ApiClient }) {
  const [invoices, setInvoices] = useState<Awaited<ReturnType<ApiClient['getInvoices']>>>([]);
  const [payments, setPayments] = useState<Awaited<ReturnType<ApiClient['getPayments']>>>([]);
  const [creditMemos, setCreditMemos] = useState<Awaited<ReturnType<ApiClient['getCreditMemos']>>['items']>([]);
  const [refunds, setRefunds] = useState<Awaited<ReturnType<ApiClient['getCustomerRefunds']>>['items']>([]);
  const [salesReturns, setSalesReturns] = useState<Awaited<ReturnType<ApiClient['getInventoryReturns']>>['items']>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [returnId, setReturnId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [creditMemoId, setCreditMemoId] = useState('');
  const [memoNumber, setMemoNumber] = useState('');
  const [memoReason, setMemoReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'TRANSFER' | 'CARD' | 'OTHER'>('TRANSFER');
  const [refundReference, setRefundReference] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [invoiceRows, paymentRows, memoPage, refundPage, returnPage] = await Promise.all([
        api.getInvoices({ page: 1, limit: 100 }), api.getPayments({ page: 1, limit: 100 }),
        api.getCreditMemos({ page: 1, limit: 100 }), api.getCustomerRefunds({ page: 1, limit: 100 }),
        api.getInventoryReturns({ page: 1, limit: 100, sourceType: 'SALE_ORDER' }),
      ]);
      setInvoices(invoiceRows); setPayments(paymentRows); setCreditMemos(memoPage.items); setRefunds(refundPage.items); setSalesReturns(returnPage.items);
      const firstInvoiceId = invoiceRows[0]?._id ?? '';
      setInvoiceId(firstInvoiceId);
      setPaymentId(paymentRows.find((payment) => payment.invoiceId === firstInvoiceId && payment.status === 'CONFIRMED')?._id ?? '');
      setCreditMemoId(memoPage.items.find((memo) => memo.invoiceId === firstInvoiceId)?._id ?? '');
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudo cargar la información financiera.');
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [api]);

  const selectedInvoice = invoices.find((invoice) => invoice._id === invoiceId);
  const availableReturns = salesReturns.filter((item) => String(item.sourceDocumentId) === String(selectedInvoice?.salesOrderId) && !creditMemos.some((memo) => memo.inventoryReturnId === item._id));
  const invoicePayments = payments.filter((payment) => payment.invoiceId === invoiceId && payment.status === 'CONFIRMED');
  const invoiceMemos = creditMemos.filter((memo) => memo.invoiceId === invoiceId);
  const submitMemo = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      await api.createCreditMemo({ inventoryReturnId: returnId, number: memoNumber.trim(), reason: memoReason.trim() });
      setMemoNumber(''); setMemoReason(''); setReturnId(''); setNotice('Nota de crédito emitida y saldo actualizado.'); await load();
    } catch (cause: unknown) { setError(cause instanceof ApiClientError ? cause.message : 'No se pudo emitir la nota de crédito.'); }
    finally { setSaving(false); }
  };
  const submitRefund = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      await api.createCustomerRefund({ paymentId, creditMemoId, amount: refundAmount.trim(), method: refundMethod, reference: refundReference.trim() || undefined, reason: refundReason.trim() });
      setRefundAmount(''); setRefundReference(''); setRefundReason(''); setNotice('Reembolso registrado y auditado.'); await load();
    } catch (cause: unknown) { setError(cause instanceof ApiClientError ? cause.message : 'No se pudo registrar el reembolso.'); }
    finally { setSaving(false); }
  };
  const money = (amount: string | undefined, currency = selectedInvoice?.currency ?? 'MXN') => `${currency} ${amount ?? '0.00'}`;

  return <View>
    <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Cuentas por cobrar y devoluciones</Text><Text style={styles.stateCopy}>Facturas, notas de crédito y reembolsos</Text></View><ActionButton label={loading ? 'Actualizando…' : 'Actualizar'} secondary disabled={loading} onPress={() => void load()} /></View>
    {notice ? <Text style={styles.successMessage}>{notice}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
    {loading ? <EmptyState message="Cargando finanzas…" /> : <>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Facturas</Text>
        {invoices.length ? invoices.map((invoice) => <Pressable key={invoice._id} onPress={() => { setInvoiceId(invoice._id); setPaymentId(payments.find((payment) => payment.invoiceId === invoice._id && payment.status === 'CONFIRMED')?._id ?? ''); setCreditMemoId(creditMemos.find((memo) => memo.invoiceId === invoice._id)?._id ?? ''); setReturnId(''); }} style={[styles.activityRow, invoice._id === invoiceId && { backgroundColor: '#edf6f7' }]}>
          <View style={styles.userDetails}><Text style={styles.activityLabel}>{invoice.number} · {invoice.status}</Text><Text style={styles.activityDetail}>Cliente {invoice.customerId} · Total {money(invoice.total, invoice.currency)}</Text><Text style={styles.activityDetail}>Pagado {money(invoice.paidAmount, invoice.currency)} · Crédito {money(invoice.creditedAmount, invoice.currency)} · Saldo {money(invoice.balanceDue, invoice.currency)} · A favor {money(invoice.customerCreditAmount, invoice.currency)}</Text></View>
        </Pressable>) : <EmptyState message="No hay facturas disponibles." />}
      </View>
      {selectedInvoice ? <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Emitir nota de crédito · {selectedInvoice.number}</Text>
        <Text style={styles.inputLabel}>Devolución de venta elegible</Text>
        <View style={styles.resourceTabs}>{availableReturns.map((item) => <FilterButton key={item._id} label={`${item._id.slice(-8)} · ${item.reason}`} active={returnId === item._id} onPress={() => setReturnId(item._id)} />)}</View>
        {!availableReturns.length ? <Text style={styles.activityDetail}>No hay devoluciones de esta factura pendientes de acreditar.</Text> : null}
        <Text style={styles.inputLabel}>Número de nota</Text><TextInput accessibilityLabel="Número de nota de crédito" style={styles.input} value={memoNumber} onChangeText={setMemoNumber} />
        <Text style={styles.inputLabel}>Motivo</Text><TextInput accessibilityLabel="Motivo de nota de crédito" style={styles.input} value={memoReason} onChangeText={setMemoReason} />
        <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Emitir nota'} disabled={saving || !returnId || !memoNumber.trim() || memoReason.trim().length < 3} onPress={() => void submitMemo()} /></View>
      </View> : null}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Reembolsar saldo a favor</Text>
        <Text style={styles.inputLabel}>Pago confirmado</Text><View style={styles.resourceTabs}>{invoicePayments.map((payment) => <FilterButton key={payment._id} label={`${money(payment.amount, payment.currency)} · neto ${money(payment.netAmount, payment.currency)}`} active={paymentId === payment._id} onPress={() => setPaymentId(payment._id)} />)}</View>
        <Text style={styles.inputLabel}>Nota de crédito</Text><View style={styles.resourceTabs}>{invoiceMemos.map((memo) => <FilterButton key={memo._id} label={`${memo.number} · ${money(memo.total, memo.currency)}`} active={creditMemoId === memo._id} onPress={() => setCreditMemoId(memo._id)} />)}</View>
        {!invoicePayments.length || !invoiceMemos.length ? <Text style={styles.activityDetail}>Selecciona una factura con pago confirmado y nota de crédito emitida.</Text> : null}
        <Text style={styles.inputLabel}>Importe</Text><TextInput accessibilityLabel="Importe del reembolso" keyboardType="numeric" style={styles.input} value={refundAmount} onChangeText={setRefundAmount} />
        <Text style={styles.inputLabel}>Método</Text><View style={styles.resourceTabs}>{(['CASH', 'TRANSFER', 'CARD', 'OTHER'] as const).map((method) => <FilterButton key={method} label={method} active={refundMethod === method} onPress={() => setRefundMethod(method)} />)}</View>
        <Text style={styles.inputLabel}>Referencia (opcional)</Text><TextInput accessibilityLabel="Referencia del reembolso" style={styles.input} value={refundReference} onChangeText={setRefundReference} />
        <Text style={styles.inputLabel}>Motivo</Text><TextInput accessibilityLabel="Motivo del reembolso" style={styles.input} value={refundReason} onChangeText={setRefundReason} />
        <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Registrar reembolso'} disabled={saving || !paymentId || !creditMemoId || !/^\d+(\.\d{1,4})?$/.test(refundAmount.trim()) || Number(refundAmount) <= 0 || refundReason.trim().length < 3} onPress={() => void submitRefund()} /></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Notas emitidas y reembolsos</Text></View>
      <View style={styles.activity}>{creditMemos.map((memo) => <View key={memo._id} style={styles.activityRow}><View><Text style={styles.activityLabel}>Nota {memo.number} · {money(memo.total, memo.currency)}</Text><Text style={styles.activityDetail}>Factura {memo.invoiceId} · {memo.reason}</Text></View></View>)}{refunds.map((refund) => <View key={refund._id} style={styles.activityRow}><View><Text style={styles.activityLabel}>Reembolso · {money(refund.amount)} · {refund.method}</Text><Text style={styles.activityDetail}>Factura {refund.invoiceId} · {refund.reason}</Text></View></View>)}</View>
    </>}
  </View>;
}

const remainingQuantity = (ordered: string, received: string): string => {
  const units = (value: string) => {
    const [whole = '0', fraction = ''] = value.split('.');
    return BigInt(whole) * 10_000n + BigInt(fraction.padEnd(4, '0'));
  };
  const remainder = units(ordered) - units(received);
  if (remainder <= 0n) return '0';
  const whole = remainder / 10_000n;
  const fraction = String(remainder % 10_000n).padStart(4, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
};
const isPositiveDecimalInput = (value: string) => /^\d+(\.\d{1,4})?$/.test(value.trim()) && /[1-9]/.test(value);

function OrdersManagement({ api, canOperate }: { api: ApiClient; canOperate: boolean }) {
  const [kind, setKind] = useState<'sales' | 'purchases'>('sales');
  const [salesOrders, setSalesOrders] = useState<Awaited<ReturnType<ApiClient['getSalesOrders']>>['items']>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Awaited<ReturnType<ApiClient['getPurchaseOrders']>>['items']>([]);
  const [shipments, setShipments] = useState<Awaited<ReturnType<ApiClient['getShipments']>>['items']>([]);
  const [customers, setCustomers] = useState<Awaited<ReturnType<ApiClient['getMasterData']>>['items']>([]);
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<ApiClient['getMasterData']>>['items']>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<ApiClient['getMasterData']>>['items']>([]);
  const [warehouses, setWarehouses] = useState<Awaited<ReturnType<ApiClient['getMasterData']>>['items']>([]);
  const [counterpartyId, setCounterpartyId] = useState('');
  const [orderLines, setOrderLines] = useState<Array<{ productId: string; quantity: string; unitPrice: string }>>([{ productId: '', quantity: '1', unitPrice: '' }]);
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, Record<string, string>>>({});
  const [orderCode, setOrderCode] = useState('');
  const [shipmentOrderId, setShipmentOrderId] = useState('');
  const [shipmentNumber, setShipmentNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [sales, purchases, shipmentResult, customersResult, suppliersResult, productsResult, warehousesResult] = await Promise.all([
        api.getSalesOrders({ page: 1, limit: 100 }), api.getPurchaseOrders({ page: 1, limit: 100 }),
        canOperate ? api.getShipments({ page: 1, limit: 100 }) : Promise.resolve({ items: [], total: 0 }),
        api.getMasterData('customers', { page: 1, limit: 100, active: true }), api.getMasterData('suppliers', { page: 1, limit: 100, active: true }),
        api.getMasterData('products', { page: 1, limit: 100, active: true }), api.getMasterData('warehouses', { page: 1, limit: 100, active: true }),
      ]);
      setSalesOrders(sales.items); setPurchaseOrders(purchases.items); setShipments(shipmentResult.items); setCustomers(customersResult.items); setSuppliers(suppliersResult.items); setProducts(productsResult.items); setWarehouses(warehousesResult.items);
      setReceiptQuantities(Object.fromEntries(purchases.items.map((order) => [order._id, Object.fromEntries(order.lines.map((line) => [line.productId, remainingQuantity(line.quantity, line.receivedQuantity)]))])));
      setCounterpartyId((current) => current || (kind === 'sales' ? customersResult.items[0]?._id : suppliersResult.items[0]?._id) || '');
      setOrderLines((current) => current.map((line, index) => index === 0 && !line.productId && productsResult.items[0]
        ? { ...line, productId: productsResult.items[0]._id, unitPrice: String(productsResult.items[0].salePrice ?? '') }
        : line));
      setWarehouseId((current) => current || warehousesResult.items[0]?._id || '');
    } catch (cause: unknown) {
      setError(cause instanceof ApiClientError ? cause.message : 'No se pudieron cargar órdenes y catálogos relacionados.');
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [api, canOperate]);
  useEffect(() => { setCounterpartyId(kind === 'sales' ? customers[0]?._id ?? '' : suppliers[0]?._id ?? ''); }, [kind, customers, suppliers]);

  const runAction = async (action: () => Promise<unknown>, message: string): Promise<boolean> => {
    setSaving(true); setError(''); setNotice('');
    try { await action(); setNotice(message); await load(); return true; }
    catch (cause: unknown) { setError(cause instanceof ApiClientError ? cause.message : 'No se pudo completar la operación.'); return false; }
    finally { setSaving(false); }
  };
  const createOrder = async () => {
    if (!orderCode.trim() || !counterpartyId || !orderLines.length || orderLines.some((line) => !line.productId || !/^\d+(\.\d{1,4})?$/.test(line.quantity.trim()) || Number(line.quantity) <= 0 || !/^\d+(\.\d{1,4})?$/.test(line.unitPrice.trim()) || Number(line.unitPrice) <= 0)) return;
    const lines = orderLines.map((line) => ({ productId: line.productId, quantity: line.quantity.trim(), unitPrice: line.unitPrice.trim() }));
    const created = await runAction(() => kind === 'sales'
      ? api.createSalesOrder({ code: orderCode.trim(), customerId: counterpartyId, lines })
      : api.createPurchaseOrder({ code: orderCode.trim(), supplierId: counterpartyId, lines }),
    kind === 'sales' ? 'Pedido de venta creado en borrador.' : 'Orden de compra creada en borrador.');
    if (created) { setOrderCode(''); setOrderLines([{ productId: products[0]?._id ?? '', quantity: '1', unitPrice: String(products[0]?.salePrice ?? '') }]); }
  };
  const updateOrderLine = (index: number, field: 'productId' | 'quantity' | 'unitPrice', value: string) => setOrderLines((current) => current.map((line, lineIndex) => lineIndex === index
    ? { ...line, [field]: value, ...(field === 'productId' ? { unitPrice: String(products.find((product) => product._id === value)?.salePrice ?? '') } : {}) }
    : line));
  const addOrderLine = () => {
    const product = products.find((item) => !orderLines.some((line) => line.productId === item._id));
    if (product) setOrderLines((current) => [...current, { productId: product._id, quantity: '1', unitPrice: String(product.salePrice ?? '') }]);
  };
  const eligibleShipmentOrders = salesOrders.filter((order) => order.status === 'CONFIRMED' && !shipments.some((shipment) => shipment.salesOrderId === order._id && shipment.status !== 'CANCELLED'));
  const createShipment = async () => {
    if (!shipmentOrderId || !shipmentNumber.trim() || !shippingAddress.trim()) return;
    const created = await runAction(() => api.createShipment({ salesOrderId: shipmentOrderId, number: shipmentNumber.trim(), shippingAddress: shippingAddress.trim(), ...(carrier.trim() ? { carrier: carrier.trim() } : {}), ...(trackingNumber.trim() ? { trackingNumber: trackingNumber.trim() } : {}) }), 'Envío creado; el pedido pasó a preparación.');
    if (created) { setShipmentNumber(''); setShippingAddress(''); setCarrier(''); setTrackingNumber(''); setShipmentOrderId(''); }
  };
  const labelOption = (item: Record<string, unknown>) => `${String(item.code ?? '').trim()} · ${String(item.name ?? '').trim()}`;
  const counterparties = kind === 'sales' ? customers : suppliers;

  return <View>
    <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Órdenes operativas</Text><Text style={styles.stateCopy}>Pedidos de venta y órdenes de compra, con sus estados</Text></View><ActionButton label={loading ? 'Actualizando…' : 'Actualizar'} secondary disabled={loading} onPress={() => void load()} /></View>
    <View style={styles.resourceTabs}><FilterButton label="Ventas" active={kind === 'sales'} onPress={() => setKind('sales')} /><FilterButton label="Compras" active={kind === 'purchases'} onPress={() => setKind('purchases')} /></View>
    {notice ? <Text style={styles.successMessage}>{notice}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
    {canOperate ? <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Nueva {kind === 'sales' ? 'venta' : 'compra'}</Text>
      <Text style={styles.inputLabel}>Código</Text><TextInput accessibilityLabel="Código de orden" style={styles.input} value={orderCode} onChangeText={setOrderCode} placeholder={kind === 'sales' ? 'VTA-0001' : 'COM-0001'} />
      <Text style={styles.inputLabel}>{kind === 'sales' ? 'Cliente' : 'Proveedor'}</Text><View style={styles.resourceTabs}>{counterparties.map((item) => <FilterButton key={item._id} label={labelOption(item)} active={counterpartyId === item._id} onPress={() => setCounterpartyId(item._id)} />)}</View>
      {orderLines.map((line, index) => <View key={`order-line-${index}`} style={[styles.formCard, { marginTop: 12, marginBottom: 4 }]}>
        <View style={styles.sectionHeader}><Text style={styles.activityLabel}>Partida {index + 1}</Text>{orderLines.length > 1 ? <ActionButton label="Quitar" secondary onPress={() => setOrderLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} /> : null}</View>
        <Text style={styles.inputLabel}>Producto</Text><View style={styles.resourceTabs}>{products.filter((item) => !orderLines.some((other, otherIndex) => otherIndex !== index && other.productId === item._id)).map((item) => <FilterButton key={item._id} label={labelOption(item)} active={line.productId === item._id} onPress={() => updateOrderLine(index, 'productId', item._id)} />)}</View>
        <View style={styles.toolbar}><View style={{ flexGrow: 1, minWidth: 110 }}><Text style={styles.inputLabel}>Cantidad</Text><TextInput accessibilityLabel={`Cantidad de partida ${index + 1}`} keyboardType="numeric" style={styles.input} value={line.quantity} onChangeText={(value) => updateOrderLine(index, 'quantity', value)} /></View><View style={{ flexGrow: 1, minWidth: 130 }}><Text style={styles.inputLabel}>Precio unitario</Text><TextInput accessibilityLabel={`Precio unitario de partida ${index + 1}`} keyboardType="numeric" style={styles.input} value={line.unitPrice} onChangeText={(value) => updateOrderLine(index, 'unitPrice', value)} /></View></View>
      </View>)}
      {orderLines.length < products.length ? <View style={styles.buttonRow}><ActionButton label="Agregar partida" secondary disabled={saving} onPress={addOrderLine} /></View> : null}
      <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Crear borrador'} disabled={saving || !orderCode.trim() || !counterpartyId || !orderLines.length || orderLines.some((line) => !line.productId || !/^\d+(\.\d{1,4})?$/.test(line.quantity.trim()) || Number(line.quantity) <= 0 || !/^\d+(\.\d{1,4})?$/.test(line.unitPrice.trim()) || Number(line.unitPrice) <= 0)} onPress={() => void createOrder()} /></View>
      <Text style={styles.activityDetail}>Las órdenes usan los precios y cantidades capturados. La confirmación de venta reserva inventario; la recepción de compra ingresa existencias.</Text>
    </View> : null}
    {kind === 'sales' ? <>
      {canOperate ? <View style={styles.formCard}><Text style={styles.sectionTitle}>Almacén para confirmar ventas</Text><View style={styles.resourceTabs}>{warehouses.map((item) => <FilterButton key={item._id} label={labelOption(item)} active={warehouseId === item._id} onPress={() => setWarehouseId(item._id)} />)}</View></View> : null}
      {loading ? <EmptyState message="Cargando pedidos de venta…" /> : salesOrders.length ? <View style={styles.activity}>{salesOrders.map((order) => <View key={order._id} style={styles.activityRow}>
        <View style={styles.userDetails}><Text style={styles.activityLabel}>{order.code} · {order.status}</Text><Text style={styles.activityDetail}>Cliente {order.customerId} · {order.lines.map((line) => `${line.quantity} × ${line.unitPrice}`).join(', ')} {order.currency}</Text></View>
        {canOperate && order.status === 'DRAFT' ? <ActionButton label="Confirmar" secondary disabled={saving || !warehouseId} onPress={() => void runAction(() => api.confirmSalesOrder(order._id, warehouseId), 'Venta confirmada; existencias reservadas.')} /> : null}
        {canOperate && (order.status === 'DRAFT' || order.status === 'CONFIRMED') ? <ActionButton label="Cancelar" secondary disabled={saving} onPress={() => void runAction(() => api.cancelSalesOrder(order._id), 'Venta cancelada.')} /> : null}
      </View>)}</View> : <EmptyState message="No hay pedidos de venta." />}
      {canOperate ? <View style={styles.formCard}><Text style={styles.sectionTitle}>Preparar envío</Text>
        <Text style={styles.inputLabel}>Pedido confirmado</Text><View style={styles.resourceTabs}>{eligibleShipmentOrders.map((order) => <FilterButton key={order._id} label={order.code} active={shipmentOrderId === order._id} onPress={() => setShipmentOrderId(order._id)} />)}</View>
        {!eligibleShipmentOrders.length ? <Text style={styles.activityDetail}>Confirma un pedido para habilitar su envío.</Text> : null}
        <Text style={styles.inputLabel}>Número de envío</Text><TextInput accessibilityLabel="Número de envío" style={styles.input} value={shipmentNumber} onChangeText={setShipmentNumber} />
        <Text style={styles.inputLabel}>Domicilio de entrega</Text><TextInput accessibilityLabel="Domicilio de entrega" style={styles.input} value={shippingAddress} onChangeText={setShippingAddress} />
        <View style={styles.toolbar}><View style={{ flexGrow: 1, minWidth: 160 }}><Text style={styles.inputLabel}>Transportista</Text><TextInput accessibilityLabel="Transportista" style={styles.input} value={carrier} onChangeText={setCarrier} /></View><View style={{ flexGrow: 1, minWidth: 160 }}><Text style={styles.inputLabel}>Guía</Text><TextInput accessibilityLabel="Número de guía" style={styles.input} value={trackingNumber} onChangeText={setTrackingNumber} /></View></View>
        <View style={styles.buttonRow}><ActionButton label={saving ? 'Guardando…' : 'Crear envío'} disabled={saving || !shipmentOrderId || !shipmentNumber.trim() || !shippingAddress.trim()} onPress={() => void createShipment()} /></View>
      </View> : null}
      {canOperate && shipments.length ? <><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Seguimiento de envíos</Text></View><View style={styles.activity}>{shipments.map((shipment) => <View key={shipment._id} style={styles.activityRow}>
        <View style={styles.userDetails}><Text style={styles.activityLabel}>{shipment.number} · {shipment.status}</Text><Text style={styles.activityDetail}>Pedido {salesOrders.find((order) => order._id === shipment.salesOrderId)?.code ?? shipment.salesOrderId} · {shipment.carrier ?? 'Sin transportista'} · Guía {shipment.trackingNumber ?? '—'}</Text></View>
        {shipment.status === 'PENDING' || shipment.status === 'PREPARING' ? <ActionButton label="Despachar" secondary disabled={saving} onPress={() => void runAction(() => api.dispatchShipment(shipment._id), 'Envío despachado y existencia descontada.')} /> : null}
        {shipment.status === 'PENDING' || shipment.status === 'PREPARING' ? <ActionButton label="Cancelar envío" secondary disabled={saving} onPress={() => void runAction(() => api.cancelShipment(shipment._id), 'Envío cancelado y reservas liberadas.')} /> : null}
        {shipment.status === 'SHIPPED' || shipment.status === 'IN_TRANSIT' ? <ActionButton label="Marcar entregado" secondary disabled={saving} onPress={() => void runAction(() => api.deliverShipment(shipment._id), 'Entrega registrada y pedido completado.')} /> : null}
      </View>)}</View></> : null}
    </> : <>
      {canOperate ? <View style={styles.formCard}><Text style={styles.sectionTitle}>Almacén de recepción</Text><View style={styles.resourceTabs}>{warehouses.map((item) => <FilterButton key={item._id} label={labelOption(item)} active={warehouseId === item._id} onPress={() => setWarehouseId(item._id)} />)}</View></View> : null}
      {loading ? <EmptyState message="Cargando órdenes de compra…" /> : purchaseOrders.length ? <View style={styles.activity}>{purchaseOrders.map((order) => {
        const outstanding = order.lines.map((line) => ({ productId: line.productId, quantity: remainingQuantity(line.quantity, line.receivedQuantity) })).filter((line) => line.quantity !== '0');
        const quantities = outstanding.map((line) => receiptQuantities[order._id]?.[line.productId] ?? line.quantity).filter((value) => value.trim());
        const validReceipt = quantities.length > 0 && quantities.every(isPositiveDecimalInput);
        return <View key={order._id} style={styles.activityRow}>
          <View style={styles.userDetails}><Text style={styles.activityLabel}>{order.code} · {order.status}</Text><Text style={styles.activityDetail}>Proveedor {order.supplierId} · {order.lines.map((line) => `solicitado ${line.quantity}, recibido ${line.receivedQuantity}`).join('; ')} · ${order.currency}</Text>
            {canOperate && (order.status === 'SENT' || order.status === 'PARTIALLY_RECEIVED') ? outstanding.map((line) => <View key={line.productId} style={styles.toolbar}><Text style={[styles.activityDetail, { flex: 1 }]}>{String(products.find((item) => item._id === line.productId)?.name ?? line.productId)} · pendiente {line.quantity}</Text><TextInput accessibilityLabel={`Cantidad recibida ${line.productId}`} keyboardType="numeric" style={[styles.input, { minWidth: 100 }]} value={receiptQuantities[order._id]?.[line.productId] ?? line.quantity} onChangeText={(value) => setReceiptQuantities((current) => ({ ...current, [order._id]: { ...current[order._id], [line.productId]: value } }))} /></View>) : null}
          </View>
          {canOperate && order.status === 'DRAFT' ? <ActionButton label="Marcar enviada" secondary disabled={saving} onPress={() => void runAction(() => api.sendPurchaseOrder(order._id), 'Orden marcada como enviada al proveedor.')} /> : null}
          {canOperate && (order.status === 'SENT' || order.status === 'PARTIALLY_RECEIVED') ? <ActionButton label="Registrar recepción" secondary disabled={saving || !warehouseId || !validReceipt} onPress={() => void runAction(() => api.receivePurchaseOrder(order._id, { warehouseId, lines: outstanding.map((line) => ({ productId: line.productId, quantity: receiptQuantities[order._id]?.[line.productId] ?? line.quantity })).filter((line) => isPositiveDecimalInput(line.quantity)) }), 'Recepción aplicada al inventario.')} /> : null}
        </View>;
      })}</View> : <EmptyState message="No hay órdenes de compra." />}
    </>}
  </View>;
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
  navigation: { gap: 8 }, navigationButton: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8 }, navigationButtonActive: { backgroundColor: '#21445f' }, navigationButtonText: { color: '#b8cbd5', fontSize: 14, fontWeight: '600' }, navigationButtonTextActive: { color: '#fff' },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }, searchInput: { flexGrow: 1, minWidth: 220 }, filterGroup: { flexDirection: 'row', gap: 4 }, resourceTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }, filterButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 7 }, filterButtonActive: { backgroundColor: '#dcecf0' }, filterButtonText: { color: '#527080', fontSize: 12, fontWeight: '700' }, filterButtonTextActive: { color: '#143b51' }, formCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20, borderWidth: 1, borderColor: '#e1e9ed', marginBottom: 18 }, successMessage: { color: '#18754f', backgroundColor: '#e5f5ed', padding: 12, borderRadius: 8, marginBottom: 12 }, userRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#edf1f3', flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }, userDetails: { flexGrow: 1, minWidth: 180 }, statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, fontSize: 11, fontWeight: '800' }, statusActive: { color: '#18754f', backgroundColor: '#e5f5ed' }, statusInactive: { color: '#8c4750', backgroundColor: '#f9e8ea' }, pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 16 }, masterHeader: { flexDirection: 'row', gap: 8, padding: 14, backgroundColor: '#f6f9fa' }, masterRow: { flexDirection: 'row', gap: 8, padding: 14, borderTopWidth: 1, borderTopColor: '#edf1f3' }, masterCell: { flex: 1, minWidth: 70 },
  safe: { flex: 1, backgroundColor: '#f3f6f8' }, shell: { flex: 1, flexDirection: 'row' }, sidebar: { width: 238, backgroundColor: '#102a43', padding: 28, minHeight: '100%' }, brand: { color: '#f7fbfc', fontSize: 22, fontWeight: '800', letterSpacing: 2 }, caption: { color: '#8faabd', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginTop: 8, marginBottom: 28 }, sidebarBottom: { marginTop: 'auto' }, user: { color: '#f7fbfc', fontSize: 14, fontWeight: '600' },
  content: { padding: 38, maxWidth: 1180, width: '100%', alignSelf: 'center' }, topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 }, eyebrow: { color: '#66808f', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }, title: { color: '#102a43', fontSize: 34, fontWeight: '800', marginTop: 6 }, hero: { backgroundColor: '#dcecf0', borderRadius: 12, padding: 27, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, gap: 15 }, heroTitle: { color: '#143b51', fontSize: 22, fontWeight: '800' }, heroText: { color: '#527080', marginTop: 6, fontSize: 14 }, heroDate: { color: '#527080', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 34 }, metric: { backgroundColor: '#fff', borderRadius: 10, padding: 20, flexGrow: 1, flexBasis: 180, minHeight: 122, borderWidth: 1, borderColor: '#e1e9ed' }, metricLabel: { color: '#66808f', fontSize: 12, fontWeight: '700' }, metricValue: { color: '#102a43', fontSize: 27, fontWeight: '800', marginTop: 13 }, metricDetail: { color: '#2aa876', fontSize: 12, marginTop: 7, fontWeight: '700' }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { color: '#102a43', fontSize: 18, fontWeight: '800' }, activity: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e1e9ed' }, activityRow: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#edf1f3', flexDirection: 'row', alignItems: 'center', gap: 18 }, activityLabel: { color: '#173b52', fontSize: 14, fontWeight: '700' }, activityDetail: { color: '#78909c', fontSize: 12, marginTop: 4 }, activityStatus: { marginLeft: 'auto', color: '#2a8a70', textAlign: 'right', fontSize: 12, fontWeight: '700' },
  loginShell: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, loginCard: { width: '100%', maxWidth: 460, backgroundColor: '#fff', borderRadius: 16, padding: 32, borderWidth: 1, borderColor: '#e1e9ed' }, loginTitle: { color: '#102a43', fontSize: 25, fontWeight: '800', marginTop: 26 }, loginCopy: { color: '#66808f', lineHeight: 21, marginTop: 8, marginBottom: 24 }, inputLabel: { color: '#173b52', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 12 }, input: { borderWidth: 1, borderColor: '#d5e0e5', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 12, color: '#102a43', backgroundColor: '#fff' }, primaryButton: { backgroundColor: '#167d9a', paddingHorizontal: 17, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 }, secondaryButton: { borderWidth: 1, borderColor: '#cbd9df', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, secondaryButtonText: { color: '#245269', fontWeight: '700', fontSize: 13 }, disabledButton: { opacity: 0.5 }, loginHint: { color: '#78909c', fontSize: 11, marginTop: 18, lineHeight: 17 }, error: { color: '#a12e35', marginTop: 12, fontSize: 13 }, inlineError: { color: '#a12e35', marginBottom: 15 }, centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, stateCopy: { color: '#66808f', lineHeight: 21, textAlign: 'center', marginTop: 8 }, buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 18 }, empty: { backgroundColor: '#fff', borderRadius: 10, padding: 28, borderWidth: 1, borderColor: '#e1e9ed', alignItems: 'center', marginBottom: 22 },
});
