export const permissions = {
  organizationsRead: 'organizations.read',
  organizationsUpdate: 'organizations.update',
  customersRead: 'customers.read',
  customersCreate: 'customers.create',
  suppliersRead: 'suppliers.read',
  suppliersCreate: 'suppliers.create',
  productsRead: 'products.read',
  productsCreate: 'products.create',
  inventoryRead: 'inventory.read',
  inventoryAdjust: 'inventory.adjust',
  purchaseRequestsRead: 'purchase-requests.read',
  purchaseRequestsCreate: 'purchase-requests.create',
  purchaseOrdersCreate: 'purchase-orders.create',
  salesOrdersCreate: 'sales-orders.create',
  invoicesRead: 'invoices.read',
  invoicesCreate: 'invoices.create',
  paymentsRead: 'payments.read',
  paymentsCreate: 'payments.create',
  accountingRead: 'accounting.read',
  accountingPost: 'accounting.post',
  workflowsExecute: 'workflows.execute',
  branchesRead: 'branches.read',
  branchesCreate: 'branches.create',
  catalogsRead: 'catalogs.read',
  catalogsCreate: 'catalogs.create',
  crmRead: 'crm.read',
  crmCreate: 'crm.create',
  shipmentsCreate: 'shipments.create',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

const rolePermissions: Record<string, readonly Permission[]> = {
  admin: Object.values(permissions),
  user: [permissions.organizationsRead, permissions.customersRead, permissions.suppliersRead, permissions.productsRead, permissions.inventoryRead, permissions.purchaseRequestsRead],
};

export const roleHasPermission = (roles: readonly string[], permission: Permission): boolean =>
  roles.some((role) => rolePermissions[role]?.includes(permission) ?? false);
