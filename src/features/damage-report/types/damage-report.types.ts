/** Trạng thái phiếu (khớp backend DamageReportStatus). */
export type DamageReportStatus = "Pending" | "Approved" | "Rejected";

/** Loại xử lý hỏng (khớp backend DamageProcessingOutcome). */
export type DamageProcessingOutcome = "CompleteDamaged" | "PartialDamaged";

export type DamageReportDto = {
  id: number;
  targetType: string;
  targetId: number;
  targetCode: string;
  productVariantId: number | null;
  productName: string | null;
  lotId: number | null;
  lotCode: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  damageReason: string;
  damagePercent: number;
  note: string | null;
  evidenceImageUrl: string;
  reportedByUserId: string;
  reportedByUsername: string;
  reportedAt: string;
  status: DamageReportStatus;
  reviewedByUserId: string | null;
  reviewedByUsername: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  /** Sau duyệt — kết quả xử lý thực tế. */
  processingOutcome: DamageProcessingOutcome | null;
  approvedDamagedWeightKg: number | null;
  boxWeightSnapshotKg: number | null;
  /** Khi tạo phiếu — đề xuất của kho. */
  requestedProcessingOutcome: DamageProcessingOutcome | null;
  requestedDamagedWeightKg: number | null;
  /** Khối lượng thùng lúc tạo phiếu. */
  boxWeightAtReportKg: number | null;
};

export type DamageReportsListParams = {
  status?: DamageReportStatus;
  warehouseId?: number;
  requestedOutcome?: DamageProcessingOutcome;
};

export type CreateDamageReportBody = {
  targetType: 0;
  targetId: number;
  targetCode: string;
  productVariantId: number | null;
  productName: string | null;
  lotId: number | null;
  lotCode: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  damageReason: string;
  damagePercent: number;
  suggestedDiscountPercent: 0;
  requestedProcessingOutcome: number;
  requestedDamagedWeightKg: number | null;
  note: string | null;
  evidenceImageUrl: string;
};

export type ApproveDamageReportBody = {
  outcome: number;
  damagedWeightKg: number | null;
  reviewNote: string | null;
};
