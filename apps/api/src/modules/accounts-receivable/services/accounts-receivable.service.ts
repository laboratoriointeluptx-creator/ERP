import { HttpError } from '../../../shared/http.js';
import { findAR, listAR, updateARBalance, addARLine, getAgingReport } from '../repositories/accounts-receivable.repository.js';
import type { ARQuery, AgingReportInput } from '../validators/accounts-receivable.schemas.js';

export const getAccountsReceivable = (organizationId: string, query: ARQuery) => listAR(organizationId, query);

export const getCustomerAR = (organizationId: string, customerId: string) => findAR(organizationId, customerId);

export const applyInvoiceToAR = async (organizationId: string, customerId: string, invoiceId: string, amount: string) => {
  const ar = await updateARBalance(organizationId, customerId, amount, true);
  if (!ar) throw new HttpError(404, 'AR_NOT_FOUND', 'Accounts receivable not found');
  await addARLine(organizationId, customerId, {
    accountId: invoiceId,
    description: `Factura aplicada`,
    debitAmount: amount,
    creditAmount: '0',
    invoiceId,
    dueDate: new Date(),
  });
  return ar;
};

export const applyPaymentToAR = async (organizationId: string, customerId: string, paymentId: string, amount: string) => {
  const ar = await updateARBalance(organizationId, customerId, amount, false);
  if (!ar) throw new HttpError(404, 'AR_NOT_FOUND', 'Accounts receivable not found');
  await addARLine(organizationId, customerId, {
    accountId: paymentId,
    description: `Pago aplicado`,
    debitAmount: '0',
    creditAmount: amount,
    paymentId,
  });
  return ar;
};

export const applyCreditMemoToAR = async (organizationId: string, customerId: string, creditMemoId: string, amount: string) => {
  const ar = await updateARBalance(organizationId, customerId, amount, false);
  if (!ar) throw new HttpError(404, 'AR_NOT_FOUND', 'Accounts receivable not found');
  await addARLine(organizationId, customerId, {
    accountId: creditMemoId,
    description: `Nota de crédito aplicada`,
    debitAmount: '0',
    creditAmount: amount,
    creditMemoId,
  });
  return ar;
};

export const generateAgingReport = (organizationId: string, input: AgingReportInput) => getAgingReport(organizationId, input);