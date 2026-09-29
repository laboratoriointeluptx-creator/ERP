# Progreso QA

## Estado actual

- Repositorio local asociado a `laboratoriointeluptx-creator/ERP` en la rama `main`.
- Monolito modular TypeScript con API Express y Mongoose.
- Frontend web con React Native Web y frontend mobile con Expo/React Native.

## Completado

- Diagnostico y arquitectura inicial.
- Configuracion segura y variables de entorno.
- MongoDB Atlas/Mongoose y health checks.
- Organizations, autenticacion JWT, sesiones, refresh y logout.
- RBAC inicial y aislamiento por organizacion.
- Customers, suppliers, products e inventario con movimientos.
- Purchase requests, purchase orders y sales orders.
- Recepciones parciales de órdenes de compra con actualización transaccional de inventario, movimientos y auditoría.
- Gestión tenant-scoped de almacenes, con paginación y asociación validada a sucursales.
- Consulta paginada de saldos e historial de movimientos de inventario con filtros tenant-scoped.
- Envío y aprobación/rechazo auditados de solicitudes de compra; órdenes vinculadas validadas contra solicitudes aprobadas.
- Creación tenant-scoped de pedidos de venta y confirmación transaccional con reserva de existencias.
- Cancelación segura de pedidos previos al despacho; creación, cancelación y despacho transaccional de envíos con movimientos de salida.
- Emisión de facturas desde pedidos completados, registro transaccional de pagos con límite de saldo, consultas paginadas de cuentas por cobrar y registro/seguimiento de cuentas por pagar enlazadas a órdenes.
- Facturas y pagos integrados en API con RBAC e aislamiento por organización.
- Asientos balanceados como modelo base.
- Workflows configurables y ejecuciones iniciales.
- Branches tenant-scoped, request IDs, readiness y servicio de auditoria sanitizada.
- Modelos iniciales de categories y units.
- Cliente API y tipos compartidos.
- Dashboard web conectado a autenticación y métricas tenant-scoped por permisos; pantalla mobile sigue siendo prototipo.
- Salidas manuales de inventario respetan existencias reservadas; movimientos manuales auditados y limitados a ajustes/daños.
- Asientos contables validan cuentas activas dentro de la organización y se guardan con auditoría transaccional.
- Login limitado a ocho intentos por organización/correo en 15 minutos con contadores compartidos en MongoDB; CORS configurado por orígenes permitidos.
- Roadmap documentado por fases y madurez de módulos; administración tenant-scoped de usuarios en API/web con alta básica, búsqueda, filtros, paginación, desactivación, revocación de refresh sessions y auditoría.
- Web con catálogo inicial para consultar, buscar, paginar y crear clientes, proveedores, productos, sucursales, almacenes, categorías y unidades mediante contratos API compartidos.
- Los siete catálogos de datos maestros con edición parcial tenant-scoped, control de permisos, auditoría transaccional y filtros de activos/inactivos; interfaz web para alta, edición, desactivación y reactivación. Evita desactivar sucursales con almacenes activos y categorías con subcategorías activas.
- Selectores de referencias activas para asignar sucursal a almacén y categoría padre desde la web.
- Inventario conectado en la web: consulta paginada de saldos e historial, ajustes con dirección y motivo obligatorio y registro de daños; backend comprueba disponibilidad reservada y audita los movimientos.
- Transferencias entre almacenes con validación de origen/destino/producto tenant-scoped, saldo disponible, actualización transaccional de ambos almacenes, historial doble, registro paginado y auditoría; interfaz conectada para crearlas y consultarlas.
- Conteos cíclicos: instantánea esperada por almacén, captura de conteos físicos, rechazo de sesiones obsoletas o incompletas, protección de cantidades reservadas, aplicación transaccional de variaciones y auditoría; interfaz para abrir, capturar y cerrar conteos.
- Devoluciones para ventas despachadas y compras recibidas con consultas de pedidos elegibles, límites acumulados, almacén origen, saldo no reservado para devoluciones a proveedor, movimientos y auditoría; formularios e historial integrados en web.
- Notas de crédito tenant-scoped ligadas a devoluciones de venta e invoices, límites acumulados por producto, importes calculados con precios facturados, auditoría y ajuste de saldo por cobrar.
- Reembolsos de clientes asociados a pagos y notas de crédito con límites por saldo a favor, bloqueo transaccional por revisión financiera y auditoría; pantalla web conectada a facturas, notas y reembolsos.
- Pantalla inicial de ventas y compras: órdenes paginadas; creación de borradores; confirmación/cancelación de venta y reserva; preparación, despacho, cancelación y entrega de envíos; envío auditado y recepción de compras.
- API ampliada con consultas paginadas para pedidos de venta, órdenes de compra y envíos; transición explícita auditada `DRAFT → SENT` para órdenes de compra.
- CI con typecheck, tests, build y audit para API/web.

## Validacion mas reciente

- Typecheck de API, web, mobile y paquetes compartidos: PASS.
- Tests backend: PASS (22 suites, 51 tests).
- Build API y web: PASS.
- Riesgo pendiente: vulnerabilidades transitivas del tooling Expo/Metro documentadas en `docs/frontend.md`.

## Pendiente

- Completar reglas de negocio de compras, ventas, facturación fiscal y contabilidad; cuentas por cobrar/pagar tienen flujo operativo inicial.
- Contabilidad automática desde operaciones, conciliación de pagos y flujos E2E.
- Compras/ventas web ya admite órdenes multi-línea y recepción parcial por producto; faltan edición/cancelación de órdenes y facturación desde pedidos completados. Mobile sigue siendo prototipo.
- Límite de intentos por IP, password recovery, MFA, OpenAPI, reportes, integraciones, ejecución real de workflows, manufactura y QA final.
