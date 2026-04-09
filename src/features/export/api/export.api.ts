import { api } from "../../../shared/api";
import {
  exportReceiptSchema,
  exportPrintDataSchema,
  pendingApproveExportListSchema,
  type ExportReceipt,
  type ExportPrintData,
  type PendingApproveExportListItem,
} from "../schemas/export.schema";

function toCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const camel = key.charAt(0).toLowerCase() + key.slice(1);
      out[camel] = toCamelCase((obj as Record<string, unknown>)[key]);
    }
    return out;
  }
  return obj;
}

export const exportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createExportReceipt: builder.mutation<ExportReceipt, { orderId: number }>({
      query: (body) => ({
        url: "Exports",
        method: "POST",
        body,
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = exportReceiptSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid export receipt response");
        return parsed.data;
      },
    }),

    getExportReceiptById: builder.query<ExportReceipt, number>({
      query: (id) => ({
        url: `Exports/${id}`,
        method: "GET",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = exportReceiptSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid export receipt response");
        return parsed.data;
      },
    }),

    getExportPrintData: builder.query<ExportPrintData, number>({
      query: (id) => ({
        url: `Exports/${id}/print-data`,
        method: "GET",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = exportPrintDataSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid export print data response");
        return parsed.data;
      },
    }),

    confirmPickExport: builder.mutation<ExportReceipt, number>({
      query: (id) => ({
        url: `Exports/${id}/confirm-pick`,
        method: "PATCH",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = exportReceiptSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid export receipt response");
        return parsed.data;
      },
    }),

    approveExport: builder.mutation<ExportReceipt, number>({
      query: (id) => ({
        url: `Exports/${id}/approve`,
        method: "PATCH",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = exportReceiptSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid export receipt response");
        return parsed.data;
      },
    }),

    getPendingApproveExports: builder.query<
      PendingApproveExportListItem[],
      { skip?: number; take?: number; sort?: string } | void
    >({
      query: (arg) => ({
        url: "Exports/staff/pending-approve",
        method: "GET",
        params: {
          skip: arg?.skip ?? 0,
          take: arg?.take ?? 50,
          sort: arg?.sort,
        },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = pendingApproveExportListSchema.safeParse(normalized);
        if (!parsed.success) return [];
        return parsed.data;
      },
    }),

    /** Phiếu xuất đã duyệt (Approved) — Manager/Admin xem lịch sử. */
    getApprovedExports: builder.query<
      PendingApproveExportListItem[],
      { skip?: number; take?: number; sort?: string } | void
    >({
      query: (arg) => ({
        url: "Exports/staff/approved",
        method: "GET",
        params: {
          skip: arg?.skip ?? 0,
          take: arg?.take ?? 50,
          sort: arg?.sort,
        },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = pendingApproveExportListSchema.safeParse(normalized);
        if (!parsed.success) return [];
        return parsed.data;
      },
    }),

    /** Phiếu ReadyToExport — kho xem lại đã xác nhận lấy hàng, chờ Manager duyệt. */
    getWarehousePostPickExports: builder.query<
      PendingApproveExportListItem[],
      { skip?: number; take?: number; sort?: string } | void
    >({
      query: (arg) => ({
        url: "Exports/warehouse/post-pick",
        method: "GET",
        params: {
          skip: arg?.skip ?? 0,
          take: arg?.take ?? 50,
          sort: arg?.sort,
        },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = pendingApproveExportListSchema.safeParse(normalized);
        if (!parsed.success) return [];
        return parsed.data;
      },
    }),

    cancelExport: builder.mutation<ExportReceipt, number>({
      query: (id) => ({
        url: `Exports/${id}/cancel`,
        method: "PATCH",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = exportReceiptSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid export receipt response");
        return parsed.data;
      },
    }),
  }),
});

export const {
  useCreateExportReceiptMutation,
  useGetExportReceiptByIdQuery,
  useLazyGetExportReceiptByIdQuery,
  useLazyGetExportPrintDataQuery,
  useGetPendingApproveExportsQuery,
  useGetApprovedExportsQuery,
  useGetWarehousePostPickExportsQuery,
  useConfirmPickExportMutation,
  useApproveExportMutation,
  useCancelExportMutation,
} = exportApi;
