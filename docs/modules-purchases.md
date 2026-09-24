# Compras

## Solicitudes y aprobación

- `POST /api/v1/purchase-requests`: crea una solicitud con productos activos de la organización del usuario.
- `POST /api/v1/purchase-requests/:id/submit`: el solicitante envía su solicitud `DRAFT` a revisión.
- `POST /api/v1/purchase-requests/:id/review`: un usuario con `purchase-requests.approve` la aprueba o rechaza; puede incluir una nota.

Las transiciones válidas son `DRAFT → SUBMITTED → APPROVED|REJECTED`. Las transiciones y la auditoría se guardan en una transacción. Solo el creador puede enviar la solicitud; la revisión requiere permiso separado.

Una orden vinculada a una solicitud requiere que esta pertenezca a la misma organización y esté `APPROVED`. El proveedor y todos los productos también deben ser activos y del tenant actual. Los productos deben estar presentes en la solicitud y las cantidades por línea no pueden exceder las cantidades aprobadas.

## Recepción de órdenes

`POST /api/v1/purchase-orders/:id/receipts` registra una recepción parcial o total. Requiere autenticación y el permiso `purchase-orders.receive`.

```json
{
  "warehouseId": "<warehouse-id>",
  "lines": [
    { "productId": "<product-id>", "quantity": "2" }
  ]
}
```

El almacén, la orden y los productos se consultan con el `organizationId` del token. La operación valida que la orden esté enviada o parcialmente recibida, que cada producto pertenezca a la orden, que el almacén y productos estén activos y que la cantidad acumulada no exceda la orden.

En una transacción de MongoDB se actualizan las cantidades recibidas, el estado de la orden, los balances de inventario, los movimientos `PURCHASE` y el registro de auditoría. Las cantidades se calculan con decimales de precisión fija. Las órdenes con productos duplicados no se reciben porque no se puede determinar con seguridad a qué línea corresponde la cantidad.

## Estados

- `SENT`: orden enviada, aún sin recepción.
- `PARTIALLY_RECEIVED`: recepción incompleta.
- `RECEIVED`: todas las líneas alcanzaron la cantidad ordenada.

La facturación del proveedor, cuentas por pagar y asientos contables requieren reglas de negocio y siguen pendientes.

## Verificación

Las pruebas unitarias cubren suma decimal, acumulación parcial, exceso de cantidad, productos ajenos y líneas duplicadas. La transacción completa requiere una prueba de integración contra la base de desarrollo replica set configurada para Atlas.
