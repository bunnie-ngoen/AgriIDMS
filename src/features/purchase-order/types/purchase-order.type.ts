/** Match BE PurchaseOrderListItemDto - dòng trong danh sách */
export type PurchaseOrderListItem = {
  id: number;
  orderCode: string;
  supplierId: number;
  supplierName: string;
  status: string;
  orderDate: string;
};

/** Match BE CreatePurchaseOrderRequest / CreatePurchaseOrderDetailRequest */
export type CreatePurchaseOrderDetailRequest = {
  productVariantId: number;
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
  productVariantId: number;
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
  productVariantId: number;
  productName: string;
  orderedWeight: number;
  unitPrice: number;
  tolerancePercent: number;
  receivedWeight: number;
  remainingWeight: number;
  harvestDate: string;
};

export type PurchaseOrderResponse = {
  id: number;
  orderCode: string;
  supplierId: number;
  supplierName: string;
  status: string;
  orderDate: string;
  details: PurchaseOrderDetailResponse[];
};
