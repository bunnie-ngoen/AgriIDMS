export interface WarehouseItem {
  id: number;
  name: string;
  location: string;
  titleWarehouse: "Normal" | "Cold";
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
  /** Tổng khối lượng hàng trong kho (kg), gồm cả hàng chưa xếp slot. */
  totalStockWeight?: number;
  /** Tổng sức chứa của toàn bộ slot trong kho (kg). */
  totalCapacity?: number;
  /** Khối lượng hàng đang nằm trong slot (kg). */
  storedInSlotsWeight?: number;
  /** Khối lượng hàng chưa xếp vào slot (kg). */
  unassignedStockWeight?: number;
}

export interface ZoneItem {
  id: number;
  name: string;
  warehouseId: number;
}

export interface RackItem {
  id: number;
  name: string;
  zoneId: number;
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
  rackId: number;
}

export interface SlotBoxItem {
  id: number;
  boxCode: string;
  qrCode: string | null;
  weight: number;
  status: string;
  lotId: number;
  lotCode: string;
  receivedDate: string;
  expiryDate: string;
}

export interface SlotContents {
  slotId: number;
  slotCode: string;
  slotQrCode: string | null;
  capacity: number;
  currentCapacity: number;
  remainingCapacity: number;
  productVariantId: number | null;
  productName: string | null;
  variantName: string | null;
  boxCount: number;
  totalBoxWeight: number;
  boxes: SlotBoxItem[];
}

