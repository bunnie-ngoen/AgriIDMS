import { api } from "../../../shared/api";
import type {
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderResponse,
  PurchaseOrderListItem,
} from "../types/purchase-order.type";

export const purchaseOrderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<PurchaseOrderListItem[], void>({
      query: () => ({ url: "PurchaseOrder" }),
      transformResponse: (raw: unknown): PurchaseOrderListItem[] => {
        let arr: unknown[] = [];
        if (Array.isArray(raw)) {
          arr = raw;
        } else if (raw && typeof raw === "object") {
          const obj = raw as Record<string, unknown>;
          if (Array.isArray(obj.data)) arr = obj.data;
          else if (Array.isArray(obj.result)) arr = obj.result;
        }
        return arr.map((r: unknown) => {
          const row = (r ?? {}) as Record<string, unknown>;
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
        const row = (raw ?? {}) as Record<string, unknown>;
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
            (row.supplierName as string) ?? (row.SupplierName as string) ?? "",
          status: (row.status as string) ?? (row.Status as string) ?? "",
          orderDate:
            orderDate != null
              ? typeof orderDate === "string"
                ? orderDate
                : new Date(orderDate as number).toISOString()
              : "",
          createdByName: createdByName || undefined,
          // Nếu BE trả details với tên khác (Details / purchaseOrderDetails)
          details:
            (row.details as any[]) ??
            (row.Details as any[]) ??
            (row.purchaseOrderDetails as any[]) ??
            (row.PurchaseOrderDetails as any[]) ??
            [],
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
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
} = purchaseOrderApi;
