import type { ApiFailure, ApiSuccess, AuthSession, CreditMemo, CustomerRefund, DashboardSummary, FinanceInvoice, FinancePayment, InventoryBalance, InventoryCycleCount, InventoryMovement, InventoryPage, InventoryReturn, InventoryTransfer, MasterDataResult, OrganizationSummary, OrganizationUsersResult, PurchaseOrder, ReturnablePurchaseOrder, ReturnableSalesOrder, SalesOrder, Shipment, UserSummary } from '@erp-universal/types';

export type { AuthSession, DashboardSummary, OrganizationSummary };
export type MasterDataResource = 'customers' | 'suppliers' | 'products' | 'branches' | 'warehouses' | 'categories' | 'units';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  /** Solo presente en errores 400 de validación: contiene `issues` de Zod. */
  public readonly details: Record<string, unknown> | undefined;

  public constructor(status: number, failure: ApiFailure) {
    super(failure.error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = failure.error.code;
    this.details = failure.error.details;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | undefined;
}

export class ApiClient {
  public constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.options.getAccessToken?.();
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (response.status === 204) return undefined as T;
    const body = (await response.json()) as ApiSuccess<T> | ApiFailure;
    if (!response.ok || !body.success) {
      throw new ApiClientError(response.status, body as ApiFailure);
    }
    return body.data;
  }

  public login(input: { organizationId: string; email: string; password: string }): Promise<AuthSession> {
    return this.request<AuthSession>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(input) });
  }

  public requestPasswordReset(input: { organizationId: string; email: string }): Promise<{ accepted: true }> {
    return this.request<{ accepted: true }>('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify(input) });
  }

  public resetPassword(input: { token: string; newPassword: string }): Promise<{ changed: true }> {
    return this.request<{ changed: true }>('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(input) });
  }

  public getCurrentOrganization(): Promise<OrganizationSummary> {
    return this.request<OrganizationSummary>('/api/v1/organizations/me');
  }

  public getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/api/v1/dashboard/summary');
  }

  public getUsers(input: { page?: number; limit?: number; search?: string; active?: boolean } = {}): Promise<OrganizationUsersResult> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.search) query.set('search', input.search);
    if (input.active !== undefined) query.set('active', String(input.active));
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.request<OrganizationUsersResult>(`/api/v1/users${suffix}`);
  }

  public createUser(input: { email: string; firstName: string; lastName: string; initialPassword: string }): Promise<UserSummary> {
    return this.request<UserSummary>('/api/v1/users', { method: 'POST', body: JSON.stringify(input) });
  }

  public updateUserStatus(userId: string, active: boolean): Promise<UserSummary> {
    return this.request<UserSummary>(`/api/v1/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }

  public getMasterData(resource: MasterDataResource, input: { page?: number; limit?: number; search?: string; active?: boolean } = {}): Promise<MasterDataResult> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.search) query.set('search', input.search);
    if (input.active !== undefined) query.set('active', String(input.active));
    const route = resource === 'categories' || resource === 'units' ? `/api/v1/catalogs/${resource}` : `/api/v1/${resource}`;
    return this.request<MasterDataResult>(`${route}?${query.toString()}`);
  }

  public createMasterData(resource: MasterDataResource, input: Record<string, unknown>): Promise<MasterDataResult['items'][number]> {
    const route = resource === 'categories' || resource === 'units' ? `/api/v1/catalogs/${resource}` : `/api/v1/${resource}`;
    return this.request<MasterDataResult['items'][number]>(route, { method: 'POST', body: JSON.stringify(input) });
  }

  public updateMasterData(resource: MasterDataResource, id: string, input: Record<string, unknown>): Promise<MasterDataResult['items'][number]> {
    const route = resource === 'categories' || resource === 'units' ? `/api/v1/catalogs/${resource}` : `/api/v1/${resource}`;
    return this.request<MasterDataResult['items'][number]>(`${route}/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify(input),
    });
  }

  public getInventoryBalances(input: { page?: number; limit?: number; warehouseId?: string; productId?: string } = {}): Promise<InventoryPage<InventoryBalance>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.warehouseId) query.set('warehouseId', input.warehouseId);
    if (input.productId) query.set('productId', input.productId);
    return this.request<InventoryPage<InventoryBalance>>(`/api/v1/inventory?${query.toString()}`);
  }

  public getInventoryMovements(input: { page?: number; limit?: number; warehouseId?: string; productId?: string } = {}): Promise<InventoryPage<InventoryMovement>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.warehouseId) query.set('warehouseId', input.warehouseId);
    if (input.productId) query.set('productId', input.productId);
    return this.request<InventoryPage<InventoryMovement>>(`/api/v1/inventory/movements?${query.toString()}`);
  }

  public createInventoryMovement(input: { warehouseId: string; productId: string; type: 'ADJUSTMENT' | 'DAMAGE'; direction?: 'INCREASE' | 'DECREASE'; quantity: string; reason: string }): Promise<InventoryBalance> {
    return this.request<InventoryBalance>('/api/v1/inventory/movements', { method: 'POST', body: JSON.stringify(input) });
  }

  public getInventoryTransfers(input: { page?: number; limit?: number; warehouseId?: string; productId?: string } = {}): Promise<InventoryPage<InventoryTransfer>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.warehouseId) query.set('warehouseId', input.warehouseId);
    if (input.productId) query.set('productId', input.productId);
    return this.request<InventoryPage<InventoryTransfer>>(`/api/v1/inventory/transfers?${query.toString()}`);
  }

  public createInventoryTransfer(input: { sourceWarehouseId: string; destinationWarehouseId: string; productId: string; quantity: string; reason: string }): Promise<InventoryTransfer> {
    return this.request<InventoryTransfer>('/api/v1/inventory/transfers', { method: 'POST', body: JSON.stringify(input) });
  }

  public getInventoryCycleCounts(input: { page?: number; limit?: number; warehouseId?: string; status?: 'DRAFT' | 'COMPLETED' } = {}): Promise<InventoryPage<InventoryCycleCount>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.warehouseId) query.set('warehouseId', input.warehouseId);
    if (input.status) query.set('status', input.status);
    return this.request<InventoryPage<InventoryCycleCount>>(`/api/v1/inventory/cycle-counts?${query.toString()}`);
  }

  public createInventoryCycleCount(input: { warehouseId: string; reason: string }): Promise<InventoryCycleCount> {
    return this.request<InventoryCycleCount>('/api/v1/inventory/cycle-counts', { method: 'POST', body: JSON.stringify(input) });
  }

  public completeInventoryCycleCount(id: string, lines: Array<{ productId: string; countedQuantity: string }>): Promise<InventoryCycleCount> {
    return this.request<InventoryCycleCount>(`/api/v1/inventory/cycle-counts/${encodeURIComponent(id)}/complete`, { method: 'POST', body: JSON.stringify({ lines }) });
  }

  public getInventoryReturns(input: { page?: number; limit?: number; warehouseId?: string; productId?: string; sourceType?: InventoryReturn['sourceType'] } = {}): Promise<InventoryPage<InventoryReturn>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.warehouseId) query.set('warehouseId', input.warehouseId);
    if (input.productId) query.set('productId', input.productId);
    if (input.sourceType) query.set('sourceType', input.sourceType);
    return this.request<InventoryPage<InventoryReturn>>(`/api/v1/inventory/returns?${query.toString()}`);
  }

  public getInvoices(input: { page?: number; limit?: number } = {}): Promise<FinanceInvoice[]> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    return this.request<FinanceInvoice[]>(`/api/v1/invoices?${query.toString()}`);
  }

  public getPayments(input: { page?: number; limit?: number; invoiceId?: string } = {}): Promise<FinancePayment[]> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.invoiceId) query.set('invoiceId', input.invoiceId);
    return this.request<FinancePayment[]>(`/api/v1/payments?${query.toString()}`);
  }

  public createSalesReturn(input: { salesOrderId: string; reason: string; lines: Array<{ productId: string; quantity: string }> }): Promise<InventoryReturn> {
    return this.request<InventoryReturn>('/api/v1/inventory/returns/sales', { method: 'POST', body: JSON.stringify(input) });
  }

  public createPurchaseReturn(input: { purchaseOrderId: string; warehouseId: string; reason: string; lines: Array<{ productId: string; quantity: string }> }): Promise<InventoryReturn> {
    return this.request<InventoryReturn>('/api/v1/inventory/returns/purchases', { method: 'POST', body: JSON.stringify(input) });
  }

  public getReturnableSalesOrders(input: { page?: number; limit?: number } = {}): Promise<InventoryPage<ReturnableSalesOrder>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    return this.request<InventoryPage<ReturnableSalesOrder>>(`/api/v1/sales-orders/returnable?${query.toString()}`);
  }

  public getReturnablePurchaseOrders(input: { page?: number; limit?: number } = {}): Promise<InventoryPage<ReturnablePurchaseOrder>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    return this.request<InventoryPage<ReturnablePurchaseOrder>>(`/api/v1/purchase-orders/returnable?${query.toString()}`);
  }

  public getCreditMemos(input: { page?: number; limit?: number; invoiceId?: string } = {}): Promise<InventoryPage<CreditMemo>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.invoiceId) query.set('invoiceId', input.invoiceId);
    return this.request<InventoryPage<CreditMemo>>(`/api/v1/credit-memos?${query.toString()}`);
  }

  public createCreditMemo(input: { inventoryReturnId: string; number: string; reason: string }): Promise<CreditMemo> {
    return this.request<CreditMemo>('/api/v1/credit-memos', { method: 'POST', body: JSON.stringify(input) });
  }

  public getCustomerRefunds(input: { page?: number; limit?: number; invoiceId?: string; paymentId?: string } = {}): Promise<InventoryPage<CustomerRefund>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.invoiceId) query.set('invoiceId', input.invoiceId);
    if (input.paymentId) query.set('paymentId', input.paymentId);
    return this.request<InventoryPage<CustomerRefund>>(`/api/v1/customer-refunds?${query.toString()}`);
  }

  public createCustomerRefund(input: { paymentId: string; creditMemoId: string; amount: string; method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER'; reference?: string; reason: string }): Promise<CustomerRefund> {
    return this.request<CustomerRefund>('/api/v1/customer-refunds', { method: 'POST', body: JSON.stringify(input) });
  }

  public getSalesOrders(input: { page?: number; limit?: number; status?: string } = {}): Promise<InventoryPage<SalesOrder>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.status) query.set('status', input.status);
    return this.request<InventoryPage<SalesOrder>>(`/api/v1/sales-orders?${query.toString()}`);
  }

  public createSalesOrder(input: { code: string; customerId: string; lines: Array<{ productId: string; quantity: string; unitPrice: string }>; currency?: string; notes?: string }): Promise<SalesOrder> {
    return this.request<SalesOrder>('/api/v1/sales-orders', { method: 'POST', body: JSON.stringify(input) });
  }

  public confirmSalesOrder(id: string, warehouseId: string): Promise<SalesOrder> {
    return this.request<SalesOrder>(`/api/v1/sales-orders/${encodeURIComponent(id)}/confirm`, { method: 'POST', body: JSON.stringify({ warehouseId }) });
  }

  public cancelSalesOrder(id: string): Promise<SalesOrder> {
    return this.request<SalesOrder>(`/api/v1/sales-orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  }

  public getPurchaseOrders(input: { page?: number; limit?: number; status?: string } = {}): Promise<InventoryPage<PurchaseOrder>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.status) query.set('status', input.status);
    return this.request<InventoryPage<PurchaseOrder>>(`/api/v1/purchase-orders?${query.toString()}`);
  }

  public createPurchaseOrder(input: { code: string; supplierId: string; lines: Array<{ productId: string; quantity: string; unitPrice: string }>; currency?: string; notes?: string; purchaseRequestId?: string }): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>('/api/v1/purchase-orders', { method: 'POST', body: JSON.stringify(input) });
  }

  public sendPurchaseOrder(id: string): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/api/v1/purchase-orders/${encodeURIComponent(id)}/send`, { method: 'POST' });
  }

  public receivePurchaseOrder(id: string, input: { warehouseId: string; lines: Array<{ productId: string; quantity: string }> }): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/api/v1/purchase-orders/${encodeURIComponent(id)}/receipts`, { method: 'POST', body: JSON.stringify(input) });
  }

  public getShipments(input: { page?: number; limit?: number; status?: string } = {}): Promise<InventoryPage<Shipment>> {
    const query = new URLSearchParams();
    if (input.page !== undefined) query.set('page', String(input.page));
    if (input.limit !== undefined) query.set('limit', String(input.limit));
    if (input.status) query.set('status', input.status);
    return this.request<InventoryPage<Shipment>>(`/api/v1/shipments?${query.toString()}`);
  }

  public createShipment(input: { salesOrderId: string; number: string; carrier?: string; trackingNumber?: string; shippingAddress: string }): Promise<Shipment> {
    return this.request<Shipment>('/api/v1/shipments', { method: 'POST', body: JSON.stringify(input) });
  }

  public dispatchShipment(id: string): Promise<Shipment> {
    return this.request<Shipment>(`/api/v1/shipments/${encodeURIComponent(id)}/dispatch`, { method: 'POST' });
  }

  public cancelShipment(id: string): Promise<Shipment> {
    return this.request<Shipment>(`/api/v1/shipments/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  }

  public deliverShipment(id: string): Promise<Shipment> {
    return this.request<Shipment>(`/api/v1/shipments/${encodeURIComponent(id)}/deliver`, { method: 'POST' });
  }

  public refresh(refreshToken: string): Promise<{ accessToken: string }> {
    return this.request<{ accessToken: string }>('/api/v1/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  }

  public logout(refreshToken: string): Promise<void> {
    return this.request<void>('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  }
}
