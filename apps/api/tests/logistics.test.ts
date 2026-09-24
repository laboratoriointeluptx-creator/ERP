import request from 'supertest';
import { app } from '../src/app.js';
import { calculateShipmentBalance, isShipmentDeliverable } from '../src/modules/logistics/services/shipment.service.js';

describe('logistics', () => {
  it('requires authentication to create shipments', async () => {
    const response = await request(app).post('/api/v1/shipments').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('requires authentication to dispatch and cancel shipments', async () => {
    const id = '6a0000000000000000000001';
    const [dispatch, cancel, deliver] = await Promise.all([
      request(app).post(`/api/v1/shipments/${id}/dispatch`).send({}),
      request(app).post(`/api/v1/shipments/${id}/cancel`).send({}),
      request(app).post(`/api/v1/shipments/${id}/deliver`).send({}),
    ]);
    expect(dispatch.status).toBe(401);
    expect(cancel.status).toBe(401);
    expect(deliver.status).toBe(401);
  });

  it('deducts shipped quantity and releases its reservation with fixed precision', () => {
    expect(calculateShipmentBalance('10', '3', '2')).toEqual({ quantity: '8', reservedQuantity: '1' });
    expect(calculateShipmentBalance('2.5', '2.5', '2.5')).toEqual({ quantity: '0', reservedQuantity: '0' });
    expect(() => calculateShipmentBalance('1', '1', '1.0001')).toThrow('On-hand quantity is lower than the shipment quantity');
    expect(() => calculateShipmentBalance('2', '1', '1.5')).toThrow('Reserved quantity is lower than the sales order quantity');
  });

  it('allows delivery only after shipment', () => {
    expect(isShipmentDeliverable('SHIPPED')).toBe(true);
    expect(isShipmentDeliverable('IN_TRANSIT')).toBe(true);
    expect(isShipmentDeliverable('PENDING')).toBe(false);
    expect(isShipmentDeliverable('CANCELLED')).toBe(false);
  });
});
