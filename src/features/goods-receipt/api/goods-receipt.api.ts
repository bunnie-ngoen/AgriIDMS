import { api } from "../../../shared/api";
import type {
  GoodsReceiptSummary,
  GoodsReceiptResponse,
  GoodsReceiptForApprovalResponse,
  LotSummary,
  BoxByQrResponse,
  SlotByQrResponse,
  CreateGoodsReceiptRequest,
  AddGoodsReceiptDetailRequest,
  UpdateTruckWeightRequest,
  QCInspectionRequest,
  CreateBoxesRequest,
  AssignBoxToSlotRequest,
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
  unitPrice:
    (row.unitPrice as number | null | undefined) ??
    (row.UnitPrice as number | null | undefined) ??
    null,
  lineTotal:
    (row.lineTotal as number | null | undefined) ??
    (row.LineTotal as number | null | undefined) ??
    null,
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

    getGoodsReceiptForApprovalById: builder.query<
      GoodsReceiptForApprovalResponse,
      number
    >({
      query: (id) => ({ url: `GoodsReceipts/${id}/for-approval` }),
      transformResponse: (raw: unknown): GoodsReceiptForApprovalResponse => {
        const obj = (raw ?? {}) as RawObject;
        const detailsRaw =
          (obj.details as unknown[]) ??
          (obj.Details as unknown[]) ??
          [];

        return {
          ...mapSummary(obj),
          totalAmount:
            (obj.totalAmount as number | null | undefined) ??
            (obj.TotalAmount as number | null | undefined) ??
            null,
          details: detailsRaw.map((d) => mapDetail((d ?? {}) as RawObject)),
        };
      },
      providesTags: (_res, _err, id) => [
        { type: "GoodsReceipt" as const, id },
      ],
    }),

    getLotsByGoodsReceiptId: builder.query<LotSummary[], number>({
      query: (receiptId) => ({ url: `Lots/by-goods-receipt/${receiptId}` }),
      transformResponse: (raw: unknown): LotSummary[] => {
        const arr = Array.isArray(raw) ? raw : [];
        return arr.map((item) => {
          const row = (item ?? {}) as RawObject;
          const received = row.receivedDate ?? row.ReceivedDate;
          const expiry = row.expiryDate ?? row.ExpiryDate;

          return {
            id: (row.id as number) ?? (row.Id as number) ?? 0,
            lotCode:
              (row.lotCode as string) ?? (row.LotCode as string) ?? "",
            totalQuantity:
              (row.totalQuantity as number) ??
              (row.TotalQuantity as number) ??
              0,
            remainingQuantity:
              (row.remainingQuantity as number) ??
              (row.RemainingQuantity as number) ??
              0,
            receivedDate:
              received != null
                ? typeof received === "string"
                  ? received
                  : new Date(received as string | number).toISOString()
                : "",
            expiryDate:
              expiry != null
                ? typeof expiry === "string"
                  ? expiry
                  : new Date(expiry as string | number).toISOString()
                : "",
          };
        });
      },
    }),

    getBoxByQr: builder.query<BoxByQrResponse, string>({
      query: (qrCode) => ({ url: `Boxes/by-qr/${encodeURIComponent(qrCode)}` }),
      transformResponse: (raw: unknown): BoxByQrResponse => {
        const row = (raw ?? {}) as RawObject;
        const placed = row.placedInColdAt ?? row.PlacedInColdAt;

        return {
          id: (row.id as number) ?? (row.Id as number) ?? 0,
          boxCode: (row.boxCode as string) ?? (row.BoxCode as string) ?? "",
          qrCode:
            (row.qrCode as string | null | undefined) ??
            (row.QRCode as string | null | undefined) ??
            null,
          weight: (row.weight as number) ?? (row.Weight as number) ?? 0,
          status: (row.status as string) ?? (row.Status as string) ?? "",
          slotId:
            (row.slotId as number | null | undefined) ??
            (row.SlotId as number | null | undefined) ??
            null,
          warehouseId:
            (row.warehouseId as number | null | undefined) ??
            (row.WarehouseId as number | null | undefined) ??
            null,
          lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
          placedInColdAt:
            placed != null
              ? typeof placed === "string"
                ? placed
                : new Date(placed as string | number).toISOString()
              : null,
        };
      },
    }),

    getSlotByQr: builder.query<SlotByQrResponse, string>({
      query: (qrCode) => ({ url: `slots/by-qr/${encodeURIComponent(qrCode)}` }),
      transformResponse: (raw: unknown): SlotByQrResponse => {
        const row = (raw ?? {}) as RawObject;
        return {
          id: (row.id as number) ?? (row.Id as number) ?? 0,
          code: (row.code as string) ?? (row.Code as string) ?? "",
          qrCode:
            (row.qrCode as string | null | undefined) ??
            (row.QrCode as string | null | undefined) ??
            null,
          capacity: (row.capacity as number) ?? (row.Capacity as number) ?? 0,
          currentCapacity:
            (row.currentCapacity as number) ??
            (row.CurrentCapacity as number) ??
            0,
          rackId: (row.rackId as number) ?? (row.RackId as number) ?? 0,
        };
      },
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
      transformResponse: (raw: unknown): { message: string; receiptId: number } => {
        if (raw && typeof raw === "object") {
          const obj = raw as RawObject;
          return {
            message:
              (obj.message as string) ?? (obj.Message as string) ?? "OK",
            receiptId:
              (obj.receiptId as number) ?? (obj.ReceiptId as number) ?? 0,
          };
        }
        return { message: "OK", receiptId: 0 };
      },
      invalidatesTags: [{ type: "GoodsReceipt" as const, id: "LIST" }],
    }),

    addGoodsReceiptDetail: builder.mutation<
      { message: string },
      AddGoodsReceiptDetailRequest
    >({
      query: (body) => ({
        url: "goods-receipt-details",
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
        body: {
          detailId: body.detailId,
          usableWeight: body.usableWeight,
        },
      }),
      invalidatesTags: (_res, _err, arg) => {
        const tags = [{ type: "GoodsReceipt" as const, id: "LIST" as const }];
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

    managerAllowQc: builder.mutation<{ message: string }, number>({
      query: (receiptId) => ({
        url: `GoodsReceipts/${receiptId}/manager-allow-qc`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, receiptId) => [
        { type: "GoodsReceipt" as const, id: receiptId },
        { type: "GoodsReceipt" as const, id: "LIST" },
      ],
    }),

    managerReviewMinWeight: builder.mutation<
      { message: string },
      { receiptId: number; approve: boolean }
    >({
      query: ({ receiptId, approve }) => ({
        url: `GoodsReceipts/${receiptId}/manager-review-min`,
        method: "POST",
        body: { approve },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "GoodsReceipt" as const, id: arg.receiptId },
        { type: "GoodsReceipt" as const, id: "LIST" },
      ],
    }),

    managerReviewTolerance: builder.mutation<
      { message: string },
      { receiptId: number; approve: boolean }
    >({
      query: ({ receiptId, approve }) => ({
        url: `GoodsReceipts/${receiptId}/manager-review-tolerance`,
        method: "POST",
        body: { approve },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "GoodsReceipt" as const, id: arg.receiptId },
        { type: "GoodsReceipt" as const, id: "LIST" },
      ],
    }),

    updateGoodsReceiptWarehouse: builder.mutation<
      { message: string },
      { receiptId: number; warehouseId: number }
    >({
      query: ({ receiptId, warehouseId }) => ({
        url: `GoodsReceipts/${receiptId}/warehouse`,
        method: "PATCH",
        body: { warehouseId },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "GoodsReceipt" as const, id: arg.receiptId },
        { type: "GoodsReceipt" as const, id: "LIST" },
      ],
    }),

    assignBoxToSlot: builder.mutation<
      { message: string },
      AssignBoxToSlotRequest
    >({
      query: (body) => ({
        url: "Boxes/assign-slot",
        method: "POST",
        body,
      }),
      transformResponse: (raw: unknown): { message: string } => {
        if (raw && typeof raw === "object") {
          const obj = raw as RawObject;
          return {
            message:
              (obj.message as string) ??
              (obj.Message as string) ??
              "Đã gán box vào slot thành công",
          };
        }
        return { message: "Đã gán box vào slot thành công" };
      },
    }),
  }),
});

export const {
  useGetGoodsReceiptsQuery,
  useGetGoodsReceiptByIdQuery,
  useGetGoodsReceiptForApprovalByIdQuery,
  useCreateGoodsReceiptMutation,
  useAddGoodsReceiptDetailMutation,
  useUpdateTruckWeightMutation,
  useQcInspectionMutation,
  useCreateBoxesMutation,
  useApproveGoodsReceiptMutation,
  useManagerApproveGoodsReceiptMutation,
  useManagerRejectGoodsReceiptMutation,
  useManagerAllowQcMutation,
  useManagerReviewMinWeightMutation,
  useManagerReviewToleranceMutation,
  useUpdateGoodsReceiptWarehouseMutation,
  useGetLotsByGoodsReceiptIdQuery,
  useLazyGetBoxByQrQuery,
  useLazyGetSlotByQrQuery,
  useAssignBoxToSlotMutation,
} = goodsReceiptApi;

