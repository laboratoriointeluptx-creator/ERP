import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const metrics = [
  { label: 'Ventas del mes', value: '$128,450', detail: '+12.4%', tone: 'positive' },
  { label: 'Cuentas por cobrar', value: '$42,800', detail: '18 documentos', tone: 'neutral' },
  { label: 'Inventario', value: '1,284', detail: '96% disponible', tone: 'positive' },
  { label: 'Pendientes', value: '24', detail: '7 requieren atención', tone: 'warning' },
] as const;

export function App() {
  const [active, setActive] = useState('Resumen');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.sidebar}>
          <Text style={styles.brand}>NEXO ERP</Text>
          <Text style={styles.caption}>LABORATORIO DEMO</Text>
          {['Resumen', 'Ventas', 'Compras', 'Inventario', 'Finanzas'].map((item) => (
            <Pressable key={item} onPress={() => setActive(item)} style={[styles.navItem, active === item && styles.navActive]}>
              <Text style={[styles.navText, active === item && styles.navTextActive]}>{item}</Text>
            </Pressable>
          ))}
          <View style={styles.sidebarBottom}>
            <Text style={styles.caption}>USUARIO</Text>
            <Text style={styles.user}>Admin Demo</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topbar}>
            <View>
              <Text style={styles.eyebrow}>OPERACIONES / {active.toUpperCase()}</Text>
              <Text style={styles.title}>{active}</Text>
            </View>
            <View style={styles.status}><View style={styles.dot} /><Text style={styles.statusText}>Sistema operativo</Text></View>
          </View>
          <View style={styles.hero}>
            <View><Text style={styles.heroTitle}>Buenos días, Admin</Text><Text style={styles.heroText}>Aquí tienes el pulso de tu operación hoy.</Text></View>
            <Text style={styles.heroDate}>23 SEP 2026</Text>
          </View>
          <View style={styles.metricGrid}>
            {metrics.map((metric) => <View key={metric.label} style={styles.metric}><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricValue}>{metric.value}</Text><Text style={[styles.metricDetail, metric.tone === 'warning' && styles.warning]}>{metric.detail}</Text></View>)}
          </View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Actividad reciente</Text><Pressable><Text style={styles.link}>Ver todo</Text></Pressable></View>
          <View style={styles.activity}><Activity label="Pedido SO-1048" detail="Cliente Industrial Norte" value="$18,420" status="Confirmado" /><Activity label="Orden PO-0231" detail="Suministros del Centro" value="$7,850" status="En recepción" /><Activity label="Factura INV-0892" detail="Servicios Atlas" value="$12,600" status="Por cobrar" /></View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Activity({ label, detail, value, status }: { label: string; detail: string; value: string; status: string }) {
  return <View style={styles.activityRow}><View><Text style={styles.activityLabel}>{label}</Text><Text style={styles.activityDetail}>{detail}</Text></View><Text style={styles.activityValue}>{value}</Text><Text style={styles.activityStatus}>{status}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f6f8' }, shell: { flex: 1, flexDirection: 'row' }, sidebar: { width: 238, backgroundColor: '#102a43', padding: 28, minHeight: '100%' }, brand: { color: '#f7fbfc', fontSize: 22, fontWeight: '800', letterSpacing: 2 }, caption: { color: '#8faabd', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginTop: 8, marginBottom: 28 }, navItem: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: 8, marginBottom: 5 }, navActive: { backgroundColor: '#1f4e6b' }, navText: { color: '#b7c9d3', fontSize: 15 }, navTextActive: { color: '#fff', fontWeight: '700' }, sidebarBottom: { marginTop: 'auto' }, user: { color: '#f7fbfc', fontSize: 14, fontWeight: '600' }, content: { padding: 38, maxWidth: 1180, width: '100%', alignSelf: 'center' }, topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }, eyebrow: { color: '#66808f', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }, title: { color: '#102a43', fontSize: 34, fontWeight: '800', marginTop: 6 }, status: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2aa876' }, statusText: { color: '#527080', fontSize: 13 }, hero: { backgroundColor: '#dcecf0', borderRadius: 12, padding: 27, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, heroTitle: { color: '#143b51', fontSize: 22, fontWeight: '800' }, heroText: { color: '#527080', marginTop: 6, fontSize: 14 }, heroDate: { color: '#527080', fontSize: 12, fontWeight: '800', letterSpacing: 1 }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 34 }, metric: { backgroundColor: '#fff', borderRadius: 10, padding: 20, flexGrow: 1, flexBasis: 180, minHeight: 122, borderWidth: 1, borderColor: '#e1e9ed' }, metricLabel: { color: '#66808f', fontSize: 12, fontWeight: '700' }, metricValue: { color: '#102a43', fontSize: 27, fontWeight: '800', marginTop: 13 }, metricDetail: { color: '#2aa876', fontSize: 12, marginTop: 7, fontWeight: '700' }, warning: { color: '#c4772d' }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { color: '#102a43', fontSize: 18, fontWeight: '800' }, link: { color: '#167d9a', fontSize: 13, fontWeight: '700' }, activity: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e1e9ed' }, activityRow: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#edf1f3', flexDirection: 'row', alignItems: 'center', gap: 18 }, activityLabel: { color: '#173b52', fontSize: 14, fontWeight: '700' }, activityDetail: { color: '#78909c', fontSize: 12, marginTop: 4 }, activityValue: { marginLeft: 'auto', color: '#173b52', fontWeight: '700' }, activityStatus: { color: '#2a8a70', width: 100, textAlign: 'right', fontSize: 12, fontWeight: '700' },
});
