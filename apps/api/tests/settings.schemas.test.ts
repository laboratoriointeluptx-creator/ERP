import { settingParamsSchema, settingScopeQuerySchema } from '../src/modules/settings/validators/setting.schemas.js';

describe('settings mutation schemas', () => {
  it('requires a bounded setting key', () => {
    expect(settingParamsSchema.parse({ key: 'theme' })).toEqual({ key: 'theme' });
    expect(settingParamsSchema.safeParse({ key: '' }).success).toBe(false);
    expect(settingParamsSchema.safeParse({ key: 'k'.repeat(121) }).success).toBe(false);
  });

  it('validates scope filters and optional ObjectIds', () => {
    expect(settingScopeQuerySchema.parse({
      scope: 'branch',
      branchId: '507f1f77bcf86cd799439011',
    })).toEqual({ scope: 'branch', branchId: '507f1f77bcf86cd799439011' });
    expect(settingScopeQuerySchema.parse({})).toEqual({});
    expect(settingScopeQuerySchema.safeParse({ scope: 'tenant' }).success).toBe(false);
    expect(settingScopeQuerySchema.safeParse({ userId: 'not-an-object-id' }).success).toBe(false);
  });
});