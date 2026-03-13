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
};

export type GoodsReceiptResponse = GoodsReceiptSummary & {
  details: GoodsReceiptDetailLine[];
};

export type CreateGoodsReceiptRequest = {
  supplierId: number;
  warehouseId: number;
  vehicleNumber: string;
  driverName: string;
  transportCompany?: string | null;
  purchaseOrderId: number;
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
  qcResult: string;
  qcNote?: string | null;
  /**
   * FE-only: id phiếu nhập để RTK Query có thể invalidatesTags chính xác.
   * BE sẽ bỏ qua field này nếu không định nghĩa trong DTO.
   */
  goodsReceiptId?: number;
};

export type CreateBoxesRequest = {
  lotId: number;
  boxSize: number;
};

