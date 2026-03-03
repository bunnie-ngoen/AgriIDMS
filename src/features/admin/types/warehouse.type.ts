export interface WarehouseItem {
  id: number;
  name: string;
  location: string;
  titleWarehouse: "Normal" | "Cold";
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

