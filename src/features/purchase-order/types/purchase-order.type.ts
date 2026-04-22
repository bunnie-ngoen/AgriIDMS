/** Match BE PurchaseOrderListItemDto - dòng trong danh sách */
export type PurchaseOrderListItem = {
  id: number;
  orderCode: string;
  supplierId: number;
  supplierName: string;
  status: string;
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
  orderDate: string;
  /**
   * Tên người tạo đơn (nếu BE trả về).
   * Thường là các field như createdByName / CreatedByName / CreatedBy.
   */
  createdByName?: string;
  details: PurchaseOrderDetailResponse[];
};
