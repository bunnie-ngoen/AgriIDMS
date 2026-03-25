export type StockCheckDashboardItem = {
  stockCheckId: number;
  status: string;
  checkType: string;
  snapshotAt: string;
  createdAt: string;

  totalLines: number;
  countedLines: number;
  shortageLines: number;
  excessLines: number;
};

export type StockCheckWarehouseDashboard = {
  draftChecks: StockCheckDashboardItem[];
  inProgressChecks: StockCheckDashboardItem[];
  countedChecks: StockCheckDashboardItem[];
};

export type StockCheckManagerDashboard = {
  pendingApprovalChecks: StockCheckDashboardItem[];
  approvedChecks: StockCheckDashboardItem[];
  rejectedChecks: StockCheckDashboardItem[];
};

export type StockCheckDetailLine = {
  stockCheckDetailId: number;
  boxId: number;
  boxCode: string;
  lotCode: string;
  slotCode?: string | null;

  snapshotWeight: number;
  currentSystemWeight?: number | null;
  countedWeight?: number | null;
  differenceWeight?: number | null;

  varianceType?: string | null;
  varianceReason?: string | null;

  countedBy?: string | null;
  countedAt?: string | null;
  note?: string | null;
};

export type StockCheckDetailsResponse = {
  stockCheckId: number;
  warehouseId: number;
  warehouseName: string;
  status: string;
  checkType: string;
  snapshotAt: string;
  isLockedSnapshot: boolean;
  details: StockCheckDetailLine[];
};

export type UpdateCountedWeightPayload = {
  stockCheckDetailId: number;
  countedWeight: number;
  note?: string | null;
  // BE enum (0=None, 1=Damaged, 2=Loss, 3=MeasurementError)
  varianceReason?: number | null;
};

export type CreateStockCheckPayload = {
  warehouseId: number;
  // BE enum StockCheckType (Full=1, Cycle=2, Spot=3)
  checkType: number;
  boxIds?: number[] | null;
};

export type CreateStockCheckResponse = {
  message?: string;
  stockCheckId: number;
};

