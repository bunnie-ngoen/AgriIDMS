export interface WarehouseItem {
  id: number;
  name: string;
  location: string;
  titleWarehouse: "Normal" | "Cold";
  /** Chiều dài kho (m). */
  lengthM?: number | null;
  /** Chiều rộng kho (m). */
  widthM?: number | null;
  /** Diện tích sàn kho (m²). */
  floorAreaM2?: number | null;
  /**
   * Số giờ tối thiểu phải nằm trong kho lạnh trước khi xuất (chỉ áp dụng cho kho lạnh).
   * BE field: MinColdStorageHours.
   */
  minColdStorageHours?: number | null;
  /**
   * Định mức tối thiểu (kg) cho mỗi phiếu nhập vào kho này.
   * BE field: MinReceiptWeight.
   */
  minReceiptWeight?: number | null;
  /** Tổng thể tích hàng trong kho (m3), gồm cả hàng chưa xếp slot. */
  totalStockWeight?: number;
  /** Tổng sức chứa của toàn bộ slot trong kho (m3). */
  totalCapacity?: number;
  /** Thể tích hàng đang nằm trong slot (m3). */
  storedInSlotsWeight?: number;
  /** Thể tích hàng chưa xếp vào slot (m3). */
  unassignedStockWeight?: number;
}

export interface ZoneItem {
  id: number;
  name: string;
  warehouseId: number;
  lengthM?: number | null;
  widthM?: number | null;
  floorAreaM2?: number | null;
}

export interface RackItem {
  id: number;
  name: string;
  zoneId: number;
  lengthM?: number | null;
  widthM?: number | null;
  floorAreaM2?: number | null;
}

export interface SlotItem {
  id: number;
  code: string;
  qrCode?: string | null;
  /** URL ảnh QR (Cloudinary), từ API */
  qrImageUrl?: string | null;
  /** Variant đang chứa trong slot (nếu có box) */
  productVariantId?: number | null;
  productVariantName?: string | null;
  productName?: string | null;
  capacity: number;
  currentCapacity: number;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  volumeM3?: number | null;
  rackId: number;
}

export interface SlotBoxItem {
  id: number;
  boxCode: string;
  qrCode: string | null;
  weight: number;
  volumeM3?: number;
  status: string;
  productVariantId?: number | null;
  productVariantName?: string | null;
  productName?: string | null;
  supplierName?: string | null;
  lotId: number;
  lotCode: string;
  receivedDate: string;
  expiryDate: string;
}

export interface SlotContents {
  slotId: number;
  slotCode: string;
  slotQrCode: string | null;
  slotQrImageUrl?: string | null;
  capacity: number;
  currentCapacity: number;
  remainingCapacity: number;
  productVariantId: number | null;
  productName: string | null;
  variantName: string | null;
  boxCount: number;
  totalBoxWeight: number;
  totalBoxVolumeM3?: number;
  boxes: SlotBoxItem[];
}

