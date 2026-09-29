# Ventas

## Pedidos y reservas

- `GET /api/v1/sales-orders` lista pedidos tenant-scoped con paginación y filtro de estado; la pantalla de ventas permite crear pedidos de una línea, consultar estados, confirmar y cancelar antes del despacho.
- `POST /api/v1/sales-orders` crea un pedido `DRAFT`; cliente y productos deben estar activos y pertenecer a la organización del token. Una línea de producto no puede repetirse en el pedido.
- `POST /api/v1/sales-orders/:id/confirm` requiere `sales-orders.confirm` y el identificador de un almacén.

La confirmación solo aplica a pedidos `DRAFT`. En una transacción valida el almacén y los productos dentro del tenant, comprueba existencias disponibles (`quantity - reservedQuantity`), reserva las cantidades, cambia el pedido a `CONFIRMED` y registra auditoría. Si no hay existencias suficientes, no se confirma ni se guarda una reserva parcial.

La reserva no descuenta el inventario físico ni crea un movimiento de salida. Pedidos `DRAFT` y `CONFIRMED` pueden cancelarse; cancelar uno confirmado libera sus reservas en la transacción. Al crear un envío, el pedido pasa a preparación. Solo se puede cancelar el pedido durante preparación cancelando el envío pendiente. El despacho descuenta inventario y libera la reserva; la entrega completa el pedido.

La interfaz web conecta creación de pedidos con varias líneas, confirmación con almacén, preparación de envío, despacho, cancelación de envío y entrega. Cada pedido admite actualmente un envío completo; envíos parciales y edición del pedido siguen pendientes.

## Verificación

Las pruebas cubren autenticación, validación de líneas, confirmación del almacén y precisión decimal para disponibilidad. La prueba de concurrencia y transacción completa requiere MongoDB Atlas de desarrollo.
