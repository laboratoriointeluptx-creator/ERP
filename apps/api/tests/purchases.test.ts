import request from 'supertest';
import { app } from '../src/app.js';
import { nextPurchaseRequestStatus } from '../src/modules/purchases/services/purchase-request.service.js';
import { validateApprovedPurchaseRequest } from '../src/modules/purchases/services/purchase-order.service.js';
import { reviewPurchaseRequestSchema } from '../src/modules/purchases/validators/purchase-request.schemas.js';

describe('purchase requests', () => {
  it('requires authentication to list purchase requests', async () => {
    const response = await request(app).get('/api/v1/purchase-requests');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('allows only draft submission and submitted review transitions', () => {
    expect(nextPurchaseRequestStatus('DRAFT', 'SUBMIT')).toBe('SUBMITTED');
    expect(nextPurchaseRequestStatus('SUBMITTED', 'APPROVE')).toBe('APPROVED');
    expect(nextPurchaseRequestStatus('SUBMITTED', 'REJECT')).toBe('REJECTED');
    expect(() => nextPurchaseRequestStatus('APPROVED', 'SUBMIT')).toThrow('Cannot submit a purchase request in approved state');
    expect(reviewPurchaseRequestSchema.safeParse({ decision: 'REJECTED', note: 'Falta justificar el gasto' }).success).toBe(true);
    expect(reviewPurchaseRequestSchema.safeParse({ decision: 'APPROVED', extra: true }).success).toBe(false);
  });

  it('requires authentication for submission and review actions', async () => {
    const id = '6a0000000000000000000001';
    const [submit, review] = await Promise.all([
      request(app).post(`/api/v1/purchase-requests/${id}/submit`).send({}),
      request(app).post(`/api/v1/purchase-requests/${id}/review`).send({ decision: 'APPROVED' }),
    ]);

    expect(submit.status).toBe(401);
    expect(review.status).toBe(401);
  });

  it('links purchase orders only to approved requests and products within those requests', () => {
    const requested = [{ productId: 'p1', quantity: '2' }];
    expect(() => validateApprovedPurchaseRequest('SUBMITTED', requested, [{ productId: 'p1', quantity: '1' }]))
      .toThrow('A purchase order can only be linked to an approved purchase request');
    expect(() => validateApprovedPurchaseRequest('APPROVED', requested, [{ productId: 'p2', quantity: '1' }]))
      .toThrow('Purchase order contains a product that is not in the approved request');
    expect(() => validateApprovedPurchaseRequest('APPROVED', requested, [{ productId: 'p1', quantity: '2.0001' }]))
      .toThrow('Purchase order quantity exceeds the approved request quantity');
    expect(() => validateApprovedPurchaseRequest('APPROVED', requested, [{ productId: 'p1', quantity: '2' }])).not.toThrow();
  });
});
