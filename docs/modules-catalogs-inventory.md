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
- `inventory_transfers`: registro auditable de las transferencias entre almacenes.
- `inventory_cycle_counts`: instantánea de saldo y reservas para conteo físico, con diferencias y estado de cierre.

Los movimientos soportan compra, venta, devolución, transferencia, ajuste, producción, consumo y daño. Los ajustes manuales requieren dirección (entrada/salida) y motivo; daños reducen existencias. Se validan producto y almacén dentro del tenant, saldo disponible después de reservas y se persisten el balance, movimiento y auditoría en una transacción. Recepciones de compra y despachos de venta guardan un motivo de sistema y referencias al documento origen.

`GET /api/v1/inventory` lista saldos por organización, con filtros opcionales `warehouseId` y `productId`. `GET /api/v1/inventory/movements` lista el historial con filtros por almacén, producto y tipo. `POST /api/v1/inventory/movements` admite ajustes y daños manuales con motivo obligatorio. `POST /api/v1/inventory/transfers` mueve existencias entre dos almacenes activos del mismo tenant; descuenta lo disponible (saldo físico menos reservado), actualiza ambos balances, genera los dos asientos del historial y el registro de transferencia en una sola transacción. `GET /api/v1/inventory/transfers` muestra el registro paginado. Los conteos físicos se inician con `POST /api/v1/inventory/cycle-counts`, se consultan con `GET` y se cierran con `POST /:id/complete`. Al cerrar, la API exige una cantidad para cada producto de la instantánea, verifica que el inventario y las reservas no hayan cambiado, impide contar menos que lo reservado y aplica las diferencias en la misma transacción que el historial y la auditoría. La API lista pedidos de venta despachados en `GET /api/v1/sales-orders/returnable` y pedidos de compra recibidos en `GET /api/v1/purchase-orders/returnable`. Registra devoluciones de clientes con `POST /api/v1/inventory/returns/sales`, vinculadas a pedidos despachados, y devoluciones a proveedores con `POST /api/v1/inventory/returns/purchases`, limitadas a unidades recibidas en el almacén y aún disponibles. Ambas tienen control acumulado de cantidades, movimientos y auditoría; `GET /api/v1/inventory/returns` lista su historial. La web ofrece saldos, historial, ajustes/daños, transferencias, captura/cierre de conteos y formularios de devoluciones. Las consultas requieren `inventory.read`; las escrituras requieren `inventory.adjust`. Todas las rutas aplican el tenant del token. Los índices de organización y fecha respaldan las consultas generales ordenadas más recientes primero.
