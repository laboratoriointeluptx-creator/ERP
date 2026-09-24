import { calculateReceipt } from '../src/modules/purchases/services/purchase-order-receipt.service.js';
import { receivePurchaseOrderSchema } from '../src/modules/purchases/validators/purchase-order.schemas.js';

describe('purchase order receipts', () => {
  it('accumulates partial receipts by product without using floating point', () => {
    const updated = calculateReceipt(
      [{ productId: 'product-a', quantity: '3', receivedQuantity: '1.25' }],
      [{ productId: 'product-a', quantity: '1.75' }],
    );

    expect(updated[0]?.receivedQuantity).toBe('3');
  });

  it('rejects receipts that exceed the ordered quantity', () => {
    expect(() => calculateReceipt(
      [{ productId: 'product-a', quantity: '2', receivedQuantity: '1.5' }],
      [{ productId: 'product-a', quantity: '0.5001' }],
    )).toThrow('Received quantity exceeds the outstanding purchase order quantity');
  });

  it('rejects products outside the order and duplicate product lines', () => {
    expect(() => calculateReceipt(
      [{ productId: 'product-a', quantity: '2' }],
      [{ productId: 'product-b', quantity: '1' }],
    )).toThrow('Receipt contains a product that is not in the purchase order');

    expect(() => calculateReceipt(
      [{ productId: 'product-a', quantity: '2' }],
      [{ productId: 'product-a', quantity: '1' }, { productId: 'product-a', quantity: '1' }],
    )).toThrow('A product can appear only once per receipt');
  });

  it('requires a warehouse and unique positive quantities in the request', () => {
    const invalid = receivePurchaseOrderSchema.safeParse({
      warehouseId: '6a0000000000000000000001',
      lines: [
        { productId: '6a0000000000000000000002', quantity: '1' },
        { productId: '6a0000000000000000000002', quantity: '0' },
      ],
    });

    expect(invalid.success).toBe(false);
  });
});
