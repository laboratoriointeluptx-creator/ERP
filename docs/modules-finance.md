# Facturación y pagos

- `POST /api/v1/invoices` emite una factura para un pedido de venta `COMPLETED`. El cuerpo recibe `salesOrderId` y `number`; las líneas, cliente y moneda provienen del pedido.
- El total se calcula con aritmética decimal de precisión fija. El impuesto queda en cero hasta que se configure una política fiscal explícita.
- Un pedido solo puede tener una factura, y el número de factura es único por organización.
- `POST /api/v1/payments` confirma un pago contra una factura abierta. Impide pagos mayores al saldo, conserva la moneda de la factura y actualiza su estado a `PARTIALLY_PAID` o `PAID`.
- `GET /api/v1/invoices` y `GET /api/v1/payments` ofrecen consulta paginada tenant-scoped; las facturas incluyen el total pagado confirmado y el saldo pendiente.
- Factura, pago y auditoría se escriben en transacciones y todas las lecturas/escrituras filtran por organización.
- Pendiente: cancelaciones/reembolsos de pagos, impuestos configurables, notas de crédito, documentos fiscales y asientos contables automáticos.
