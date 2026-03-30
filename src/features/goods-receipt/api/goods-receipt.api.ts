import { api } from "../../../shared/api";
import type {
  GoodsReceiptSummary,
  GoodsReceiptResponse,
  GoodsReceiptForApprovalResponse,
  LotSummary,
  LotListItem,
  LotDetail,
  LotBoxItem,
  LotByQrResponse,
  BoxByQrResponse,
  BoxCreatedItem,
  SlotByQrResponse,
  CreateGoodsReceiptRequest,
  AddGoodsReceiptDetailRequest,
  UpdateTruckWeightRequest,
  QCInspectionRequest,
  CreateBoxesRequest,
  AssignBoxToSlotRequest,
  AssignBoxesToSlotRequest,
  TransferBoxToSlotRequest,
  NearExpiryDashboard,
  DisposeHistoryItem,
} from "../types/goods-receipt.type";

type RawObject = Record<string, unknown>;

const mapSummary = (row: RawObject): GoodsReceiptSummary => {
  const receivedDate = row.receivedDate ?? row.ReceivedDate;
  const createdByName =
    (row.createdByName as string) ??
    (row.CreatedByName as string) ??
    (row.createdBy as string) ??
    (row.CreatedBy as string) ??
    (row.creatorName as string) ??
    (row.CreatorName as string) ??
    (row.nameCreater as string) ??
    (row.NameCreater as string) ??
    "";

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
    createdByName: createdByName || undefined,
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

const mapLotListItem = (row: RawObject): LotListItem => ({
  lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
  lotCode: (row.lotCode as string) ?? (row.LotCode as string) ?? "",
  qrImageUrl:
    (row.qrImageUrl as string | null | undefined) ??
    (row.QrImageUrl as string | null | undefined) ??
    null,
  totalQuantity:
    (row.totalQuantity as number) ?? (row.TotalQuantity as number) ?? 0,
  remainingQuantity:
    (row.remainingQuantity as number) ??
    (row.RemainingQuantity as number) ??
    0,
  receivedDate:
    ((row.receivedDate as string) ?? (row.ReceivedDate as string) ?? "") || "",
  expiryDate:
    ((row.expiryDate as string) ?? (row.ExpiryDate as string) ?? "") || "",
  status: (row.status as string) ?? (row.Status as string) ?? "",
  goodsReceiptId:
    (row.goodsReceiptId as number) ?? (row.GoodsReceiptId as number) ?? 0,
  productName: (row.productName as string) ?? (row.ProductName as string) ?? "",
  productVariantName:
    (row.productVariantName as string) ??
    (row.ProductVariantName as string) ??
    "",
  warehouseName:
    (row.warehouseName as string) ?? (row.WarehouseName as string) ?? "",
});

const mapLotBoxItem = (row: RawObject): LotBoxItem => ({
  boxId: (row.boxId as number) ?? (row.BoxId as number) ?? 0,
  boxCode: (row.boxCode as string) ?? (row.BoxCode as string) ?? "",
  weight: (row.weight as number) ?? (row.Weight as number) ?? 0,
  status: (row.status as string) ?? (row.Status as string) ?? "",
  slotId:
    (row.slotId as number | null | undefined) ??
    (row.SlotId as number | null | undefined) ??
    null,
  slotCode:
    (row.slotCode as string | null | undefined) ??
    (row.SlotCode as string | null | undefined) ??
    null,
  qrCode:
    (row.qrCode as string | null | undefined) ??
    (row.QrCode as string | null | undefined) ??
    null,
  qrImageUrl:
    (row.qrImageUrl as string | null | undefined) ??
    (row.QrImageUrl as string | null | undefined) ??
    null,
  createdAt:
    ((row.createdAt as string) ?? (row.CreatedAt as string) ?? "") || "",
});

const mapLotDetail = (row: RawObject): LotDetail => {
  const boxesRaw = (row.boxes as unknown[]) ?? (row.Boxes as unknown[]) ?? [];

  return {
    lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
    lotCode: (row.lotCode as string) ?? (row.LotCode as string) ?? "",
    qrImageUrl:
      (row.qrImageUrl as string | null | undefined) ??
      (row.QrImageUrl as string | null | undefined) ??
      null,
    totalQuantity:
      (row.totalQuantity as number) ?? (row.TotalQuantity as number) ?? 0,
    remainingQuantity:
      (row.remainingQuantity as number) ??
      (row.RemainingQuantity as number) ??
      0,
    receivedDate:
      ((row.receivedDate as string) ?? (row.ReceivedDate as string) ?? "") || "",
    expiryDate:
      ((row.expiryDate as string) ?? (row.ExpiryDate as string) ?? "") || "",
    status: (row.status as string) ?? (row.Status as string) ?? "",
    goodsReceiptId:
      (row.goodsReceiptId as number) ?? (row.GoodsReceiptId as number) ?? 0,
    productName: (row.productName as string) ?? (row.ProductName as string) ?? "",
    productVariantName:
      (row.productVariantName as string) ??
      (row.ProductVariantName as string) ??
      "",
    warehouseName:
      (row.warehouseName as string) ?? (row.WarehouseName as string) ?? "",
    boxes: Array.isArray(boxesRaw)
      ? boxesRaw.map((b) => mapLotBoxItem((b ?? {}) as RawObject))
      : [],
  };
};

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
            qrImageUrl:
              (row.qrImageUrl as string | null | undefined) ??
              (row.QrImageUrl as string | null | undefined) ??
              null,
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

    getAllLots: builder.query<LotListItem[], void>({
      query: () => ({ url: "Lots" }),
      transformResponse: (raw: unknown): LotListItem[] => {
        const arr = Array.isArray(raw) ? raw : [];
        return arr.map((item) => mapLotListItem((item ?? {}) as RawObject));
      },
    }),

    getLotDetailById: builder.query<LotDetail, number>({
      query: (lotId) => ({ url: `Lots/${lotId}` }),
      transformResponse: (raw: unknown): LotDetail =>
        mapLotDetail((raw ?? {}) as RawObject),
    }),

    getLotByQr: builder.query<LotByQrResponse, string>({
      query: (qrCode) => ({ url: `Lots/by-qr/${encodeURIComponent(qrCode)}` }),
      transformResponse: (raw: unknown): LotByQrResponse => {
        const row = (raw ?? {}) as RawObject;
        return {
          id: (row.id as number) ?? (row.Id as number) ?? 0,
          lotCode:
            (row.lotCode as string) ?? (row.LotCode as string) ?? "",
          qrImageUrl:
            (row.qrImageUrl as string | null | undefined) ??
            (row.QrImageUrl as string | null | undefined) ??
            null,
          expiryDate:
            (row.expiryDate as string | Date | undefined) ??
            (row.ExpiryDate as string | Date | undefined) ??
            "",
          receivedDate:
            (row.receivedDate as string | Date | undefined) ??
            (row.ReceivedDate as string | Date | undefined) ??
            "",
          totalQuantity:
            (row.totalQuantity as number) ?? (row.TotalQuantity as number) ?? 0,
          remainingQuantity:
            (row.remainingQuantity as number) ??
            (row.RemainingQuantity as number) ??
            0,
          status: (row.status as string) ?? (row.Status as string) ?? "",
          productVariantId:
            (row.productVariantId as number | null | undefined) ??
            (row.ProductVariantId as number | null | undefined) ??
            null,
          productVariantName:
            (row.productVariantName as string | null | undefined) ??
            (row.ProductVariantName as string | null | undefined) ??
            null,
          productName:
            (row.productName as string | null | undefined) ??
            (row.ProductName as string | null | undefined) ??
            null,
          warehouseId:
            (row.warehouseId as number | null | undefined) ??
            (row.WarehouseId as number | null | undefined) ??
            null,
        };
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
          qrImageUrl:
            (row.qrImageUrl as string | null | undefined) ??
            (row.QrImageUrl as string | null | undefined) ??
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
          warehouseName:
            (row.warehouseName as string | null | undefined) ??
            (row.WarehouseName as string | null | undefined) ??
            null,
          slotCode:
            (row.slotCode as string | null | undefined) ??
            (row.SlotCode as string | null | undefined) ??
            null,
          lotCode:
            (row.lotCode as string | null | undefined) ??
            (row.LotCode as string | null | undefined) ??
            null,
          lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
          productVariantId:
            (row.productVariantId as number | null | undefined) ??
            (row.ProductVariantId as number | null | undefined) ??
            null,
          productVariantName:
            (row.productVariantName as string | null | undefined) ??
            (row.ProductVariantName as string | null | undefined) ??
            null,
          productName:
            (row.productName as string | null | undefined) ??
            (row.ProductName as string | null | undefined) ??
            null,
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
          qrImageUrl:
            (row.qrImageUrl as string | null | undefined) ??
            (row.QrImageUrl as string | null | undefined) ??
            null,
          capacity: (row.capacity as number) ?? (row.Capacity as number) ?? 0,
          currentCapacity:
            (row.currentCapacity as number) ??
            (row.CurrentCapacity as number) ??
            0,
          rackId: (row.rackId as number) ?? (row.RackId as number) ?? 0,
          rackName:
            (row.rackName as string | null | undefined) ??
            (row.RackName as string | null | undefined) ??
            null,
        };
      },
    }),

    getUnassignedBoxesByWarehouse: builder.query<
      BoxByQrResponse[],
      number
    >({
      query: (warehouseId) => ({
        url: `Boxes/unassigned?warehouseId=${warehouseId}`,
      }),
      transformResponse: (raw: unknown): BoxByQrResponse[] => {
        const arr = (raw as unknown as RawObject[]) ?? [];
        if (!Array.isArray(arr)) return [];

        return arr.map((row) => {
          const placed = row.placedInColdAt ?? row.PlacedInColdAt;

          return {
            id: (row.id as number) ?? (row.Id as number) ?? 0,
            boxCode:
              (row.boxCode as string) ??
              (row.BoxCode as string) ??
              "",
            qrCode:
              (row.qrCode as string | null | undefined) ??
              (row.QRCode as string | null | undefined) ??
              (row.QrCode as string | null | undefined) ??
              null,
            qrImageUrl:
              (row.qrImageUrl as string | null | undefined) ??
              (row.QrImageUrl as string | null | undefined) ??
              null,
            weight: (row.weight as number) ?? (row.Weight as number) ?? 0,
            status:
              (row.status as string) ??
              (row.Status as string) ??
              "",
            slotId:
              (row.slotId as number | null | undefined) ??
              (row.SlotId as number | null | undefined) ??
              null,
            warehouseId:
              (row.warehouseId as number | null | undefined) ??
              (row.WarehouseId as number | null | undefined) ??
              null,
            warehouseName:
              (row.warehouseName as string | null | undefined) ??
              (row.WarehouseName as string | null | undefined) ??
              null,
            lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
            lotCode:
              (row.lotCode as string | null | undefined) ??
              (row.LotCode as string | null | undefined) ??
              null,
            slotCode:
              (row.slotCode as string | null | undefined) ??
              (row.SlotCode as string | null | undefined) ??
              null,
            productVariantId:
              (row.productVariantId as number | null | undefined) ??
              (row.ProductVariantId as number | null | undefined) ??
              null,
            productVariantName:
              (row.productVariantName as string | null | undefined) ??
              (row.ProductVariantName as string | null | undefined) ??
              null,
            productName:
              (row.productName as string | null | undefined) ??
              (row.ProductName as string | null | undefined) ??
              null,
            receivedDate:
              (row.receivedDate as string | null | undefined) ??
              (row.ReceivedDate as string | null | undefined) ??
              null,
            expiryDate:
              (row.expiryDate as string | null | undefined) ??
              (row.ExpiryDate as string | null | undefined) ??
              null,
            placedInColdAt:
              placed != null
                ? typeof placed === "string"
                  ? placed
                  : new Date(placed as string | number).toISOString()
                : null,
          };
        });
      },
    }),

    getBoxesByGoodsReceiptId: builder.query<BoxByQrResponse[], number>({
      query: (goodsReceiptId) => ({
        url: `Boxes/by-goods-receipt/${goodsReceiptId}`,
      }),
      transformResponse: (raw: unknown): BoxByQrResponse[] => {
        const arr = (raw as unknown as RawObject[]) ?? [];
        if (!Array.isArray(arr)) return [];

        return arr.map((row) => {
          const placed = row.placedInColdAt ?? row.PlacedInColdAt;
          return {
            id: (row.id as number) ?? (row.Id as number) ?? 0,
            boxCode:
              (row.boxCode as string) ??
              (row.BoxCode as string) ??
              "",
            qrCode:
              (row.qrCode as string | null | undefined) ??
              (row.QRCode as string | null | undefined) ??
              (row.QrCode as string | null | undefined) ??
              null,
            qrImageUrl:
              (row.qrImageUrl as string | null | undefined) ??
              (row.QrImageUrl as string | null | undefined) ??
              null,
            weight: (row.weight as number) ?? (row.Weight as number) ?? 0,
            status:
              (row.status as string) ??
              (row.Status as string) ??
              "",
            slotId:
              (row.slotId as number | null | undefined) ??
              (row.SlotId as number | null | undefined) ??
              null,
            warehouseId:
              (row.warehouseId as number | null | undefined) ??
              (row.WarehouseId as number | null | undefined) ??
              null,
            warehouseName:
              (row.warehouseName as string | null | undefined) ??
              (row.WarehouseName as string | null | undefined) ??
              null,
            lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
            lotCode:
              (row.lotCode as string | null | undefined) ??
              (row.LotCode as string | null | undefined) ??
              null,
            slotCode:
              (row.slotCode as string | null | undefined) ??
              (row.SlotCode as string | null | undefined) ??
              null,
            productVariantId:
              (row.productVariantId as number | null | undefined) ??
              (row.ProductVariantId as number | null | undefined) ??
              null,
            productVariantName:
              (row.productVariantName as string | null | undefined) ??
              (row.ProductVariantName as string | null | undefined) ??
              null,
            productName:
              (row.productName as string | null | undefined) ??
              (row.ProductName as string | null | undefined) ??
              null,
            receivedDate:
              (row.receivedDate as string | null | undefined) ??
              (row.ReceivedDate as string | null | undefined) ??
              null,
            expiryDate:
              (row.expiryDate as string | null | undefined) ??
              (row.ExpiryDate as string | null | undefined) ??
              null,
            placedInColdAt:
              placed != null
                ? typeof placed === "string"
                  ? placed
                  : new Date(placed as string | number).toISOString()
                : null,
          };
        });
      },
    }),

    getDamagedBoxes: builder.query<BoxByQrResponse[], number | void>({
      query: (warehouseId) => ({
        url:
          typeof warehouseId === "number" && warehouseId > 0
            ? `Boxes/damaged?warehouseId=${warehouseId}`
            : "Boxes/damaged",
      }),
      transformResponse: (raw: unknown): BoxByQrResponse[] => {
        const arr = (raw as unknown as RawObject[]) ?? [];
        if (!Array.isArray(arr)) return [];

        return arr.map((row) => {
          const placed = row.placedInColdAt ?? row.PlacedInColdAt;
          return {
            id: (row.id as number) ?? (row.Id as number) ?? 0,
            boxCode:
              (row.boxCode as string) ??
              (row.BoxCode as string) ??
              "",
            qrCode:
              (row.qrCode as string | null | undefined) ??
              (row.QRCode as string | null | undefined) ??
              (row.QrCode as string | null | undefined) ??
              null,
            qrImageUrl:
              (row.qrImageUrl as string | null | undefined) ??
              (row.QrImageUrl as string | null | undefined) ??
              null,
            weight: (row.weight as number) ?? (row.Weight as number) ?? 0,
            status:
              (row.status as string) ??
              (row.Status as string) ??
              "",
            slotId:
              (row.slotId as number | null | undefined) ??
              (row.SlotId as number | null | undefined) ??
              null,
            warehouseId:
              (row.warehouseId as number | null | undefined) ??
              (row.WarehouseId as number | null | undefined) ??
              null,
            warehouseName:
              (row.warehouseName as string | null | undefined) ??
              (row.WarehouseName as string | null | undefined) ??
              null,
            lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
            lotCode:
              (row.lotCode as string | null | undefined) ??
              (row.LotCode as string | null | undefined) ??
              null,
            slotCode:
              (row.slotCode as string | null | undefined) ??
              (row.SlotCode as string | null | undefined) ??
              null,
            productVariantId:
              (row.productVariantId as number | null | undefined) ??
              (row.ProductVariantId as number | null | undefined) ??
              null,
            productVariantName:
              (row.productVariantName as string | null | undefined) ??
              (row.ProductVariantName as string | null | undefined) ??
              null,
            productName:
              (row.productName as string | null | undefined) ??
              (row.ProductName as string | null | undefined) ??
              null,
            receivedDate:
              (row.receivedDate as string | null | undefined) ??
              (row.ReceivedDate as string | null | undefined) ??
              null,
            expiryDate:
              (row.expiryDate as string | null | undefined) ??
              (row.ExpiryDate as string | null | undefined) ??
              null,
            placedInColdAt:
              placed != null
                ? typeof placed === "string"
                  ? placed
                  : new Date(placed as string | number).toISOString()
                : null,
          };
        });
      },
    }),

    getExpiredBoxesByWarehouse: builder.query<BoxByQrResponse[], number>({
      query: (warehouseId) => ({
        url: `Boxes/expired?warehouseId=${warehouseId}`,
      }),
      transformResponse: (raw: unknown): BoxByQrResponse[] => {
        const arr = (raw as unknown as RawObject[]) ?? [];
        if (!Array.isArray(arr)) return [];

        return arr.map((row) => {
          const placed = row.placedInColdAt ?? row.PlacedInColdAt;
          return {
            id: (row.id as number) ?? (row.Id as number) ?? 0,
            boxCode:
              (row.boxCode as string) ??
              (row.BoxCode as string) ??
              "",
            qrCode:
              (row.qrCode as string | null | undefined) ??
              (row.QRCode as string | null | undefined) ??
              (row.QrCode as string | null | undefined) ??
              null,
            qrImageUrl:
              (row.qrImageUrl as string | null | undefined) ??
              (row.QrImageUrl as string | null | undefined) ??
              null,
            weight: (row.weight as number) ?? (row.Weight as number) ?? 0,
            status:
              (row.status as string) ??
              (row.Status as string) ??
              "",
            slotId:
              (row.slotId as number | null | undefined) ??
              (row.SlotId as number | null | undefined) ??
              null,
            warehouseId:
              (row.warehouseId as number | null | undefined) ??
              (row.WarehouseId as number | null | undefined) ??
              null,
            warehouseName:
              (row.warehouseName as string | null | undefined) ??
              (row.WarehouseName as string | null | undefined) ??
              null,
            lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
            lotCode:
              (row.lotCode as string | null | undefined) ??
              (row.LotCode as string | null | undefined) ??
              null,
            slotCode:
              (row.slotCode as string | null | undefined) ??
              (row.SlotCode as string | null | undefined) ??
              null,
            productVariantId:
              (row.productVariantId as number | null | undefined) ??
              (row.ProductVariantId as number | null | undefined) ??
              null,
            productVariantName:
              (row.productVariantName as string | null | undefined) ??
              (row.ProductVariantName as string | null | undefined) ??
              null,
            productName:
              (row.productName as string | null | undefined) ??
              (row.ProductName as string | null | undefined) ??
              null,
            receivedDate:
              (row.receivedDate as string | null | undefined) ??
              (row.ReceivedDate as string | null | undefined) ??
              null,
            expiryDate:
              (row.expiryDate as string | null | undefined) ??
              (row.ExpiryDate as string | null | undefined) ??
              null,
            placedInColdAt:
              placed != null
                ? typeof placed === "string"
                  ? placed
                  : new Date(placed as string | number).toISOString()
                : null,
          };
        });
      },
    }),

    disposeExpiredBoxes: builder.mutation<
      {
        message: string;
        requestedCount: number;
        disposedCount: number;
        skippedCount: number;
      },
      { boxIds: number[] }
    >({
      query: (body) => ({
        url: "Boxes/dispose-expired",
        method: "POST",
        body,
      }),
      transformResponse: (raw: unknown) => {
        const obj = (raw ?? {}) as RawObject;
        return {
          message:
            (obj.message as string) ??
            (obj.Message as string) ??
            "Đã tiêu hủy box hết hạn",
          requestedCount:
            (obj.requestedCount as number) ??
            (obj.RequestedCount as number) ??
            0,
          disposedCount:
            (obj.disposedCount as number) ??
            (obj.DisposedCount as number) ??
            0,
          skippedCount:
            (obj.skippedCount as number) ??
            (obj.SkippedCount as number) ??
            0,
        };
      },
      invalidatesTags: [
        { type: "Slot" as const },
        { type: "SlotContents" as const, id: "LIST" },
        { type: "Warehouse" as const, id: "LIST" },
      ],
    }),

    createDisposalRequest: builder.mutation<
      { id: number; message: string },
      { warehouseId: number; boxIds: number[]; reason: string }
    >({
      query: (body) => ({
        url: "DisposalRequests",
        method: "POST",
        body,
      }),
      transformResponse: (raw: unknown) => {
        const obj = (raw ?? {}) as RawObject;
        return {
          id: (obj.id as number) ?? (obj.Id as number) ?? 0,
          message:
            (obj.message as string) ??
            (obj.Message as string) ??
            "Đã gửi yêu cầu tiêu hủy, chờ Quản lí duyệt.",
        };
      },
      invalidatesTags: [{ type: "Notification" as const, id: "LIST" }],
    }),

    directDisposeBoxes: builder.mutation<
      { message: string },
      { warehouseId: number; boxIds: number[]; reason: string }
    >({
      query: (body) => ({
        url: "DisposalRequests/direct-dispose",
        method: "POST",
        body,
      }),
      transformResponse: (raw: unknown) => {
        const obj = (raw ?? {}) as RawObject;
        return {
          message:
            (obj.message as string) ??
            (obj.Message as string) ??
            "Đã tiêu hủy hàng hóa thành công.",
        };
      },
      invalidatesTags: [
        { type: "Slot" as const },
        { type: "SlotContents" as const, id: "LIST" },
        { type: "Warehouse" as const, id: "LIST" },
        { type: "Notification" as const, id: "LIST" },
      ],
    }),

    getDisposalRequests: builder.query<
      Array<{
        id: number;
        status: string;
        warehouseId: number;
        warehouseName: string;
        reason: string;
        requestedBy: string;
        requestedByName?: string | null;
        requestedAt: string;
        reviewedBy?: string | null;
        reviewedByName?: string | null;
        reviewedAt?: string | null;
        reviewNote?: string | null;
        boxCount: number;
      }>,
      { status?: string; warehouseId?: number } | void
    >({
      query: (arg) => {
        const q: string[] = [];
        if (arg && arg.status) q.push(`status=${encodeURIComponent(arg.status)}`);
        if (arg && typeof arg.warehouseId === "number" && arg.warehouseId > 0) {
          q.push(`warehouseId=${arg.warehouseId}`);
        }
        return { url: q.length ? `DisposalRequests?${q.join("&")}` : "DisposalRequests" };
      },
      transformResponse: (raw: unknown) => {
        const arr = Array.isArray(raw) ? (raw as RawObject[]) : [];
        return arr.map((row) => ({
          id: (row.id as number) ?? (row.Id as number) ?? 0,
          status: (row.status as string) ?? (row.Status as string) ?? "",
          warehouseId:
            (row.warehouseId as number) ?? (row.WarehouseId as number) ?? 0,
          warehouseName:
            (row.warehouseName as string) ??
            (row.WarehouseName as string) ??
            "",
          reason: (row.reason as string) ?? (row.Reason as string) ?? "",
          requestedBy:
            (row.requestedBy as string) ?? (row.RequestedBy as string) ?? "",
          requestedByName:
            (row.requestedByName as string | null | undefined) ??
            (row.RequestedByName as string | null | undefined) ??
            null,
          requestedAt:
            (row.requestedAt as string) ?? (row.RequestedAt as string) ?? "",
          reviewedBy:
            (row.reviewedBy as string | null | undefined) ??
            (row.ReviewedBy as string | null | undefined) ??
            null,
          reviewedByName:
            (row.reviewedByName as string | null | undefined) ??
            (row.ReviewedByName as string | null | undefined) ??
            null,
          reviewedAt:
            (row.reviewedAt as string | null | undefined) ??
            (row.ReviewedAt as string | null | undefined) ??
            null,
          reviewNote:
            (row.reviewNote as string | null | undefined) ??
            (row.ReviewNote as string | null | undefined) ??
            null,
          boxCount: (row.boxCount as number) ?? (row.BoxCount as number) ?? 0,
        }));
      },
      providesTags: [{ type: "Notification" as const, id: "LIST" }],
    }),

    getDisposalRequestById: builder.query<
      {
        id: number;
        status: string;
        warehouseId: number;
        warehouseName: string;
        reason: string;
        requestedBy: string;
        requestedByName?: string | null;
        requestedAt: string;
        reviewedBy?: string | null;
        reviewedByName?: string | null;
        reviewedAt?: string | null;
        reviewNote?: string | null;
        boxCount: number;
        items: Array<{
          boxId: number;
          boxCode: string;
          weight: number;
          lotCode?: string | null;
          expiryDate?: string | null;
          slotCode?: string | null;
          productName?: string | null;
          productVariantName?: string | null;
        }>;
      },
      number
    >({
      query: (id) => ({ url: `DisposalRequests/${id}` }),
      transformResponse: (raw: unknown) => {
        const row = (raw ?? {}) as RawObject;
        const items = Array.isArray(row.items)
          ? (row.items as RawObject[])
          : Array.isArray(row.Items)
            ? (row.Items as RawObject[])
            : [];
        return {
          id: (row.id as number) ?? (row.Id as number) ?? 0,
          status: (row.status as string) ?? (row.Status as string) ?? "",
          warehouseId:
            (row.warehouseId as number) ?? (row.WarehouseId as number) ?? 0,
          warehouseName:
            (row.warehouseName as string) ??
            (row.WarehouseName as string) ??
            "",
          reason: (row.reason as string) ?? (row.Reason as string) ?? "",
          requestedBy:
            (row.requestedBy as string) ?? (row.RequestedBy as string) ?? "",
          requestedByName:
            (row.requestedByName as string | null | undefined) ??
            (row.RequestedByName as string | null | undefined) ??
            null,
          requestedAt:
            (row.requestedAt as string) ?? (row.RequestedAt as string) ?? "",
          reviewedBy:
            (row.reviewedBy as string | null | undefined) ??
            (row.ReviewedBy as string | null | undefined) ??
            null,
          reviewedByName:
            (row.reviewedByName as string | null | undefined) ??
            (row.ReviewedByName as string | null | undefined) ??
            null,
          reviewedAt:
            (row.reviewedAt as string | null | undefined) ??
            (row.ReviewedAt as string | null | undefined) ??
            null,
          reviewNote:
            (row.reviewNote as string | null | undefined) ??
            (row.ReviewNote as string | null | undefined) ??
            null,
          boxCount: (row.boxCount as number) ?? (row.BoxCount as number) ?? 0,
          items: items.map((it) => ({
            boxId: (it.boxId as number) ?? (it.BoxId as number) ?? 0,
            boxCode: (it.boxCode as string) ?? (it.BoxCode as string) ?? "",
            weight: (it.weight as number) ?? (it.Weight as number) ?? 0,
            lotCode:
              (it.lotCode as string | null | undefined) ??
              (it.LotCode as string | null | undefined) ??
              null,
            expiryDate:
              (it.expiryDate as string | null | undefined) ??
              (it.ExpiryDate as string | null | undefined) ??
              null,
            slotCode:
              (it.slotCode as string | null | undefined) ??
              (it.SlotCode as string | null | undefined) ??
              null,
            productName:
              (it.productName as string | null | undefined) ??
              (it.ProductName as string | null | undefined) ??
              null,
            productVariantName:
              (it.productVariantName as string | null | undefined) ??
              (it.ProductVariantName as string | null | undefined) ??
              null,
          })),
        };
      },
      providesTags: [{ type: "Notification" as const, id: "LIST" }],
    }),

    approveDisposalRequest: builder.mutation<{ message: string }, { id: number; reviewNote?: string }>({
      query: ({ id, reviewNote }) => ({
        url: `DisposalRequests/${id}/approve`,
        method: "POST",
        body: reviewNote ?? "",
      }),
      invalidatesTags: [{ type: "Notification" as const, id: "LIST" }],
    }),

    rejectDisposalRequest: builder.mutation<{ message: string }, { id: number; reviewNote?: string }>({
      query: ({ id, reviewNote }) => ({
        url: `DisposalRequests/${id}/reject`,
        method: "POST",
        body: reviewNote ?? "",
      }),
      invalidatesTags: [{ type: "Notification" as const, id: "LIST" }],
    }),

    getDisposeHistoryByWarehouse: builder.query<
      DisposeHistoryItem[],
      { warehouseId: number; fromDate?: string; toDate?: string; createdBy?: string }
    >({
      query: ({ warehouseId, fromDate, toDate, createdBy }) => {
        const q: string[] = [`warehouseId=${warehouseId}`];
        if (fromDate) q.push(`fromDate=${encodeURIComponent(fromDate)}`);
        if (toDate) q.push(`toDate=${encodeURIComponent(toDate)}`);
        if (createdBy) q.push(`createdBy=${encodeURIComponent(createdBy)}`);
        return { url: `Boxes/dispose-history?${q.join("&")}` };
      },
      transformResponse: (raw: unknown): DisposeHistoryItem[] => {
        const arr = (raw as unknown as RawObject[]) ?? [];
        if (!Array.isArray(arr)) return [];
        return arr.map((row) => ({
          transactionId:
            (row.transactionId as number) ?? (row.TransactionId as number) ?? 0,
          boxId: (row.boxId as number) ?? (row.BoxId as number) ?? 0,
          boxCode: (row.boxCode as string) ?? (row.BoxCode as string) ?? "",
          lotId:
            (row.lotId as number | null | undefined) ??
            (row.LotId as number | null | undefined) ??
            null,
          lotCode:
            (row.lotCode as string | null | undefined) ??
            (row.LotCode as string | null | undefined) ??
            null,
          productName:
            (row.productName as string | null | undefined) ??
            (row.ProductName as string | null | undefined) ??
            null,
          productVariantName:
            (row.productVariantName as string | null | undefined) ??
            (row.ProductVariantName as string | null | undefined) ??
            null,
          quantity: (row.quantity as number) ?? (row.Quantity as number) ?? 0,
          fromSlotId:
            (row.fromSlotId as number | null | undefined) ??
            (row.FromSlotId as number | null | undefined) ??
            null,
          fromSlotCode:
            (row.fromSlotCode as string | null | undefined) ??
            (row.FromSlotCode as string | null | undefined) ??
            null,
          warehouseId:
            (row.warehouseId as number | null | undefined) ??
            (row.WarehouseId as number | null | undefined) ??
            null,
          warehouseName:
            (row.warehouseName as string | null | undefined) ??
            (row.WarehouseName as string | null | undefined) ??
            null,
          createdBy:
            (row.createdBy as string) ?? (row.CreatedBy as string) ?? "",
          createdByName:
            (row.createdByName as string | null | undefined) ??
            (row.CreatedByName as string | null | undefined) ??
            null,
          createdAt:
            (row.createdAt as string) ?? (row.CreatedAt as string) ?? "",
        }));
      },
    }),

    getNearExpiryDashboard: builder.query<
      NearExpiryDashboard,
      { days?: number; warehouseId?: number } | void
    >({
      query: (arg) => {
        const days =
          typeof arg === "object" && arg && typeof arg.days === "number"
            ? arg.days
            : undefined;
        const warehouseId =
          typeof arg === "object" && arg && typeof arg.warehouseId === "number"
            ? arg.warehouseId
            : undefined;
        const q: string[] = [];
        if (days && days > 0) q.push(`days=${days}`);
        if (warehouseId && warehouseId > 0) q.push(`warehouseId=${warehouseId}`);
        return {
          url: q.length > 0 ? `Lots/near-expiry-dashboard?${q.join("&")}` : "Lots/near-expiry-dashboard",
        };
      },
      transformResponse: (raw: unknown): NearExpiryDashboard => {
        const obj = (raw ?? {}) as RawObject;
        const lotsRaw = Array.isArray(obj.lots)
          ? (obj.lots as RawObject[])
          : Array.isArray(obj.Lots)
            ? (obj.Lots as RawObject[])
            : [];

        return {
          daysThreshold:
            (obj.daysThreshold as number) ??
            (obj.DaysThreshold as number) ??
            3,
          totalLots: (obj.totalLots as number) ?? (obj.TotalLots as number) ?? 0,
          totalBoxes:
            (obj.totalBoxes as number) ?? (obj.TotalBoxes as number) ?? 0,
          lots: lotsRaw.map((row) => {
            const boxesRaw = Array.isArray(row.boxes)
              ? (row.boxes as RawObject[])
              : Array.isArray(row.Boxes)
                ? (row.Boxes as RawObject[])
                : [];

            return {
              lotId: (row.lotId as number) ?? (row.LotId as number) ?? 0,
              lotCode:
                (row.lotCode as string) ?? (row.LotCode as string) ?? "",
              productVariantId:
                (row.productVariantId as number) ??
                (row.ProductVariantId as number) ??
                0,
              productName:
                (row.productName as string) ??
                (row.ProductName as string) ??
                "",
              grade: (row.grade as string) ?? (row.Grade as string) ?? "",
              remainingQuantity:
                (row.remainingQuantity as number) ??
                (row.RemainingQuantity as number) ??
                0,
              expiryDate:
                (row.expiryDate as string) ??
                (row.ExpiryDate as string) ??
                "",
              daysLeft:
                (row.daysLeft as number) ?? (row.DaysLeft as number) ?? 0,
              nearExpiryBoxCount:
                (row.nearExpiryBoxCount as number) ??
                (row.NearExpiryBoxCount as number) ??
                0,
              warehouseId:
                (row.warehouseId as number) ??
                (row.WarehouseId as number) ??
                0,
              warehouseName:
                (row.warehouseName as string) ??
                (row.WarehouseName as string) ??
                "",
              status: (row.status as string) ?? (row.Status as string) ?? "",
              suggestedDiscountPercent:
                (row.suggestedDiscountPercent as number | null | undefined) ??
                (row.SuggestedDiscountPercent as number | null | undefined) ??
                undefined,
              boxes: boxesRaw.map((b) => ({
                boxId: (b.boxId as number) ?? (b.BoxId as number) ?? 0,
                boxCode:
                  (b.boxCode as string) ?? (b.BoxCode as string) ?? "",
                weight: (b.weight as number) ?? (b.Weight as number) ?? 0,
                isPartial:
                  (b.isPartial as boolean) ??
                  (b.IsPartial as boolean) ??
                  false,
                status: (b.status as string) ?? (b.Status as string) ?? "",
                slotId:
                  (b.slotId as number | null | undefined) ??
                  (b.SlotId as number | null | undefined) ??
                  null,
                slotCode:
                  (b.slotCode as string | null | undefined) ??
                  (b.SlotCode as string | null | undefined) ??
                  null,
              })),
            };
          }),
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
      invalidatesTags: () => [{ type: "GoodsReceipt" as const, id: "LIST" }],
    }),

    createBoxes: builder.mutation<
      { message: string; boxes: BoxCreatedItem[] },
      CreateBoxesRequest
    >({
      query: (body) => ({
        url: "GoodsReceipts/boxes",
        method: "POST",
        body,
      }),
      transformResponse: (raw: unknown) => {
        const obj = (raw ?? {}) as RawObject;
        const rawBoxes =
          (obj.boxes as unknown[]) ?? (obj.Boxes as unknown[]) ?? [];
        const boxes: BoxCreatedItem[] = rawBoxes.map((b) => {
          const row = (b ?? {}) as RawObject;
          return {
            id: (row.id as number) ?? (row.Id as number) ?? 0,
            boxCode:
              (row.boxCode as string) ?? (row.BoxCode as string) ?? "",
            qrPayload:
              (row.qrPayload as string) ??
              (row.QrPayload as string) ??
              "",
          };
        });
        return {
          message:
            (obj.message as string) ?? (obj.Message as string) ?? "OK",
          boxes,
        };
      },
      invalidatesTags: [{ type: "GoodsReceipt" as const, id: "LIST" }],
    }),

    updateLotQrImage: builder.mutation<
      { message: string },
      { lotId: number; qrImageUrl: string }
    >({
      query: ({ lotId, qrImageUrl }) => ({
        url: `Lots/${lotId}/qr-image`,
        method: "PUT",
        body: { qrImageUrl },
      }),
    }),

    updateBoxQrImage: builder.mutation<
      { message: string },
      { boxId: number; qrImageUrl: string }
    >({
      query: ({ boxId, qrImageUrl }) => ({
        url: `Boxes/${boxId}/qr-image`,
        method: "PUT",
        body: { qrImageUrl },
      }),
    }),

    updateSlotQrImage: builder.mutation<
      { message: string },
      { slotId: number; qrImageUrl: string; rackId?: number }
    >({
      query: ({ slotId, qrImageUrl }) => ({
        url: `slots/${slotId}/qr-image`,
        method: "PUT",
        body: { qrImageUrl },
      }),
      invalidatesTags: (_res, _err, arg) =>
        arg.rackId
          ? [{ type: "Slot" as const, id: `RACK-${arg.rackId}` }]
          : [],
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
      invalidatesTags: (_res, _err, arg) => [
        // cập nhật sơ đồ kho (currentCapacity của slot trong rack)
        { type: "Slot" as const },
        // cập nhật popup chi tiết slot (danh sách box trong slot)
        // (xếp lại slot có thể làm thay đổi slot cũ + slot mới, nên invalidates LIST cho chắc)
        { type: "SlotContents" as const, id: "LIST" },
        { type: "SlotContents" as const, id: arg.slotId },
      ],
    }),

    assignBoxesToSlot: builder.mutation<
      { message: string; assignedCount?: number },
      AssignBoxesToSlotRequest
    >({
      query: (body) => ({
        url: "Boxes/assign-slot-batch",
        method: "POST",
        body,
      }),
      transformResponse: (raw: unknown): { message: string; assignedCount?: number } => {
        if (raw && typeof raw === "object") {
          const obj = raw as RawObject;
          return {
            message:
              (obj.message as string) ??
              (obj.Message as string) ??
              "Đã gán nhiều box vào slot thành công",
            assignedCount:
              (obj.assignedCount as number | undefined) ??
              (obj.AssignedCount as number | undefined),
          };
        }
        return { message: "Đã gán nhiều box vào slot thành công" };
      },
      invalidatesTags: (_res, _err, arg) => [
        { type: "Slot" as const },
        { type: "Warehouse" as const, id: "LIST" },
        { type: "SlotContents" as const, id: "LIST" },
        { type: "SlotContents" as const, id: arg.slotId },
      ],
    }),

    transferBoxToSlot: builder.mutation<
      { message: string },
      TransferBoxToSlotRequest
    >({
      query: (body) => ({
        url: "Boxes/transfer-slot",
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
              "Đã chuyển box sang slot mới",
          };
        }
        return { message: "Đã chuyển box sang slot mới" };
      },
      invalidatesTags: (_res, _err, arg) => [
        { type: "Slot" as const },
        { type: "SlotContents" as const, id: "LIST" },
        { type: "SlotContents" as const, id: arg.toSlotId },
      ],
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
  useGetAllLotsQuery,
  useGetLotDetailByIdQuery,
  useLazyGetLotByQrQuery,
  useGetUnassignedBoxesByWarehouseQuery,
  useGetBoxesByGoodsReceiptIdQuery,
  useGetDamagedBoxesQuery,
  useGetExpiredBoxesByWarehouseQuery,
  useDisposeExpiredBoxesMutation,
  useCreateDisposalRequestMutation,
  useDirectDisposeBoxesMutation,
  useGetDisposalRequestsQuery,
  useGetDisposalRequestByIdQuery,
  useApproveDisposalRequestMutation,
  useRejectDisposalRequestMutation,
  useGetDisposeHistoryByWarehouseQuery,
  useGetNearExpiryDashboardQuery,
  useLazyGetBoxByQrQuery,
  useLazyGetSlotByQrQuery,
  useAssignBoxToSlotMutation,
  useAssignBoxesToSlotMutation,
  useTransferBoxToSlotMutation,
  useUpdateLotQrImageMutation,
  useUpdateBoxQrImageMutation,
  useUpdateSlotQrImageMutation,
} = goodsReceiptApi;

