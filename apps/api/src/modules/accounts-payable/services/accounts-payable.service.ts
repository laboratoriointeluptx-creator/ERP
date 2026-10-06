import { HttpError } from '../../../shared/http.js';
import { findAP, listAP, updateAPBalance, addAPLine, getAPAgingReport } from '../repositories/accounts-payable.repository.js';
import type { APQuery, APAgingReportInput } from '../validators/accounts-payable.schemas.js';

export const getAccountsPayable = (organizationId: string, query: APQuery) => listAP(organizationId, query);

export const getSupplierAP = (organizationId: string, supplierId: string) => findAP(organizationId, supplierId);

export const applySupplierInvoiceToAP = async (organizationId: string, supplierId: string, invoiceId: string, amount: string) => {
  const ap = await updateAPBalance(organizationId, supplierId, amount, true);
  if (!ap) throw new HttpError(404, 'AP_NOT_FOUND', 'Accounts payable not found');
  await addAPLine(organizationId, supplierId, {
    accountId: invoiceId,
    description: `Factura proveedor aplicada`,
    debitAmount: amount,
    creditAmount: '0',
    supplierInvoiceId: invoiceId,
    dueDate: new Date(),
  });
  return ap;
};

export const applySupplierPaymentToAP = async (organizationId: string, supplierId: string, paymentId: string, amount: string) => {
  const ap = await updateAPBalance(organizationId, supplierId, amount, false);
  if (!ap) throw new HttpError(404, 'AP_NOT_FOUND', 'Accounts payable not found');
  await addAPLine(organizationId, supplierId, {
    accountId: paymentId,
    description: `Pago a proveedor aplicado`,
    debitAmount: '0',
    creditAmount: amount,
    supplierPaymentId: paymentId,
  });
  return ap;
};

export const generateAPAgingReport = (organizationId: string, input: APAgingReportInput) => getAPAgingReport(organizationId, input);