export type PurchaseRequestDetail = {
  id: number;
  productId: number;
  productName: string;
  requestedWeight: number;
  allocatedWeight: number;
  remainingWeight: number;
  targetUnitPrice: number;
};

export type PurchaseRequest = {
  id: number;
  requestCode: string;
  status: string;
  requestedDate: string;
  notes?: string | null;
  details: PurchaseRequestDetail[];
};

export type CreatePurchaseRequestBody = {
  notes?: string;
  details: {
    productId: number;
    requestedWeight: number;
    targetUnitPrice: number;
  }[];
};

export type CreatePurchaseOrderFromRequestBody = {
  supplierId: number;
  details: {
    purchaseRequestDetailId: number;
    orderedWeight: number;
    unitPrice: number;
    tolerancePercent: number;
    harvestDate: string;
  }[];
};
