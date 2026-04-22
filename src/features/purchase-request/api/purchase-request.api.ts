import { api } from "../../../shared/api";
import type {
  CreatePurchaseOrderFromRequestBody,
  CreatePurchaseRequestBody,
  PurchaseRequest,
} from "../types/purchase-request.type";

type RawObject = Record<string, unknown>;

const mapDetail = (row: RawObject) => ({
  id: (row.id as number) ?? (row.Id as number) ?? 0,
  productId: (row.productId as number) ?? (row.ProductId as number) ?? 0,
  productName: (row.productName as string) ?? (row.ProductName as string) ?? "",
  requestedWeight:
    (row.requestedWeight as number) ?? (row.RequestedWeight as number) ?? 0,
  allocatedWeight:
    (row.allocatedWeight as number) ?? (row.AllocatedWeight as number) ?? 0,
  remainingWeight:
    (row.remainingWeight as number) ?? (row.RemainingWeight as number) ?? 0,
  targetUnitPrice:
    (row.targetUnitPrice as number) ?? (row.TargetUnitPrice as number) ?? 0,
});

const mapRequest = (row: RawObject): PurchaseRequest => {
  const detailsRaw =
    (row.details as unknown[]) ?? (row.Details as unknown[]) ?? [];
  return {
    id: (row.id as number) ?? (row.Id as number) ?? 0,
    requestCode:
      (row.requestCode as string) ?? (row.RequestCode as string) ?? "",
    status: (row.status as string) ?? (row.Status as string) ?? "",
    requestedDate:
      (row.requestedDate as string) ?? (row.RequestedDate as string) ?? "",
    notes:
      (row.notes as string | null | undefined) ??
      (row.Notes as string | null | undefined) ??
      null,
    details: detailsRaw.map((d) => mapDetail((d ?? {}) as RawObject)),
  };
};

export const purchaseRequestApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseRequests: builder.query<PurchaseRequest[], void>({
      query: () => ({ url: "PurchaseRequests" }),
      transformResponse: (raw: unknown) => {
        const arr = Array.isArray(raw) ? raw : [];
        return arr.map((row) => mapRequest((row ?? {}) as RawObject));
      },
      providesTags: (result) =>
        result
          ? [
              { type: "PurchaseRequest" as const, id: "LIST" },
              ...result.map((r) => ({ type: "PurchaseRequest" as const, id: r.id })),
            ]
          : [{ type: "PurchaseRequest" as const, id: "LIST" }],
    }),
    getPurchaseRequestById: builder.query<PurchaseRequest, number>({
      query: (id) => ({ url: `PurchaseRequests/${id}` }),
      transformResponse: (raw: unknown) => mapRequest((raw ?? {}) as RawObject),
      providesTags: (_res, _err, id) => [{ type: "PurchaseRequest" as const, id }],
    }),
    createPurchaseRequest: builder.mutation<
      { message: string; purchaseRequestId: number },
      CreatePurchaseRequestBody
    >({
      query: (body) => ({ url: "PurchaseRequests", method: "POST", body }),
      invalidatesTags: [{ type: "PurchaseRequest" as const, id: "LIST" }],
    }),
    createPurchaseOrderFromRequest: builder.mutation<
      { message: string; purchaseOrderId: number },
      { requestId: number; body: CreatePurchaseOrderFromRequestBody }
    >({
      query: ({ requestId, body }) => ({
        url: `PurchaseRequests/${requestId}/create-purchase-order`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "PurchaseRequest" as const, id: arg.requestId },
        { type: "PurchaseRequest" as const, id: "LIST" },
        { type: "PurchaseOrder" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPurchaseRequestsQuery,
  useGetPurchaseRequestByIdQuery,
  useCreatePurchaseRequestMutation,
  useCreatePurchaseOrderFromRequestMutation,
} = purchaseRequestApi;
