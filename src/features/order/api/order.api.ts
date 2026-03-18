import { api } from "../../../shared/api";

/** BE: POST api/Orders/{id}/allocate – giữ hàng cho đơn (Order → Confirmed). */
export const orderApi = api.injectEndpoints({
    endpoints: (builder) => ({
        allocateOrder: builder.mutation<{ message: string; orderId: number }, number>({
            query: (orderId) => ({
                url: `Orders/${orderId}/allocate`,
                method: "POST",
            }),
            transformResponse: (raw: unknown) => {
                const r = raw as { message?: string; orderId?: number };
                return {
                    message: r.message ?? "Đã giữ hàng",
                    orderId: r.orderId ?? 0,
                };
            },
            invalidatesTags: ["Order"],
        }),
    }),
});

export const { useAllocateOrderMutation } = orderApi;
