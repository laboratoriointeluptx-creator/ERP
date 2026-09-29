export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface OrganizationSummary {
  _id: string;
  name: string;
  code: string;
  timezone: string;
  currency: string;
  active: boolean;
}

export interface UserSummary {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationUsersResult {
  items: UserSummary[];
  total: number;
}

export interface MasterDataItem {
  _id: string;
  [field: string]: unknown;
}

export interface MasterDataResult {
  items: MasterDataItem[];
  total: number;
}

export interface InventoryBalance {
  _id: string;
  warehouseId: string;
  productId: string;
  quantity: string;
  reservedQuantity: string;
  [field: string]: unknown;
}

export interface InventoryMovement {
  _id: string;
  warehouseId: string;
  productId: string;
  type: string;
  direction?: 'INCREASE' | 'DECREASE';
  quantity: string;
  reason: string;
  occurredAt: string;
  [field: string]: unknown;
}

export interface InventoryPage<T> {
  items: T[];
  total: number;
}

export interface InventoryTransfer {
  _id: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  productId: string;
  quantity: string;
  reason: string;
  occurredAt: string;
  [field: string]: unknown;
}

export interface InventoryCycleCountLine {
  productId: string;
  expectedQuantity: string;
  reservedQuantity: string;
  countedQuantity?: string;
  variance?: string;
}

export interface InventoryCycleCount {
  _id: string;
  warehouseId: string;
  status: 'DRAFT' | 'COMPLETED';
  reason: string;
  lines: InventoryCycleCountLine[];
  createdAt: string;
  completedAt?: string;
}

export interface InventoryReturn {
  _id: string;
  sourceType: 'SALE_ORDER' | 'PURCHASE_ORDER';
  sourceDocumentId: string;
  warehouseId: string;
  reason: string;
  lines: Array<{ productId: string; quantity: string }>;
  occurredAt: string;
  [field: string]: unknown;
}

export interface ReturnableOrderLine {
  productId: string;
  quantity: string;
  receivedQuantity?: string;
}

export interface ReturnableSalesOrder {
  _id: string;
  code: string;
  status: string;
  warehouseId?: string;
  lines: ReturnableOrderLine[];
}

export interface ReturnablePurchaseOrder {
  _id: string;
  code: string;
  status: string;
  lines: ReturnableOrderLine[];
}

export interface CreditMemo {
  _id: string;
  invoiceId: string;
  inventoryReturnId: string;
  number: string;
  reason: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  currency: string;
  lines: Array<{ productId: string; description: string; quantity: string; unitPrice: string; amount: string }>;
  [field: string]: unknown;
}

export interface CustomerRefund {
  _id: string;
  invoiceId: string;
  paymentId: string;
  creditMemoId: string;
  amount: string;
  method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER';
  reference?: string;
  reason: string;
  [field: string]: unknown;
}

export interface FinanceInvoice {
  _id: string;
  number: string;
  customerId: string;
  status: string;
  total: string;
  currency: string;
  paidAmount: string;
  creditedAmount: string;
  refundedAmount: string;
  balanceDue: string;
  customerCreditAmount: string;
  [field: string]: unknown;
}

export interface FinancePayment {
  _id: string;
  invoiceId: string;
  amount: string;
  refundedAmount: string;
  netAmount: string;
  currency: string;
  method: string;
  status: string;
  [field: string]: unknown;
}

export interface SalesOrder {
  _id: string;
  code: string;
  customerId: string;
  warehouseId?: string;
  status: string;
  lines: Array<{ productId: string; quantity: string; unitPrice: string }>;
  currency: string;
  notes?: string;
  [field: string]: unknown;
}

export interface PurchaseOrder {
  _id: string;
  code: string;
  supplierId: string;
  status: string;
  lines: Array<{ productId: string; quantity: string; receivedQuantity: string; unitPrice: string }>;
  currency: string;
  notes?: string;
  [field: string]: unknown;
}

export interface Shipment {
  _id: string;
  salesOrderId: string;
  number: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  shippingAddress: string;
  [field: string]: unknown;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

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

export interface DashboardSummary {
  metrics: DashboardMetric[];
  recentActivity: DashboardActivity[];
  generatedAt: string;
}
