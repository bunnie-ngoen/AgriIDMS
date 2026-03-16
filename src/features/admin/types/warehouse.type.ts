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
  capacity: number;
  currentCapacity: number;
  rackId: number;
}

