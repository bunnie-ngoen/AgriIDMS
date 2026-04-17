import { api } from "../../../shared/api";

export type DamageTargetType = "Box" | "Lot";
export type DamageTargetTypePayload = 0 | 1;
export type DamageReportStatus = "Pending" | "Approved" | "Rejected";

export type DamageReportItem = {
  id: string;
  targetType: DamageTargetType;
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
  suggestedDiscountPercent: number;
  note: string | null;
  evidenceImageUrl: string | null;
  reportedByUserId: string;
  reportedByUsername: string;
  reportedAt: string;
  status: DamageReportStatus;
  reviewedByUserId: string | null;
  reviewedByUsername: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  appliedDiscountPercent: number | null;
};

export type CreateDamageReportPayload = {
  targetType: DamageTargetTypePayload;
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
  suggestedDiscountPercent: number;
  note: string | null;
  evidenceImageUrl: string;
};

function toStringOrNull(v: unknown): string | null {
  return typeof v === "string" ? v : v == null ? null : String(v);
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapItem(raw: Record<string, unknown>): DamageReportItem {
  const id = String(raw.id ?? raw.Id ?? "");
  const status = String(raw.status ?? raw.Status ?? "Pending") as DamageReportStatus;
  return {
    id,
    targetType: String(raw.targetType ?? raw.TargetType ?? "Box") as DamageTargetType,
    targetId: Number(raw.targetId ?? raw.TargetId ?? 0),
    targetCode: String(raw.targetCode ?? raw.TargetCode ?? ""),
    productVariantId: toNumberOrNull(raw.productVariantId ?? raw.ProductVariantId),
    productName: toStringOrNull(raw.productName ?? raw.ProductName),
    lotId: toNumberOrNull(raw.lotId ?? raw.LotId),
    lotCode: toStringOrNull(raw.lotCode ?? raw.LotCode),
    warehouseId: toNumberOrNull(raw.warehouseId ?? raw.WarehouseId),
    warehouseName: toStringOrNull(raw.warehouseName ?? raw.WarehouseName),
    damageReason: String(raw.damageReason ?? raw.DamageReason ?? ""),
    damagePercent: Number(raw.damagePercent ?? raw.DamagePercent ?? 0),
    suggestedDiscountPercent: Number(
      raw.suggestedDiscountPercent ?? raw.SuggestedDiscountPercent ?? 0,
    ),
    note: toStringOrNull(raw.note ?? raw.Note),
    evidenceImageUrl: toStringOrNull(raw.evidenceImageUrl ?? raw.EvidenceImageUrl),
    reportedByUserId: String(raw.reportedByUserId ?? raw.ReportedByUserId ?? ""),
    reportedByUsername: String(raw.reportedByUsername ?? raw.ReportedByUsername ?? ""),
    reportedAt: String(raw.reportedAt ?? raw.ReportedAt ?? ""),
    status,
    reviewedByUserId: toStringOrNull(raw.reviewedByUserId ?? raw.ReviewedByUserId),
    reviewedByUsername: toStringOrNull(raw.reviewedByUsername ?? raw.ReviewedByUsername),
    reviewedAt: toStringOrNull(raw.reviewedAt ?? raw.ReviewedAt),
    reviewNote: toStringOrNull(raw.reviewNote ?? raw.ReviewNote),
    appliedDiscountPercent: toNumberOrNull(
      raw.appliedDiscountPercent ?? raw.AppliedDiscountPercent,
    ),
  };
}

export const damageReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDamageReports: builder.query<DamageReportItem[], { status?: DamageReportStatus } | void>({
      query: (arg) => {
        const params: Record<string, string> = {};
        if (arg?.status) params.status = arg.status;
        return { url: "DamageReports", method: "GET", params };
      },
      transformResponse: (raw: unknown) => {
        const arr = Array.isArray(raw)
          ? raw
          : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown[] }).data)
            ? (raw as { data: unknown[] }).data
            : [];
        return arr.map((x) => mapItem((x ?? {}) as Record<string, unknown>));
      },
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),

    createDamageReport: builder.mutation<{ id?: string; message?: string }, CreateDamageReportPayload>(
      {
        query: (body) => ({ url: "DamageReports", method: "POST", body }),
        invalidatesTags: [{ type: "Notification", id: "LIST" }],
      },
    ),

    approveDamageReport: builder.mutation<
      { message?: string },
      { id: string; discountPercent: number; reviewNote?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `DamageReports/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),

    rejectDamageReport: builder.mutation<
      { message?: string },
      { id: string; reviewNote?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `DamageReports/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDamageReportsQuery,
  useCreateDamageReportMutation,
  useApproveDamageReportMutation,
  useRejectDamageReportMutation,
} = damageReportApi;
