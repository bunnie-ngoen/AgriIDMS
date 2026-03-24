import { api } from "../../../shared/api";
import {
    orderDetailSchema,
    orderListSchema,
    overdueBackorderListSchema,
    type OrderDetail,
    type OrderListItem,
    type OverdueBackorderItem,
} from "../schemas/order.schema";

function toCamelCase(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);
    if (typeof obj === "object") {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(obj as Record<string, unknown>)) {
            const camel = key.charAt(0).toLowerCase() + key.slice(1);
            out[camel] = toCamelCase((obj as Record<string, unknown>)[key]);
        }
        return out;
    }
    return obj;
}

export const orderApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getMyOrders: builder.query<OrderListItem[], { status?: string } | void>({
            query: (arg) => ({
                url: "Orders",
                method: "GET",
                params: arg?.status ? { status: arg.status } : undefined,
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = orderListSchema.safeParse(normalized);
                if (!parsed.success) return [];
                return parsed.data;
            },
        }),

        getMyOrderById: builder.query<OrderDetail, number>({
            query: (id) => ({
                url: `Orders/${id}`,
                method: "GET",
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = orderDetailSchema.safeParse(normalized);
                if (!parsed.success) throw new Error("Invalid order detail");
                return parsed.data;
            },
        }),

        getPendingSaleConfirmOrders: builder.query<
            OrderListItem[],
            { customerUserId?: string; skip?: number; take?: number } | void
        >({
            query: (arg) => ({
                url: "Orders/staff/pending-sale-confirm",
                method: "GET",
                params: {
                    customerUserId: arg?.customerUserId,
                    skip: arg?.skip ?? 0,
                    take: arg?.take ?? 50,
                },
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = orderListSchema.safeParse(normalized);
                if (!parsed.success) return [];
                return parsed.data;
            },
        }),

        getPendingAllocationOrders: builder.query<
            OrderListItem[],
            { customerUserId?: string; source?: string; skip?: number; take?: number } | void
        >({
            query: (arg) => ({
                url: "Orders/staff/pending-allocation",
                method: "GET",
                params: {
                    customerUserId: arg?.customerUserId,
                    source: arg?.source,
                    skip: arg?.skip ?? 0,
                    take: arg?.take ?? 50,
                },
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = orderListSchema.safeParse(normalized);
                if (!parsed.success) return [];
                return parsed.data;
            },
        }),

        getPendingWarehouseConfirmOrders: builder.query<
            OrderListItem[],
            { customerUserId?: string; source?: string; skip?: number; take?: number } | void
        >({
            query: (arg) => ({
                url: "Orders/staff/pending-warehouse-confirm",
                method: "GET",
                params: {
                    customerUserId: arg?.customerUserId,
                    source: arg?.source,
                    skip: arg?.skip ?? 0,
                    take: arg?.take ?? 50,
                },
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = orderListSchema.safeParse(normalized);
                if (!parsed.success) return [];
                return parsed.data;
            },
        }),

        saleConfirmOrder: builder.mutation<void, number>({
            query: (id) => ({
                url: `Orders/${id}/sale-confirm`,
                method: "PATCH",
            }),
        }),

        confirmOrder: builder.mutation<void, number>({
            query: (id) => ({
                url: `Orders/${id}/ConfirmOrder`,
                method: "PATCH",
            }),
        }),

        allocateAsStaff: builder.mutation<void, number>({
            query: (id) => ({
                url: `Orders/${id}/allocate/staff`,
                method: "PATCH",
            }),
        }),

        autoProposeAllocationAsStaff: builder.mutation<void, number>({
            query: (id) => ({
                url: `Orders/${id}/allocation/auto-propose`,
                method: "PATCH",
            }),
        }),

        confirmAllocationAsStaff: builder.mutation<void, number>({
            query: (id) => ({
                url: `Orders/${id}/allocation/confirm`,
                method: "PATCH",
            }),
        }),

        waitBackorder: builder.mutation<void, number>({
            query: (id) => ({
                url: `Orders/${id}/backorder/wait`,
                method: "PATCH",
            }),
        }),

        cancelShortage: builder.mutation<void, number>({
            query: (id) => ({
                url: `Orders/${id}/backorder/cancel-shortage`,
                method: "PATCH",
            }),
        }),

        allocateBackorderAsStaff: builder.mutation<
            void,
            { id: number; expiredAction: 0 | 1 }
        >({
            query: ({ id, expiredAction }) => ({
                url: `Orders/${id}/backorder/allocate`,
                method: "PATCH",
                body: { expiredAction },
            }),
        }),

        cancelOrder: builder.mutation<void, number>({
            query: (id) => ({
                url: `Orders/${id}/cancel`,
                method: "PATCH",
            }),
        }),

        getOverdueBackorders: builder.query<OverdueBackorderItem[], void>({
            query: () => ({
                url: "Orders/backorder/overdue",
                method: "GET",
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = overdueBackorderListSchema.safeParse(normalized);
                if (!parsed.success) return [];
                return parsed.data;
            },
        }),
    }),
});

export const {
    useGetMyOrdersQuery,
    useGetMyOrderByIdQuery,
    useGetPendingSaleConfirmOrdersQuery,
    useGetPendingAllocationOrdersQuery,
    useGetPendingWarehouseConfirmOrdersQuery,
    useSaleConfirmOrderMutation,
    useConfirmOrderMutation,
    useAllocateAsStaffMutation,
    useAutoProposeAllocationAsStaffMutation,
    useConfirmAllocationAsStaffMutation,
    useWaitBackorderMutation,
    useCancelShortageMutation,
    useAllocateBackorderAsStaffMutation,
    useCancelOrderMutation,
    useGetOverdueBackordersQuery,
} = orderApi;

