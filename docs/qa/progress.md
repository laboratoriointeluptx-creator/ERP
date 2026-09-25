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
- CI con typecheck, tests, build y audit para API/web.

## Validacion mas reciente

- Typecheck de API, web, mobile y paquetes compartidos: PASS.
- Tests backend: PASS (22 suites, 51 tests).
- Build API y web: PASS.
- Riesgo pendiente: vulnerabilidades transitivas del tooling Expo/Metro documentadas en `docs/frontend.md`.

## Pendiente

- Completar reglas de negocio de compras, ventas, facturación fiscal y contabilidad; cuentas por cobrar/pagar tienen flujo operativo inicial.
- Contabilidad automática desde operaciones, conciliación de pagos y flujos E2E.
- Frontend web conectado en el dashboard; faltan pantallas CRUD y conexión de la app mobile a APIs reales.
- E2E, rate limiting, password recovery, MFA, OpenAPI, reportes, integraciones, manufactura y QA final.
