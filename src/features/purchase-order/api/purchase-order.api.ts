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
      query: () => ({ url: "PurchaseOrder/list" }),
      transformResponse: (raw: unknown): PurchaseOrderListItem[] => {
        const arr = Array.isArray(raw) ? raw : [];
        return arr.map((r: unknown) => {
          const row = r as Record<string, unknown>;
          return {
            id: (row.id as number) ?? (row.Id as number),
            orderCode: (row.orderCode as string) ?? (row.OrderCode as string) ?? "",
            supplierId: (row.supplierId as number) ?? (row.SupplierId as number) ?? 0,
            supplierName: (row.supplierName as string) ?? (row.SupplierName as string) ?? "",
            status: (row.status as string) ?? (row.Status as string) ?? "",
            orderDate: (row.orderDate as string) ?? (row.OrderDate as string) ?? "",
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
