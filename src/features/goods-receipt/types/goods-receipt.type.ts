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
  productVariantId?: number | null;
  productVariantName?: string | null;
  productName?: string | null;
  totalQuantity: number;
  remainingQuantity: number;
  receivedDate: string;
  expiryDate: string;
};

export type LotListItem = {
  lotId: number;
  lotCode: string;
  qrImageUrl?: string | null;
  productVariantId?: number | null;
  totalQuantity: number;
  remainingQuantity: number;
  receivedDate: string;
  expiryDate: string;
  status: string;
  goodsReceiptId: number;
  productName: string;
  productVariantName: string;
  warehouseName: string;
};

export type LotBoxItem = {
  boxId: number;
  boxCode: string;
  weight: number;
  volumeM3?: number;
  status: string;
  slotId?: number | null;
  slotCode?: string | null;
  qrCode?: string | null;
  qrImageUrl?: string | null;
  createdAt: string;
};

export type LotDetail = {
  lotId: number;
  lotCode: string;
  qrImageUrl?: string | null;
  totalQuantity: number;
  remainingQuantity: number;
  receivedDate: string;
  expiryDate: string;
  status: string;
  goodsReceiptId: number;
  productName: string;
  productVariantName: string;
  warehouseName: string;
  boxes: LotBoxItem[];
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
  volumeM3?: number;
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
  receivedDate?: string | null;
  expiryDate?: string | null;
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

// Khớp BE enum BoxType:
// Unknown = 0, StyrofoamBox = 1, Carton = 2, MeshBag = 3, Crate = 4
// Note: project bật `erasableSyntaxOnly`, nên tránh TypeScript `enum`.
export const BoxTypeEnum = {
  Unknown: 0,
  StyrofoamBox: 1,
  Carton: 2,
  MeshBag: 3,
  Crate: 4,
} as const;

export type BoxTypeEnum = (typeof BoxTypeEnum)[keyof typeof BoxTypeEnum];

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

export type AssignBoxesToSlotRequest = {
  boxIds: number[];
  slotId: number;
};

export type NearExpiryBoxItem = {
  boxId: number;
  boxCode: string;
  weight: number;
  isPartial: boolean;
  status: string;
  slotId?: number | null;
  slotCode?: string | null;
};

export type NearExpiryLotItem = {
  lotId: number;
  lotCode: string;
  productVariantId: number;
  productName: string;
  grade: string;
  remainingQuantity: number;
  expiryDate: string;
  daysLeft: number;
  nearExpiryBoxCount: number;
  warehouseId: number;
  warehouseName: string;
  boxes: NearExpiryBoxItem[];
  status: string;
  suggestedDiscountPercent?: number;
};

export type NearExpiryDashboard = {
  daysThreshold: number;
  totalLots: number;
  totalBoxes: number;
  lots: NearExpiryLotItem[];
};

export type DisposeHistoryItem = {
  transactionId: number;
  boxId: number;
  boxCode: string;
  lotId?: number | null;
  lotCode?: string | null;
  productName?: string | null;
  productVariantName?: string | null;
  quantity: number;
  fromSlotId?: number | null;
  fromSlotCode?: string | null;
  warehouseId?: number | null;
  warehouseName?: string | null;
  createdBy: string;
  createdByName?: string | null;
  createdAt: string;
};

export type GoodsReceiptPrintLine = {
  lineNo: number;
  detailId: number;
  productName: string;
  grade: string;
  itemCode?: string | null;
  unit?: string | null;
  orderedWeightKg?: number | null;
  receivedWeightKg: number;
  usableWeightKg?: number | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
  qcResult: string;
  qcNote?: string | null;
  inspectedBy?: string | null;
  inspectedAtUtc?: string | null;
};

export type GoodsReceiptPrintData = {
  schemaVersion: string;
  documentTitle: string;
  snapshotAtUtc: string;
  snapshotPhase: string;
  isPreview: boolean;
  requiresManagerAttention: boolean;
  printWarningMessage?: string | null;
  receiptType: string;
  nonPoReason?: string | null;
  receiptId: number;
  receiptCode: string;
  receiptStatus: string;
  purchaseOrderId?: number | null;
  purchaseOrderCode?: string | null;
  supplierName: string;
  warehouseName: string;
  vehicleNumber: string;
  driverName?: string | null;
  transportCompany?: string | null;
  sourceWarehouseName?: string | null;
  sourceWarehouseAddress?: string | null;
  receivedDate: string;
  totalReceivedWeight: number;
  totalUsableWeight: number;
  totalAmount?: number | null;
  amountInWords?: string | null;
  approvedByUserName?: string | null;
  approvedAtUtc?: string | null;
  lines: GoodsReceiptPrintLine[];
};

