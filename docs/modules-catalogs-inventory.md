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

Los movimientos soportan compra, venta, devolucion, transferencia, ajuste, produccion, consumo y daño. La aplicacion de movimientos debera ejecutarse mediante un servicio transaccional antes de habilitar ajustes desde API.
