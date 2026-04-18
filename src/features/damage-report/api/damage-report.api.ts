import { api } from "../../../shared/api";
import type {
  ApproveDamageReportBody,
  CreateDamageReportBody,
  DamageProcessingOutcome,
  DamageReportDto,
  DamageReportStatus,
  DamageReportsListParams,
} from "../types/damage-report.types";

function toStringOrNull(v: unknown): string | null {
  return typeof v === "string" ? v : v == null ? null : String(v);
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseOutcome(v: unknown): DamageProcessingOutcome | null {
  const s = String(v ?? "").trim();
  if (s === "CompleteDamaged" || s === "0") return "CompleteDamaged";
  if (s === "PartialDamaged" || s === "1") return "PartialDamaged";
  return null;
}

export function mapDamageReportDto(raw: Record<string, unknown>): DamageReportDto {
  const status = String(raw.status ?? raw.Status ?? "Pending") as DamageReportStatus;
  const processingOutcome = parseOutcome(raw.processingOutcome ?? raw.ProcessingOutcome);
  const requestedProcessingOutcome = parseOutcome(
    raw.requestedProcessingOutcome ?? raw.RequestedProcessingOutcome,
  );
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    targetType: String(raw.targetType ?? raw.TargetType ?? "Box"),
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
    note: toStringOrNull(raw.note ?? raw.Note),
    evidenceImageUrl: String(raw.evidenceImageUrl ?? raw.EvidenceImageUrl ?? ""),
    reportedByUserId: String(raw.reportedByUserId ?? raw.ReportedByUserId ?? ""),
    reportedByUsername: String(raw.reportedByUsername ?? raw.ReportedByUsername ?? ""),
    reportedAt: String(raw.reportedAt ?? raw.ReportedAt ?? ""),
    status,
    reviewedByUserId: toStringOrNull(raw.reviewedByUserId ?? raw.ReviewedByUserId),
    reviewedByUsername: toStringOrNull(raw.reviewedByUsername ?? raw.ReviewedByUsername),
    reviewedAt: toStringOrNull(raw.reviewedAt ?? raw.ReviewedAt),
    reviewNote: toStringOrNull(raw.reviewNote ?? raw.ReviewNote),
    processingOutcome,
    approvedDamagedWeightKg: toNumberOrNull(
      raw.approvedDamagedWeightKg ?? raw.ApprovedDamagedWeightKg,
    ),
    boxWeightSnapshotKg: toNumberOrNull(raw.boxWeightSnapshotKg ?? raw.BoxWeightSnapshotKg),
    requestedProcessingOutcome,
    requestedDamagedWeightKg: toNumberOrNull(
      raw.requestedDamagedWeightKg ?? raw.RequestedDamagedWeightKg,
    ),
    boxWeightAtReportKg: toNumberOrNull(raw.boxWeightAtReportKg ?? raw.BoxWeightAtReportKg),
  };
}

export function outcomeToApiValue(o: DamageProcessingOutcome): number {
  return o === "PartialDamaged" ? 1 : 0;
}

export const damageReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDamageReports: builder.query<DamageReportDto[], DamageReportsListParams | void>({
      query: (arg) => {
        const params: Record<string, string> = {};
        if (arg?.status) params.status = arg.status;
        if (arg?.warehouseId != null && arg.warehouseId > 0)
          params.warehouseId = String(arg.warehouseId);
        if (arg?.requestedOutcome) params.requestedOutcome = arg.requestedOutcome;
        return { url: "DamageReports", method: "GET", params };
      },
      transformResponse: (raw: unknown) => {
        const arr = Array.isArray(raw)
          ? raw
          : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown[] }).data)
            ? (raw as { data: unknown[] }).data
            : [];
        return arr.map((x) => mapDamageReportDto((x ?? {}) as Record<string, unknown>));
      },
      providesTags: (res) =>
        res
          ? [
              { type: "DamageReport" as const, id: "LIST" },
              ...res.map((r) => ({ type: "DamageReport" as const, id: String(r.id) })),
            ]
          : [{ type: "DamageReport" as const, id: "LIST" }],
    }),

    getDamageReportById: builder.query<DamageReportDto, number>({
      query: (id) => ({ url: `DamageReports/${id}`, method: "GET" }),
      transformResponse: (raw: unknown) =>
        mapDamageReportDto((raw ?? {}) as Record<string, unknown>),
      providesTags: (_res, _err, id) => [{ type: "DamageReport", id: String(id) }],
    }),

    hasPendingDamageForBox: builder.query<{ hasPending: boolean }, number>({
      query: (boxId) => ({
        url: "DamageReports/pending-for-box",
        method: "GET",
        params: { boxId: String(boxId) },
      }),
      transformResponse: (raw: unknown) => {
        const o = raw as { hasPending?: boolean; HasPending?: boolean };
        return { hasPending: Boolean(o?.hasPending ?? o?.HasPending) };
      },
    }),

    createDamageReport: builder.mutation<{ id?: number; message?: string }, CreateDamageReportBody>(
      {
        query: (body) => ({ url: "DamageReports", method: "POST", body }),
        invalidatesTags: [{ type: "DamageReport", id: "LIST" }],
      },
    ),

    approveDamageReport: builder.mutation<
      { message?: string },
      { id: number; body: ApproveDamageReportBody }
    >({
      query: ({ id, body }) => ({
        url: `DamageReports/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "DamageReport", id: "LIST" },
        { type: "DamageReport", id: String(id) },
      ],
    }),

    rejectDamageReport: builder.mutation<
      { message?: string },
      { id: number; reviewNote: string }
    >({
      query: ({ id, reviewNote }) => ({
        url: `DamageReports/${id}/reject`,
        method: "POST",
        body: { reviewNote },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "DamageReport", id: "LIST" },
        { type: "DamageReport", id: String(id) },
      ],
    }),
  }),
});

export const {
  useGetDamageReportsQuery,
  useGetDamageReportByIdQuery,
  useLazyHasPendingDamageForBoxQuery,
  useCreateDamageReportMutation,
  useApproveDamageReportMutation,
  useRejectDamageReportMutation,
} = damageReportApi;
