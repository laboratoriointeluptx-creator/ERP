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
- Facturas, pagos y asientos balanceados como modelos base.
- Workflows configurables y ejecuciones iniciales.
- Branches tenant-scoped, request IDs, readiness y servicio de auditoria sanitizada.
- Modelos iniciales de categories y units.
- Cliente API y tipos compartidos.
- Dashboard web y pantalla mobile inicial.
- CI con typecheck, tests, build y audit para API/web.

## Validacion mas reciente

- Typecheck de API, web, mobile y paquetes compartidos: PASS.
- Tests backend: PASS (19 suites, 30 tests).
- Build API y web: PASS.
- Riesgo pendiente: vulnerabilidades transitivas del tooling Expo/Metro documentadas en `docs/frontend.md`.

## Pendiente

- Publicar `main` en GitHub: el commit local existe, pero el cliente Git no tiene credenciales de shell configuradas.
- Completar reglas de negocio de compras, ventas, facturacion y contabilidad.
- Reservas, envios y cuentas por cobrar/pagar.
- Frontend conectado a APIs reales con loading/error/empty states.
- E2E, rate limiting, password recovery, MFA, OpenAPI, reportes, integraciones, manufactura y QA final.
