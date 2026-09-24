import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

const cards = [
  ['Ventas del mes', '$128,450', '+12.4%'],
  ['Por cobrar', '$42,800', '18 documentos'],
  ['Inventario', '1,284', '96% disponible'],
  ['Pendientes', '24', '7 requieren atención'],
];

export default function App() {
  const [selected, setSelected] = useState('Resumen');
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View><Text style={styles.kicker}>NEXO ERP</Text><Text style={styles.title}>{selected}</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>AD</Text></View>
        </View>
        <View style={styles.hero}><Text style={styles.heroTitle}>Buenos días, Admin</Text><Text style={styles.heroText}>Resumen de tu operación</Text></View>
        <View style={styles.grid}>{cards.map(([label, value, detail]) => <View key={label} style={styles.card}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text><Text style={styles.detail}>{detail}</Text></View>)}</View>
        <Text style={styles.sectionTitle}>Módulos</Text>
        <View style={styles.modules}>{['Ventas', 'Compras', 'Inventario', 'Finanzas'].map((module) => <Pressable key={module} onPress={() => setSelected(module)} style={styles.module}><Text style={styles.moduleText}>{module}</Text><Text style={styles.arrow}>›</Text></Pressable>)}</View>
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <View style={styles.activity}><Text style={styles.activityTitle}>Pedido SO-1048</Text><Text style={styles.activityMeta}>Cliente Industrial Norte · $18,420</Text><Text style={styles.activityStatus}>Confirmado</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f6f8' }, container: { padding: 22, paddingTop: 38 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }, kicker: { color: '#167d9a', fontSize: 12, fontWeight: '800', letterSpacing: 2 }, title: { color: '#102a43', fontSize: 30, fontWeight: '800', marginTop: 5 }, avatar: { backgroundColor: '#dcecf0', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#143b51', fontWeight: '800' }, hero: { backgroundColor: '#102a43', borderRadius: 14, padding: 22, marginBottom: 18 }, heroTitle: { color: '#fff', fontSize: 21, fontWeight: '800' }, heroText: { color: '#b7c9d3', marginTop: 7 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 26 }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexBasis: '48%', flexGrow: 1, minHeight: 105 }, label: { color: '#66808f', fontSize: 12, fontWeight: '700' }, value: { color: '#102a43', fontSize: 22, fontWeight: '800', marginTop: 13 }, detail: { color: '#2a8a70', fontSize: 11, marginTop: 6, fontWeight: '700' }, sectionTitle: { color: '#102a43', fontSize: 18, fontWeight: '800', marginBottom: 12 }, modules: { gap: 9, marginBottom: 27 }, module: { backgroundColor: '#fff', borderRadius: 10, padding: 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, moduleText: { color: '#173b52', fontWeight: '700' }, arrow: { color: '#167d9a', fontSize: 24 }, activity: { backgroundColor: '#fff', borderRadius: 10, padding: 17 }, activityTitle: { color: '#173b52', fontWeight: '800' }, activityMeta: { color: '#78909c', marginTop: 6, fontSize: 12 }, activityStatus: { color: '#2a8a70', marginTop: 10, fontSize: 12, fontWeight: '700' },
});
