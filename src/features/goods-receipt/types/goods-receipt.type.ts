// FE types mapping from BE GoodsReceipt DTOs

export type GoodsReceiptSummary = {
  id: number;
  receiptId?: number; // for safety if BE uses this name somewhere
  receiptCode: string;
  status: string;
  purchaseOrderId?: number | null;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  createdByName?: string | null;
  receivedDate: string;
  totalReceivedWeight: number;
  totalUsableWeight: number;
};

export type GoodsReceiptDetailLine = {
  id: number;
  productVariantId: number;
  productName: string;
  receivedWeight: number;
  usableWeight: number;
  rejectWeight: number;
  qcResult: string;
  unitPrice?: number | null;
  lineTotal?: number | null;
};

export type GoodsReceiptResponse = GoodsReceiptSummary & {
  details: GoodsReceiptDetailLine[];
};

export type GoodsReceiptForApprovalResponse = GoodsReceiptResponse & {
  totalAmount?: number | null;
};

export type LotSummary = {
  id: number;
  lotCode: string;
  totalQuantity: number;
  remainingQuantity: number;
  receivedDate: string;
  expiryDate: string;
};

export type BoxByQrResponse = {
  id: number;
  boxCode: string;
  qrCode: string | null;
  weight: number;
  status: string;
  slotId: number | null;
  warehouseId: number | null;
  lotId: number;
  placedInColdAt: string | null;
};

export type SlotByQrResponse = {
  id: number;
  code: string;
  qrCode: string | null;
  capacity: number;
  currentCapacity: number;
  rackId: number;
};

export type CreateGoodsReceiptRequest = {
  warehouseId: number;
  vehicleNumber: string;
  driverName: string;
  transportCompany?: string | null;
  purchaseOrderId: number;
  details?: {
    purchaseOrderDetailId: number;
    productVariantId: number;
    receivedWeight: number;
  }[];
};

export type AddGoodsReceiptDetailRequest = {
  goodsReceiptId: number;
  purchaseOrderDetailId: number;
  productVariantId: number;
  receivedWeight: number;
};

export type UpdateTruckWeightRequest = {
  goodsReceiptId: number;
  grossWeight: number;
  tareWeight: number;
};

export type QCInspectionRequest = {
  detailId: number;
  usableWeight: number;
};

export type CreateBoxesRequest = {
  lotId: number;
  boxSize: number;
};

export type AssignBoxToSlotRequest = {
  boxId: number;
  slotId: number;
};

export type TransferBoxToSlotRequest = {
  boxId: number;
  toSlotId: number;
};

