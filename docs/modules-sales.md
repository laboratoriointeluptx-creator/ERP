# Ventas

## Pedidos y reservas

- `POST /api/v1/sales-orders` crea un pedido `DRAFT`; cliente y productos deben estar activos y pertenecer a la organización del token. Una línea de producto no puede repetirse en el pedido.
- `POST /api/v1/sales-orders/:id/confirm` requiere `sales-orders.confirm` y el identificador de un almacén.

La confirmación solo aplica a pedidos `DRAFT`. En una transacción valida el almacén y los productos dentro del tenant, comprueba existencias disponibles (`quantity - reservedQuantity`), reserva las cantidades, cambia el pedido a `CONFIRMED` y registra auditoría. Si no hay existencias suficientes, no se confirma ni se guarda una reserva parcial.

La reserva no descuenta el inventario físico ni crea un movimiento de salida. El despacho y la liberación de reservas al cancelar o enviar se implementarán junto con el flujo de logística. Los importes permanecen como decimales string; impuestos, precios automáticos y facturación fiscal requieren reglas de negocio definidas.

## Verificación

Las pruebas cubren autenticación, validación de líneas, confirmación del almacén y precisión decimal para disponibilidad. La prueba de concurrencia y transacción completa requiere MongoDB Atlas de desarrollo.
