import { api } from "../../../shared/api";
import type {
  GoodsReceiptSummary,
  GoodsReceiptResponse,
  CreateGoodsReceiptRequest,
  AddGoodsReceiptDetailRequest,
  UpdateTruckWeightRequest,
  QCInspectionRequest,
  CreateBoxesRequest,
} from "../types/goods-receipt.type";

type RawObject = Record<string, unknown>;

const mapSummary = (row: RawObject): GoodsReceiptSummary => {
  const receivedDate = row.receivedDate ?? row.ReceivedDate;

  return {
    id: (row.id as number) ?? (row.Id as number) ?? 0,
    receiptId: (row.receiptId as number) ?? (row.ReceiptId as number),
    receiptCode:
      (row.receiptCode as string) ?? (row.ReceiptCode as string) ?? "",
    status: (row.status as string) ?? (row.Status as string) ?? "",
    purchaseOrderId:
      (row.purchaseOrderId as number | null) ??
      (row.PurchaseOrderId as number | null) ??
      null,
    supplierId:
      (row.supplierId as number) ?? (row.SupplierId as number) ?? 0,
    supplierName:
      (row.supplierName as string) ??
      (row.SupplierName as string) ??
      "",
    warehouseId:
      (row.warehouseId as number) ?? (row.WarehouseId as number) ?? 0,
    warehouseName:
      (row.warehouseName as string) ??
      (row.WarehouseName as string) ??
      "",
    receivedDate:
      receivedDate != null
        ? typeof receivedDate === "string"
          ? receivedDate
          : new Date(receivedDate as string | number).toISOString()
        : "",
    totalReceivedWeight:
      (row.totalReceivedWeight as number) ??
      (row.TotalReceivedWeight as number) ??
      0,
    totalUsableWeight:
      (row.totalUsableWeight as number) ??
      (row.TotalUsableWeight as number) ??
      0,
  };
};

const mapDetail = (row: RawObject) => ({
  id: (row.id as number) ?? (row.Id as number) ?? 0,
  productVariantId:
    (row.productVariantId as number) ??
    (row.ProductVariantId as number) ??
    0,
  productName:
    (row.productName as string) ?? (row.ProductName as string) ?? "",
  receivedWeight:
    (row.receivedWeight as number) ??
    (row.ReceivedWeight as number) ??
    0,
  usableWeight:
    (row.usableWeight as number) ?? (row.UsableWeight as number) ?? 0,
  rejectWeight:
    (row.rejectWeight as number) ?? (row.RejectWeight as number) ?? 0,
  qcResult: (row.qcResult as string) ?? (row.QCResult as string) ?? "",
});

export const goodsReceiptApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGoodsReceipts: builder.query<GoodsReceiptSummary[], void>({
      query: () => ({ url: "GoodsReceipts" }),
      transformResponse: (raw: unknown): GoodsReceiptSummary[] => {
        let arr: unknown[] = [];
        if (Array.isArray(raw)) {
          arr = raw;
        } else if (raw && typeof raw === "object") {
          const obj = raw as RawObject;
          if (Array.isArray(obj.data)) arr = obj.data;
          else if (Array.isArray(obj.result)) arr = obj.result;
        }
        return arr.map((item) => mapSummary((item ?? {}) as RawObject));
      },
      providesTags: (result) =>
        result
          ? [
              { type: "GoodsReceipt" as const, id: "LIST" },
              ...result.map((r) => ({
                type: "GoodsReceipt" as const,
                id: r.id,
              })),
            ]
          : [{ type: "GoodsReceipt" as const, id: "LIST" }],
    }),

    getGoodsReceiptById: builder.query<GoodsReceiptResponse, number>({
      query: (id) => ({ url: `GoodsReceipts/${id}` }),
      transformResponse: (raw: unknown): GoodsReceiptResponse => {
        const obj = (raw ?? {}) as RawObject;
        const detailsRaw =
          (obj.details as unknown[]) ??
          (obj.Details as unknown[]) ??
          [];

        return {
          ...mapSummary(obj),
          details: detailsRaw.map((d) => mapDetail((d ?? {}) as RawObject)),
        };
      },
      providesTags: (_res, _err, id) => [
        { type: "GoodsReceipt" as const, id },
      ],
    }),

    createGoodsReceipt: builder.mutation<
      { message: string; receiptId: number },
      CreateGoodsReceiptRequest
    >({
      query: (body) => ({
        url: "GoodsReceipts",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "GoodsReceipt" as const, id: "LIST" }],
    }),

    addGoodsReceiptDetail: builder.mutation<
      { message: string },
      AddGoodsReceiptDetailRequest
    >({
      query: (body) => ({
        url: "GoodsReceipts/detail",
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "GoodsReceipt" as const, id: arg.goodsReceiptId },
      ],
    }),

    updateTruckWeight: builder.mutation<
      { message: string },
      UpdateTruckWeightRequest
    >({
      query: (body) => ({
        url: "GoodsReceipts/truck-weight",
        method: "PUT",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "GoodsReceipt" as const, id: arg.goodsReceiptId },
      ],
    }),

    qcInspection: builder.mutation<{ message: string }, QCInspectionRequest>({
      query: (body) => ({
        url: "GoodsReceipts/qc",
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => {
        const tags = [{ type: "GoodsReceipt" as const, id: "LIST" as const }];
        if (arg.goodsReceiptId) {
          tags.push({
            type: "GoodsReceipt" as const,
            id: arg.goodsReceiptId,
          });
        }
        return tags;
      },
    }),

    createBoxes: builder.mutation<{ message: string }, CreateBoxesRequest>({
      query: (body) => ({
        url: "GoodsReceipts/boxes",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "GoodsReceipt" as const, id: "LIST" }],
    }),

    approveGoodsReceipt: builder.mutation<{ message: string }, number>({
      query: (receiptId) => ({
        url: `GoodsReceipts/${receiptId}/approve`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, receiptId) => [
        { type: "GoodsReceipt" as const, id: receiptId },
        { type: "GoodsReceipt" as const, id: "LIST" },
      ],
    }),

    managerApproveGoodsReceipt: builder.mutation<{ message: string }, number>({
      query: (receiptId) => ({
        url: `GoodsReceipts/${receiptId}/manager-approve`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, receiptId) => [
        { type: "GoodsReceipt" as const, id: receiptId },
        { type: "GoodsReceipt" as const, id: "LIST" },
      ],
    }),

    managerRejectGoodsReceipt: builder.mutation<{ message: string }, number>({
      query: (receiptId) => ({
        url: `GoodsReceipts/${receiptId}/manager-reject`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, receiptId) => [
        { type: "GoodsReceipt" as const, id: receiptId },
        { type: "GoodsReceipt" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetGoodsReceiptsQuery,
  useGetGoodsReceiptByIdQuery,
  useCreateGoodsReceiptMutation,
  useAddGoodsReceiptDetailMutation,
  useUpdateTruckWeightMutation,
  useQcInspectionMutation,
  useCreateBoxesMutation,
  useApproveGoodsReceiptMutation,
  useManagerApproveGoodsReceiptMutation,
  useManagerRejectGoodsReceiptMutation,
} = goodsReceiptApi;

