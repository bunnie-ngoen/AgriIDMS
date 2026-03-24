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
  /** URL ảnh QR (Cloudinary) — do FE upload */
  qrImageUrl?: string | null;
  totalQuantity: number;
  remainingQuantity: number;
  receivedDate: string;
  expiryDate: string;
};

export type LotByQrResponse = {
  id: number;
  lotCode: string;
  qrImageUrl?: string | null;
  expiryDate: string | Date;
  receivedDate: string | Date;
  totalQuantity: number;
  remainingQuantity: number;
  status: string;
  productVariantId?: number | null;
  productVariantName?: string | null;
  productName?: string | null;
  warehouseId?: number | null;
};

/** Phản hồi POST GoodsReceipts/boxes — dùng để tạo ảnh QR phía FE */
export type BoxCreatedItem = {
  id: number;
  boxCode: string;
  qrPayload: string;
};

export type BoxByQrResponse = {
  id: number;
  boxCode: string;
  qrCode: string | null;
  qrImageUrl?: string | null;
  weight: number;
  status: string;
  slotId: number | null;
  warehouseId: number | null;
  warehouseName?: string | null;
  slotCode?: string | null;
  lotCode?: string | null;
  lotId: number;
  productVariantId?: number | null;
  productVariantName?: string | null;
  productName?: string | null;
  placedInColdAt: string | null;
};

export type SlotByQrResponse = {
  id: number;
  code: string;
  qrCode: string | null;
  qrImageUrl?: string | null;
  capacity: number;
  currentCapacity: number;
  rackId: number;
  rackName?: string | null;
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

// Khớp BE enum BoxType: Unknown = 0, Full = 1, Partial = 2
export enum BoxTypeEnum {
  Unknown = 0,
  Full = 1,
  Partial = 2,
}

export type CreateBoxesRequest = {
  lotId: number;
  boxSize: number;
  boxType: BoxTypeEnum;
};

export type AssignBoxToSlotRequest = {
  boxId: number;
  slotId: number;
};

export type TransferBoxToSlotRequest = {
  boxId: number;
  toSlotId: number;
};

