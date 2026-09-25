import { permissions, roleHasPermission } from '../../authorization/permissions.js';
import { PurchaseOrderModel } from '../../purchases/models/purchase-order.model.js';
import { PurchaseRequestModel } from '../../purchases/models/purchase-request.model.js';
import { SalesOrderModel } from '../../sales/models/sales-order.model.js';
import { InventoryModel } from '../../inventory/models/inventory.model.js';
import { InvoiceModel } from '../../finance/models/invoice.model.js';
import { SupplierInvoiceModel } from '../../finance/models/supplier-invoice.model.js';

export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
}

export interface DashboardActivity {
  id: string;
  module: string;
  reference: string;
  status: string;
  createdAt: string;
}

export const getDashboardSummary = async (organizationId: string, roles: readonly string[]) => {
  const can = (permission: (typeof permissions)[keyof typeof permissions]) => roleHasPermission(roles, permission);
  const metrics: DashboardMetric[] = [];
  const recentActivity: DashboardActivity[] = [];
  const recentQueries: Promise<void>[] = [];

  if (can(permissions.inventoryRead)) {
    const inventoryBalances = await InventoryModel.countDocuments({ organizationId }).exec();
    metrics.push({ key: 'inventoryBalances', label: 'Saldos de inventario', value: inventoryBalances });
  }
  if (can(permissions.purchaseRequestsRead)) {
    const pendingRequests = await PurchaseRequestModel.countDocuments({ organizationId, status: 'SUBMITTED' }).exec();
    metrics.push({ key: 'pendingPurchaseRequests', label: 'Solicitudes por revisar', value: pendingRequests });
    recentQueries.push(PurchaseRequestModel.find({ organizationId }).sort({ createdAt: -1 }).limit(5).exec().then((items) => {
      recentActivity.push(...items.map((item) => ({ id: String(item._id), module: 'Compras', reference: item.code, status: item.status, createdAt: item.createdAt.toISOString() })));
    }));
  }
  if (can(permissions.purchaseOrdersRead)) {
    const pendingOrders = await PurchaseOrderModel.countDocuments({ organizationId, status: { $in: ['SENT', 'PARTIALLY_RECEIVED'] } }).exec();
    metrics.push({ key: 'purchaseOrdersToReceive', label: 'Órdenes por recibir', value: pendingOrders });
    recentQueries.push(PurchaseOrderModel.find({ organizationId }).sort({ createdAt: -1 }).limit(5).exec().then((items) => {
      recentActivity.push(...items.map((item) => ({ id: String(item._id), module: 'Compras', reference: item.code, status: item.status, createdAt: item.createdAt.toISOString() })));
    }));
  }
  if (can(permissions.salesOrdersRead)) {
    const openOrders = await SalesOrderModel.countDocuments({ organizationId, status: { $in: ['DRAFT', 'CONFIRMED', 'PREPARING', 'SHIPPED'] } }).exec();
    metrics.push({ key: 'openSalesOrders', label: 'Pedidos de venta activos', value: openOrders });
    recentQueries.push(SalesOrderModel.find({ organizationId }).sort({ createdAt: -1 }).limit(5).exec().then((items) => {
      recentActivity.push(...items.map((item) => ({ id: String(item._id), module: 'Ventas', reference: item.code, status: item.status, createdAt: item.createdAt.toISOString() })));
    }));
  }
  if (can(permissions.invoicesRead)) {
    const unpaidInvoices = await InvoiceModel.countDocuments({ organizationId, status: { $in: ['ISSUED', 'PARTIALLY_PAID'] } }).exec();
    metrics.push({ key: 'unpaidInvoices', label: 'Facturas por cobrar', value: unpaidInvoices });
    recentQueries.push(InvoiceModel.find({ organizationId }).sort({ createdAt: -1 }).limit(5).exec().then((items) => {
      recentActivity.push(...items.map((item) => ({ id: String(item._id), module: 'Finanzas', reference: item.number, status: item.status, createdAt: item.createdAt.toISOString() })));
    }));
  }
  if (can(permissions.supplierInvoicesRead)) {
    const unpaidSupplierInvoices = await SupplierInvoiceModel.countDocuments({ organizationId, status: { $in: ['OPEN', 'PARTIALLY_PAID'] } }).exec();
    metrics.push({ key: 'unpaidSupplierInvoices', label: 'Facturas de proveedor pendientes', value: unpaidSupplierInvoices });
    recentQueries.push(SupplierInvoiceModel.find({ organizationId }).sort({ createdAt: -1 }).limit(5).exec().then((items) => {
      recentActivity.push(...items.map((item) => ({ id: String(item._id), module: 'Cuentas por pagar', reference: item.number, status: item.status, createdAt: item.createdAt.toISOString() })));
    }));
  }

  await Promise.all(recentQueries);
  recentActivity.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return { metrics, recentActivity: recentActivity.slice(0, 8), generatedAt: new Date().toISOString() };
};
