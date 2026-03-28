import { api } from "../../../shared/api";
import type {
  CreateStockCheckPayload,
  CreateStockCheckResponse,
  StockCheckDetailsResponse,
  StockCheckManagerDashboard,
  StockCheckWarehouseDashboard,
  UpdateCountedWeightPayload,
} from "../types/stock-check.type";

export const stockCheckApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouseStockChecksDashboard: builder.query<
      StockCheckWarehouseDashboard,
      { warehouseId?: number } | void
    >({
      query: (arg) => {
        const warehouseId =
          typeof arg === "object" && arg ? arg.warehouseId : undefined;
        const qs = warehouseId ? `?warehouseId=${warehouseId}` : "";
        return { url: `StockChecks/dashboard/warehouse${qs}` };
      },
      providesTags: ["StockCheck"],
    }),

    getManagerStockChecksDashboard: builder.query<
      StockCheckManagerDashboard,
      { warehouseId?: number } | void
    >({
      query: (arg) => {
        const warehouseId =
          typeof arg === "object" && arg ? arg.warehouseId : undefined;
        const qs = warehouseId ? `?warehouseId=${warehouseId}` : "";
        return { url: `StockChecks/dashboard/manager${qs}` };
      },
      providesTags: ["StockCheck"],
    }),

    getStockCheckDetails: builder.query<StockCheckDetailsResponse, number>({
      query: (id) => ({ url: `StockChecks/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "StockCheck", id }],
    }),

    createStockCheck: builder.mutation<
      CreateStockCheckResponse,
      CreateStockCheckPayload
    >({
      query: (body) => ({
        url: `StockChecks`,
        method: "POST",
        body: {
          warehouseId: body.warehouseId,
          checkType: body.checkType,
          boxIds: body.boxIds ?? null,
          zoneId: body.zoneId ?? null,
          rackId: body.rackId ?? null,
          slotId: body.slotId ?? null,
        },
      }),
      invalidatesTags: ["StockCheck"],
    }),

    startStockCheck: builder.mutation<{ message?: string }, number>({
      query: (id) => ({ url: `StockChecks/${id}/start`, method: "POST" }),
      invalidatesTags: ["StockCheck"],
    }),

    updateCountedWeight: builder.mutation<
      { message?: string },
      UpdateCountedWeightPayload
    >({
      query: (body) => ({
        url: `StockChecks/detail/counted`,
        method: "PUT",
        body: {
          stockCheckDetailId: body.stockCheckDetailId,
          countedWeight: body.countedWeight,
          note: body.note ?? null,
          varianceReason: body.varianceReason ?? null,
        },
      }),
      invalidatesTags: ["StockCheck"],
    }),

    completeStockCheckCount: builder.mutation<{ message?: string }, number>({
      query: (id) => ({ url: `StockChecks/${id}/complete`, method: "POST" }),
      invalidatesTags: ["StockCheck"],
    }),

    approveStockCheck: builder.mutation<{ message?: string }, number>({
      query: (id) => ({ url: `StockChecks/${id}/approve`, method: "POST" }),
      invalidatesTags: [
        "StockCheck",
        { type: "Warehouse", id: "LIST" },
        { type: "Slot", id: "LIST" },
        { type: "SlotContents", id: "LIST" },
      ],
    }),

    rejectStockCheck: builder.mutation<{ message?: string }, number>({
      query: (id) => ({ url: `StockChecks/${id}/reject`, method: "POST" }),
      invalidatesTags: ["StockCheck"],
    }),
  }),
});

export const {
  useGetWarehouseStockChecksDashboardQuery,
  useGetManagerStockChecksDashboardQuery,
  useGetStockCheckDetailsQuery,
  useCreateStockCheckMutation,
  useStartStockCheckMutation,
  useUpdateCountedWeightMutation,
  useCompleteStockCheckCountMutation,
  useApproveStockCheckMutation,
  useRejectStockCheckMutation,
} = stockCheckApi;

