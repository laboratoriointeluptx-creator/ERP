# Facturación y pagos

- `POST /api/v1/invoices` emite una factura para un pedido de venta `COMPLETED`. El cuerpo recibe `salesOrderId` y `number`; las líneas, cliente y moneda provienen del pedido.
- El total se calcula con aritmética decimal de precisión fija. El impuesto queda en cero hasta que se configure una política fiscal explícita.
- Un pedido solo puede tener una factura, y el número de factura es único por organización.
- `POST /api/v1/payments` confirma un pago contra una factura abierta. Impide pagos mayores al saldo, conserva la moneda de la factura y actualiza su estado a `PARTIALLY_PAID` o `PAID`.
- `GET /api/v1/invoices` y `GET /api/v1/payments` ofrecen consulta paginada tenant-scoped; las facturas incluyen el total pagado confirmado y el saldo pendiente.
- `POST /api/v1/supplier-invoices` registra una factura del proveedor vinculada a una orden enviada o recibida. El importe lo captura el usuario y la moneda se hereda de la orden.
- `GET /api/v1/supplier-invoices` y `GET /api/v1/supplier-payments` permiten consultar cuentas por pagar y movimientos paginados. `POST /api/v1/supplier-payments` registra pagos que no pueden exceder el saldo.
- El flujo de cuentas por pagar no calcula impuestos ni deriva el importe de la orden: conserva el monto de la factura recibida del proveedor.
- Factura, pago y auditoría se escriben en transacciones y todas las lecturas/escrituras filtran por organización.
- Pendiente: cancelaciones/reembolsos de pagos, impuestos configurables, notas de crédito, documentos fiscales, conciliación bancaria y asientos contables automáticos.
