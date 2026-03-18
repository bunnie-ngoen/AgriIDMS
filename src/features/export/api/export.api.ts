import { api } from "../../../shared/api";

export type ExportDetailDto = {
    id: number;
    boxId: number;
    boxCode: string;
    actualQuantity: number;
    boxStatus: string;
};

export type ExportReceiptResponse = {
    id: number;
    exportCode: string;
    orderId: number;
    status: string;
    createdBy: string;
    createdAt: string;
    details: ExportDetailDto[];
};

function mapExportDetail(r: Record<string, unknown>): ExportDetailDto {
    return {
        id: (r.id as number) ?? (r.Id as number) ?? 0,
        boxId: (r.boxId as number) ?? (r.BoxId as number) ?? 0,
        boxCode: String(r.boxCode ?? r.BoxCode ?? ""),
        actualQuantity: Number(r.actualQuantity ?? r.ActualQuantity ?? 0),
        boxStatus: String(r.boxStatus ?? r.BoxStatus ?? ""),
    };
}

function mapExportReceipt(raw: unknown): ExportReceiptResponse {
    const r = raw as Record<string, unknown>;
    const details = (r.details as unknown[] ?? (r.Details as unknown[]) ?? []).map((d) =>
        mapExportDetail(d as Record<string, unknown>)
    );
    return {
        id: (r.id as number) ?? (r.Id as number) ?? 0,
        exportCode: String(r.exportCode ?? r.ExportCode ?? ""),
        orderId: (r.orderId as number) ?? (r.OrderId as number) ?? 0,
        status: String(r.status ?? r.Status ?? ""),
        createdBy: String(r.createdBy ?? r.CreatedBy ?? ""),
        createdAt: String(r.createdAt ?? r.CreatedAt ?? ""),
        details,
    };
}

/** BE: POST api/Exports, GET api/Exports/{id}, PATCH confirm-pick, approve, cancel */
export const exportApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createExportReceipt: builder.mutation<ExportReceiptResponse, { orderId: number }>({
            query: (body) => ({
                url: "Exports",
                method: "POST",
                body: { OrderId: body.orderId },
            }),
            transformResponse: mapExportReceipt,
            invalidatesTags: ["Export", "Order"],
        }),
        getExportReceipt: builder.query<ExportReceiptResponse, number>({
            query: (exportId) => ({ url: `Exports/${exportId}` }),
            transformResponse: mapExportReceipt,
            providesTags: (_res, _err, id) => [{ type: "Export", id }],
        }),
        confirmPick: builder.mutation<ExportReceiptResponse, number>({
            query: (exportId) => ({
                url: `Exports/${exportId}/confirm-pick`,
                method: "PATCH",
            }),
            transformResponse: mapExportReceipt,
            invalidatesTags: ["Export"],
        }),
        approveExport: builder.mutation<ExportReceiptResponse, number>({
            query: (exportId) => ({
                url: `Exports/${exportId}/approve`,
                method: "PATCH",
            }),
            transformResponse: mapExportReceipt,
            invalidatesTags: ["Export", "Order"],
        }),
        cancelExport: builder.mutation<ExportReceiptResponse, number>({
            query: (exportId) => ({
                url: `Exports/${exportId}/cancel`,
                method: "PATCH",
            }),
            transformResponse: mapExportReceipt,
            invalidatesTags: ["Export", "Order"],
        }),
    }),
});

export const {
    useCreateExportReceiptMutation,
    useGetExportReceiptQuery,
    useConfirmPickMutation,
    useApproveExportMutation,
    useCancelExportMutation,
} = exportApi;
