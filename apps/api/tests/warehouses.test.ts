import request from 'supertest';
import { app } from '../src/app.js';
import { createWarehouseSchema, warehouseQuerySchema } from '../src/modules/warehouses/validators/warehouse.schemas.js';

describe('warehouses', () => {
  it('requires authentication to list warehouses', async () => {
    const response = await request(app).get('/api/v1/warehouses');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('normalizes codes and applies bounded pagination defaults', () => {
    expect(createWarehouseSchema.parse({ code: ' almacén-1 ', name: ' Almacén Central ' })).toEqual({
      code: 'ALMACÉN-1',
      name: 'Almacén Central',
    });
    expect(warehouseQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
  });

  it('rejects unknown fields and invalid branch ids', () => {
    expect(createWarehouseSchema.safeParse({ code: 'A', name: 'A', organizationId: '6a0000000000000000000001' }).success).toBe(false);
    expect(createWarehouseSchema.safeParse({ code: 'A', name: 'A', branchId: 'invalid' }).success).toBe(false);
    expect(warehouseQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
