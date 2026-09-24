# Logística y envíos

## Ciclo de envío

- `POST /api/v1/shipments`: crea un envío para un pedido `CONFIRMED` que ya tiene almacén y stock reservado. El pedido cambia a `PREPARING` y el envío inicia en `PENDING`.
- `POST /api/v1/shipments/:id/dispatch`: despacha un envío pendiente. En una transacción reduce la existencia física y la reserva, registra un movimiento `SALE`, cambia pedido y envío a `SHIPPED` y escribe auditoría.
- `POST /api/v1/shipments/:id/cancel`: cancela únicamente un envío aún no despachado, libera las reservas y cancela el pedido en una transacción.
- `POST /api/v1/shipments/:id/deliver`: marca como entregado un envío `SHIPPED` o `IN_TRANSIT` y completa su pedido.

Todas las operaciones consultan envío, pedido e inventario con el tenant del token. Los endpoints requieren los permisos `shipments.create`, `shipments.dispatch`, `shipments.cancel` y `shipments.deliver`.

El modelo actual permite un envío completo por pedido. Envíos parciales, guías del transportista, webhooks externos y reintentos idempotentes requieren una fase posterior.

## Verificación

Las pruebas unitarias cubren disponibilidad y balance exacto al despachar, autenticación y estados entregables. La persistencia transaccional necesita pruebas de integración contra MongoDB Atlas de desarrollo.
