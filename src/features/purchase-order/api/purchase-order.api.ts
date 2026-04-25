import { api } from "../../../shared/api";
import type {
  CreatePurchaseOrderRequest,
  CreateMultiSupplierPurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderResponse,
  PurchaseOrderStructuredResponse,
  PurchaseOrderListItem,
  PurchaseOrderDetailResponse,
} from "../types/purchase-order.type";

type RawObject = Record<string, unknown>;

const mapDetail = (raw: RawObject): PurchaseOrderDetailResponse => {
  const orderedWeight =
    (raw.orderedWeight as number) ?? (raw.OrderedWeight as number) ?? 0;
  const receivedWeight =
    (raw.receivedWeight as number) ?? (raw.ReceivedWeight as number) ?? 0;
  const remainingFromDto =
    (raw.remainingWeight as number) ?? (raw.RemainingWeight as number);

  const remainingWeight =
    typeof remainingFromDto === "number"
      ? remainingFromDto
      : orderedWeight - receivedWeight;

  const approverName =
    (raw.approverName as string) ??
    (raw.ApproverName as string) ??
    (raw.nameApprover as string) ??
    (raw.NameApprover as string) ??
    "";

  return {
    id: (raw.id as number) ?? (raw.Id as number) ?? 0,
    productId:
      (raw.productId as number) ??
      (raw.ProductId as number) ??
      0,
    productName:
      (raw.productName as string) ??
      (raw.ProductName as string) ??
      "",
    orderedWeight,
    unitPrice:
      (raw.unitPrice as number) ?? (raw.UnitPrice as number) ?? 0,
    tolerancePercent:
      (raw.tolerancePercent as number) ??
      (raw.TolerancePercent as number) ??
      0,
    receivedWeight,
    remainingWeight,
    harvestDate:
      (raw.harvestDate as string) ??
      (raw.HarvestDate as string) ??
      "",
    approverName: approverName || undefined,
  };
};

export const purchaseOrderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<PurchaseOrderListItem[], void>({
      query: () => ({ url: "PurchaseOrder" }),
      transformResponse: (raw: unknown): PurchaseOrderListItem[] => {
        let arr: unknown[] = [];
        if (Array.isArray(raw)) {
          arr = raw;
        } else if (raw && typeof raw === "object") {
          const obj = raw as RawObject;
          if (Array.isArray(obj.data)) arr = obj.data;
          else if (Array.isArray(obj.result)) arr = obj.result;
        }
        return arr.map((r: unknown) => {
          const row = (r ?? {}) as RawObject;
          const orderDate = row.orderDate ?? row.OrderDate;
          const createdByName =
            (row.createdByName as string) ??
            (row.CreatedByName as string) ??
            (row.createdBy as string) ??
            (row.CreatedBy as string) ??
            (row.creatorName as string) ??
            (row.CreatorName as string) ??
            (row.createdUser as string) ??
            (row.CreatedUser as string) ??
            (row.nameCreater as string) ??
            (row.NameCreater as string) ??
            "";
          return {
            id: (row.id as number) ?? (row.Id as number) ?? 0,
            orderCode:
              (row.orderCode as string) ?? (row.OrderCode as string) ?? "",
            supplierId:
              (row.supplierId as number) ?? (row.SupplierId as number) ?? 0,
            supplierName:
              (row.supplierName as string) ??
              (row.SupplierName as string) ??
              "",
            status: (row.status as string) ?? (row.Status as string) ?? "",
            procurementMode:
              (row.procurementMode as string) ??
              (row.ProcurementMode as string) ??
              undefined,
            orderDate:
              orderDate != null
                ? typeof orderDate === "string"
                  ? orderDate
                  : new Date(orderDate as number).toISOString()
                : "",
            createdByName: createdByName || undefined,
          };
        });
      },
      providesTags: (result) =>
        result
          ? [
              { type: "PurchaseOrder" as const, id: "LIST" },
              ...result.map((r) => ({ type: "PurchaseOrder" as const, id: r.id })),
            ]
          : [{ type: "PurchaseOrder" as const, id: "LIST" }],
    }),

    getPurchaseOrderById: builder.query<PurchaseOrderResponse, number>({
      query: (id) => ({ url: `PurchaseOrder/${id}` }),
      transformResponse: (raw: unknown): PurchaseOrderResponse => {
        const row = (raw ?? {}) as RawObject;
        const orderDate = row.orderDate ?? row.OrderDate;
        const createdByName =
          (row.createdByName as string) ??
          (row.CreatedByName as string) ??
          (row.createdBy as string) ??
          (row.CreatedBy as string) ??
          (row.creatorName as string) ??
          (row.CreatorName as string) ??
          (row.createdUser as string) ??
          (row.CreatedUser as string) ??
          (row.nameCreater as string) ??
          (row.NameCreater as string) ??
          "";

        const detailsRaw =
          (row.details as unknown[]) ??
          (row.Details as unknown[]) ??
          (row.purchaseOrderDetails as unknown[]) ??
          (row.PurchaseOrderDetails as unknown[]) ??
          [];

        return {
          id: (row.id as number) ?? (row.Id as number) ?? 0,
          orderCode:
            (row.orderCode as string) ?? (row.OrderCode as string) ?? "",
          supplierId:
            (row.supplierId as number) ?? (row.SupplierId as number) ?? 0,
          supplierName:
            (row.supplierName as string) ?? (row.SupplierName as string) ?? "",
          status: (row.status as string) ?? (row.Status as string) ?? "",
          procurementMode:
            (row.procurementMode as string) ??
            (row.ProcurementMode as string) ??
            undefined,
          orderDate:
            orderDate != null
              ? typeof orderDate === "string"
                ? orderDate
                : new Date(orderDate as number).toISOString()
              : "",
          createdByName: createdByName || undefined,
          details: detailsRaw.map((d) =>
            mapDetail((d ?? {}) as RawObject),
          ),
        };
      },
      providesTags: (_res, _err, id) => [{ type: "PurchaseOrder" as const, id }],
    }),

    getPurchaseOrderStructuredById: builder.query<PurchaseOrderStructuredResponse, number>({
      query: (id) => ({ url: `PurchaseOrder/${id}/structured` }),
      transformResponse: (raw: unknown): PurchaseOrderStructuredResponse => {
        const row = (raw ?? {}) as RawObject;
        const statusObj = ((row.status as RawObject) ?? (row.Status as RawObject) ?? {}) as RawObject;
        const procurementObj = ((row.procurement as RawObject) ?? (row.Procurement as RawObject) ?? {}) as RawObject;
        const createdByObj = ((row.createdBy as RawObject) ?? (row.CreatedBy as RawObject) ?? {}) as RawObject;
        const summaryObj = ((row.summary as RawObject) ?? (row.Summary as RawObject) ?? {}) as RawObject;
        const plansRaw =
          (row.supplierPlans as unknown[]) ??
          (row.SupplierPlans as unknown[]) ??
          [];

        return {
          id: (row.id as number) ?? (row.Id as number) ?? 0,
          orderCode: (row.orderCode as string) ?? (row.OrderCode as string) ?? "",
          status: {
            code: (statusObj.code as string) ?? (statusObj.Code as string) ?? "",
            label: (statusObj.label as string) ?? (statusObj.Label as string) ?? "",
          },
          procurement: {
            mode: (procurementObj.mode as string) ?? (procurementObj.Mode as string) ?? "",
            label: (procurementObj.label as string) ?? (procurementObj.Label as string) ?? "",
          },
          orderDate: (row.orderDate as string) ?? (row.OrderDate as string) ?? "",
          createdBy: {
            id: (createdByObj.id as string) ?? (createdByObj.Id as string) ?? null,
            name: (createdByObj.name as string) ?? (createdByObj.Name as string) ?? "",
          },
          summary: {
            totalSuppliers: (summaryObj.totalSuppliers as number) ?? (summaryObj.TotalSuppliers as number) ?? 0,
            totalProducts: (summaryObj.totalProducts as number) ?? (summaryObj.TotalProducts as number) ?? 0,
            totalOrderedWeight:
              (summaryObj.totalOrderedWeight as number) ?? (summaryObj.TotalOrderedWeight as number) ?? 0,
            totalEstimatedAmount:
              (summaryObj.totalEstimatedAmount as number) ?? (summaryObj.TotalEstimatedAmount as number) ?? 0,
          },
          supplierPlans: plansRaw.map((p) => {
            const plan = (p ?? {}) as RawObject;
            const supplierObj = ((plan.supplier as RawObject) ?? (plan.Supplier as RawObject) ?? {}) as RawObject;
            const planSummaryObj = ((plan.summary as RawObject) ?? (plan.Summary as RawObject) ?? {}) as RawObject;
            const detailsRaw = (plan.details as unknown[]) ?? (plan.Details as unknown[]) ?? [];
            return {
              supplierPlanId: (plan.supplierPlanId as number) ?? (plan.SupplierPlanId as number) ?? 0,
              supplier: {
                supplierId:
                  (supplierObj.supplierId as number) ??
                  (supplierObj.SupplierId as number) ??
                  0,
                supplierName:
                  (supplierObj.supplierName as string) ??
                  (supplierObj.SupplierName as string) ??
                  "",
                isPrimary:
                  (supplierObj.isPrimary as boolean) ??
                  (supplierObj.IsPrimary as boolean) ??
                  false,
              },
              orderDate: (plan.orderDate as string) ?? (plan.OrderDate as string) ?? "",
              notes: (plan.notes as string) ?? (plan.Notes as string) ?? null,
              summary: {
                totalOrderedWeight:
                  (planSummaryObj.totalOrderedWeight as number) ??
                  (planSummaryObj.TotalOrderedWeight as number) ??
                  0,
                totalEstimatedAmount:
                  (planSummaryObj.totalEstimatedAmount as number) ??
                  (planSummaryObj.TotalEstimatedAmount as number) ??
                  0,
              },
              details: detailsRaw.map((d) => {
                const line = (d ?? {}) as RawObject;
                return {
                  lineId: (line.lineId as number) ?? (line.LineId as number) ?? 0,
                  supplierPlanDetailId:
                    (line.supplierPlanDetailId as number | null | undefined) ??
                    (line.SupplierPlanDetailId as number | null | undefined) ??
                    null,
                  productId:
                    (line.productId as number) ??
                    (line.ProductId as number) ??
                    0,
                  productName:
                    (line.productName as string) ??
                    (line.ProductName as string) ??
                    "",
                  orderedWeight:
                    (line.orderedWeight as number) ??
                    (line.OrderedWeight as number) ??
                    0,
                  unitPriceAtOrder:
                    (line.unitPriceAtOrder as number) ??
                    (line.UnitPriceAtOrder as number) ??
                    0,
                  priceDate:
                    (line.priceDate as string) ??
                    (line.PriceDate as string) ??
                    "",
                  lineAmount:
                    (line.lineAmount as number) ??
                    (line.LineAmount as number) ??
                    0,
                };
              }),
            };
          }),
        };
      },
      providesTags: (_res, _err, id) => [{ type: "PurchaseOrder" as const, id }],
    }),

    createPurchaseOrder: builder.mutation<
      { message: string; purchaseOrderId: number },
      CreatePurchaseOrderRequest
    >({
      query: (body) => ({
        url: "PurchaseOrder",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PurchaseOrder" as const, id: "LIST" }],
    }),

    createMultiSupplierPurchaseOrder: builder.mutation<
      { message: string; purchaseOrderId: number },
      CreateMultiSupplierPurchaseOrderRequest
    >({
      query: (body) => ({
        url: "PurchaseOrder/multi-supplier",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PurchaseOrder" as const, id: "LIST" }],
    }),

    updatePurchaseOrder: builder.mutation<
      { message: string },
      { id: number; body: UpdatePurchaseOrderRequest }
    >({
      query: ({ id, body }) => ({
        url: `PurchaseOrder/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "PurchaseOrder" as const, id: arg.id },
        { type: "PurchaseOrder" as const, id: "LIST" },
      ],
    }),

    deletePurchaseOrder: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `PurchaseOrder/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "PurchaseOrder" as const, id },
        { type: "PurchaseOrder" as const, id: "LIST" },
      ],
    }),

    approvePurchaseOrder: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `PurchaseOrder/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "PurchaseOrder" as const, id },
        { type: "PurchaseOrder" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useGetPurchaseOrderStructuredByIdQuery,
  useCreatePurchaseOrderMutation,
  useCreateMultiSupplierPurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
} = purchaseOrderApi;
