# Fases y módulos del ERP Universal

Este documento define el alcance de producto que se puede respaldar con el repositorio actual y separa módulos implementados de prototipos. Una fase solo se considera terminada cuando sus reglas, permisos, API, interfaz y validaciones esenciales están integrados.

## Estado por módulo

| Área | Estado | Alcance que falta para cerrar |
| --- | --- | --- |
| Plataforma, organizaciones y despliegue | Base implementada | Configuración de producción, migraciones/versionado de índices, monitoreo y respaldo/recuperación. |
| Usuarios, autenticación y permisos | Parcial | API y pantalla inicial de alta/listado/baja lógica con rol básico; faltan invitaciones/cambio de contraseña, roles configurables y permisos por sucursal. Recuperación y MFA son posteriores. |
| Datos maestros | Parcial | API/web permite listar, crear, editar, desactivar y reactivar los siete catálogos con permisos y auditoría transaccional. Selectores de sucursal y categoría padre listan referencias activas. Falta importación/exportación y validación visual fina por permisos. |
| Inventario y almacenes | Parcial | Web/API para saldos, historial, ajustes, transferencias atómicas, conteos cíclicos y devoluciones ligadas a pedidos. Falta costeo, reportes y reglas de cuarentena para artículos devueltos dañados. |
| Compras | Flujo inicial web/API | Consulta y creación multi-línea, transición auditada a enviada y recepción parcial transaccional conectadas. Falta edición/cancelación, discrepancias y aprobaciones configurables. |
| Ventas y logística | Flujo inicial web/API | Consulta/creación multi-línea, reserva/cancelación, preparación de envío, despacho y entrega conectados. Falta cotización, envíos parciales y excepciones posteriores al despacho. |
| CRM | API inicial | CRUD de contactos/cuentas y actividades, embudo configurable, conversión de prospecto a cliente y pantallas. |
| Finanzas | Cuentas por cobrar/pagar iniciales | API y UI para consultar facturas, acreditar devoluciones de venta y emitir reembolsos ligados a pagos/notas. Faltan conciliación, vencimientos, reportes y permisos UI granulares. |
| Contabilidad | Asientos balanceados iniciales | Plan de cuentas y periodos, validación contable completa, pólizas automáticas, reversas, cierres y reportes financieros. |
| Fiscal México | Pendiente | Impuestos configurables, CFDI, cancelaciones/sustituciones y validación conforme a reglas fiscales vigentes. |
| Manufactura | Modelos/servicios iniciales | Rutas API, BOM completa, planeación, consumo/merma, producción y actualización transaccional del inventario. |
| Automatización | Ejecución prototipo | Administración de workflows, evaluación de condiciones, ejecución de acciones, aprobaciones y reintentos. |
| Auditoría y reportes | Auditoría interna inicial | Consulta/exportación protegida de auditoría, reportes operativos y financieros, retención y trazabilidad. |
| Web | Dashboard conectado | Navegación por módulos, formularios CRUD, tablas/filtros y pantallas de operación con permisos. |
| Mobile | Prototipo | Inicio de sesión conectado, almacenamiento seguro, sincronización y flujos prioritarios en campo. |
| Calidad y operación | Parcial | Pruebas de integración/E2E, límites de abuso por IP, OpenAPI, accesibilidad, observabilidad y procedimiento de incidentes. |

## Orden de fases

### Fase 0 — Base técnica y multiempresa (completada)

Monorepo, API versionada, MongoDB, organizaciones, autenticación base, tenant scoping, RBAC inicial, CI y configuración de entorno.

### Fase 1 — Controles de integridad y acceso (parcial)

Reservas de inventario, cuentas contables tenant-scoped, auditoría de operaciones críticas, CORS por origen y protección de inicio de sesión están en el repositorio. Pendiente: límite por IP compartido, pruebas de concurrencia y revisión integral de controles.

### Fase 2 — Administración y datos maestros (parcial)

API inicial de usuarios y CRUD web/API con auditoría para sucursales, almacenes, clientes, proveedores, productos y catálogos. Pendiente: edición completa de preferencias de organización, roles configurables, validación UX, importación y cobertura de paginación.

### Fase 3 — Operación de inventario, compras y ventas (parcial)

Inventario cuenta con ajustes con causa, transferencias atómicas, conteos y devoluciones. Ventas tiene flujo web multi-línea desde pedido hasta entrega; compras cubre órdenes multi-línea y recepción parcial. Faltan edición/cancelación y reglas para discrepancias y excepciones.

### Fase 4 — CRM y atención comercial

Embudo, contactos, actividades, historial y conversión de prospectos vinculada a clientes y ventas.

### Fase 5 — Finanzas, contabilidad y fiscal (parcial)

Facturas/pagos iniciales, notas de crédito y reembolsos relacionados ya tienen API; la web permite operar esos flujos básicos. Pendiente: plan de cuentas operativo, pólizas automáticas, impuestos por configuración, conciliación, vencimientos, cierres e integración fiscal revisada.

### Fase 6 — Manufactura y automatización

Completar los módulos scaffold con ejecución transaccional y estados verificables; ningún workflow debe reportarse como ejecutado si sus acciones no terminaron.

### Fase 7 — Clientes, calidad y operación

Completar navegación y formularios web, conectar mobile según necesidades, incorporar E2E, OpenAPI, reportes, monitoreo, seguridad y recuperación operativa.

## Criterios para declarar una fase terminada

- Contratos API validados, permisos explícitos y consultas aisladas por organización.
- Operaciones de varias entidades protegidas por transacciones e idempotencia cuando corresponda.
- Auditoría para cambios financieros, inventario, permisos y estados operativos críticos.
- Interfaz de operación conectada a la API; el dashboard por sí solo no cierra un módulo.
- Validación automatizada del módulo y documentación de uso y límites.
