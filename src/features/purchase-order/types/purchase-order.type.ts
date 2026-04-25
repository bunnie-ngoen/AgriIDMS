/** Match BE PurchaseOrderListItemDto - dòng trong danh sách */
export type PurchaseOrderListItem = {
  id: number;
  orderCode: string;
  supplierId: number;
  supplierName: string;
  status: string;
  procurementMode?: string;
  orderDate: string;
  /**
   * Tên người tạo đơn (nếu BE trả về trong list).
   * Ví dụ: createdByName / CreatedByName / CreatedBy.
   */
  createdByName?: string;
};

/** Match BE CreatePurchaseOrderRequest / CreatePurchaseOrderDetailRequest */
export type CreatePurchaseOrderDetailRequest = {
  productId: number;
  orderedWeight: number;
  unitPrice: number;
  tolerancePercent: number;
  harvestDate: string; // ISO date
};

export type CreatePurchaseOrderRequest = {
  supplierId: number;
  details: CreatePurchaseOrderDetailRequest[];
};

export type CreateSupplierPlanDetailRequest = {
  productId: number;
  orderedWeight: number;
  unitPriceAtOrder: number;
  priceDate: string;
  tolerancePercent: number;
};

export type CreateSupplierPlanRequest = {
  supplierId: number;
  orderDate: string;
  notes?: string;
  details: CreateSupplierPlanDetailRequest[];
};

export type CreateMultiSupplierPurchaseOrderRequest = {
  supplierPlans: CreateSupplierPlanRequest[];
};

/** Match BE UpdatePurchaseOrderRequest / UpdatePurchaseOrderDetailRequest */
export type UpdatePurchaseOrderDetailRequest = {
  id?: number | null;
  productId: number;
  orderedWeight: number;
  unitPrice: number;
  tolerancePercent: number;
  harvestDate: string;
};

export type UpdatePurchaseOrderRequest = {
  supplierId?: number | null;
  details?: UpdatePurchaseOrderDetailRequest[] | null;
};

/** Match BE PurchaseOrderResponse / PurchaseOrderDetailResponse */
export type PurchaseOrderDetailResponse = {
  id: number;
  productId: number;
  productName: string;
  orderedWeight: number;
  unitPrice: number;
  tolerancePercent: number;
  receivedWeight: number;
  remainingWeight: number;
  harvestDate: string;
  /**
   * Tên người duyệt dòng PO (nếu BE trả về).
   * BE field: NameApprover.
   */
  approverName?: string;
};

export type PurchaseOrderResponse = {
  id: number;
  orderCode: string;
  supplierId: number;
  supplierName: string;
  status: string;
  procurementMode?: string;
  orderDate: string;
  /**
   * Tên người tạo đơn (nếu BE trả về).
   * Thường là các field như createdByName / CreatedByName / CreatedBy.
   */
  createdByName?: string;
  details: PurchaseOrderDetailResponse[];
};

export type PurchaseOrderStructuredStatus = {
  code: string;
  label: string;
};

export type PurchaseOrderStructuredProcurement = {
  mode: string;
  label: string;
};

export type PurchaseOrderStructuredCreatedBy = {
  id?: string | null;
  name: string;
};

export type PurchaseOrderStructuredSummary = {
  totalSuppliers: number;
  totalProducts: number;
  totalOrderedWeight: number;
  totalEstimatedAmount: number;
};

export type PurchaseOrderStructuredSupplier = {
  supplierId: number;
  supplierName: string;
  isPrimary: boolean;
};

export type PurchaseOrderStructuredSupplierPlanSummary = {
  totalOrderedWeight: number;
  totalEstimatedAmount: number;
};

export type PurchaseOrderStructuredLine = {
  lineId: number;
  productId: number;
  productName: string;
  orderedWeight: number;
  unitPriceAtOrder: number;
  priceDate: string;
  lineAmount: number;
};

export type PurchaseOrderStructuredSupplierPlan = {
  supplierPlanId: number;
  supplier: PurchaseOrderStructuredSupplier;
  orderDate: string;
  notes?: string | null;
  summary: PurchaseOrderStructuredSupplierPlanSummary;
  details: PurchaseOrderStructuredLine[];
};

export type PurchaseOrderStructuredResponse = {
  id: number;
  orderCode: string;
  status: PurchaseOrderStructuredStatus;
  procurement: PurchaseOrderStructuredProcurement;
  orderDate: string;
  createdBy: PurchaseOrderStructuredCreatedBy;
  summary: PurchaseOrderStructuredSummary;
  supplierPlans: PurchaseOrderStructuredSupplierPlan[];
};
