# Catalogos e inventario

## Catalogos

Customers, suppliers y products usan `organizationId`, codigos/SKU unicos por tenant, validacion Zod, paginacion limitada y permisos RBAC.

Categories soporta jerarquia mediante `parentId`; units define precision decimal por organizacion. Los modelos mantienen indices por tenant y codigo para evitar colisiones entre empresas.

Los precios y cantidades se almacenan como strings decimales con precision controlada para evitar errores de floating point. La politica fiscal y los redondeos finales requieren reglas de negocio oficiales.

## Inventario

La base de inventario separa:

- `warehouses`: almacenes por organizacion.
- `inventory`: saldo actual por almacen y producto.
- `inventory_movements`: historial inmutable de operaciones.

Los movimientos soportan compra, venta, devolucion, transferencia, ajuste, produccion, consumo y daño. La aplicación de ajustes valida producto y almacén dentro del tenant, actualiza el balance y registra el movimiento en una transacción.

`GET /api/v1/inventory` lista saldos por organización, con filtros opcionales `warehouseId` y `productId`. `GET /api/v1/inventory/movements` lista el historial con filtros por almacén, producto y tipo. Ambas rutas requieren `inventory.read`, validan paginación limitada y aplican el tenant del token. Los índices de organización y fecha respaldan las consultas generales ordenadas más recientes primero.
