import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createTax, findTax, findTaxByCode, listTaxes, updateTax, deleteTax, getActiveTaxesFor } from '../repositories/tax.repository.js';
import type { CreateTaxInput, TaxQuery, UpdateTaxInput } from '../validators/tax.schemas.js';

export const registerTax = async (organizationId: string, input: CreateTaxInput) => {
  try {
    return await createTax(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'TAX_CODE_EXISTS', 'Tax code already exists');
    }
    throw error;
  }
};

export const getTaxes = (organizationId: string, query: TaxQuery) => listTaxes(organizationId, query);

export const getApplicableTaxes = (organizationId: string, appliesTo: 'SALE' | 'PURCHASE' | 'BOTH', date?: Date) =>
  getActiveTaxesFor(organizationId, appliesTo, date);

export const modifyTax = async (organizationId: string, actorId: string, id: string, input: UpdateTaxInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTax(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TAX_NOT_FOUND', 'Tax not found');
      const updated = await updateTax(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'TAX_NOT_FOUND', 'Tax not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'tax.updated' : input.isActive ? 'tax.activated' : 'tax.deactivated',
        module: 'taxes',
        entity: 'Tax',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Tax update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeTax = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTax(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TAX_NOT_FOUND', 'Tax not found');
      const deleted = await deleteTax(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'TAX_NOT_FOUND', 'Tax not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'tax.deleted',
        module: 'taxes',
        entity: 'Tax',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: null,
      }, session);
      result = deleted;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const calculateTax = (baseAmount: string, taxRate: string): { taxAmount: string; totalAmount: string } => {
  const base = BigInt(baseAmount.replace('.', '').padEnd(1 + (baseAmount.split('.')[1]?.length ?? 0), '0'));
  const rate = BigInt(taxRate.replace('.', '').padEnd(7, '0'));
  const taxAmount = (base * rate) / 1000000n;
  const totalAmount = base + taxAmount;
  const format = (value: bigint) => {
    const str = value.toString().padStart(7, '0');
    return `${str.slice(0, -6)}.${str.slice(-6).replace(/0+$/, '') || '0'}`;
  };
  return { taxAmount: format(taxAmount), totalAmount: format(totalAmount) };
};