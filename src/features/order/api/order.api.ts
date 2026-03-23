import { api } from "../../../shared/api";
import {
    orderDetailSchema,
    orderListSchema,
    type OrderDetail,
    type OrderListItem,
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
    }),
});

export const { useGetMyOrdersQuery, useGetMyOrderByIdQuery } = orderApi;

