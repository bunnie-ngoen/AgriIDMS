import { api } from "../../../shared/api";
import {
    paymentResponseSchema,
    pendingCodPaymentListSchema,
    type PaymentResponse,
    type PendingCodPaymentItem,
} from "../schemas/payment.schema";

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

export const paymentApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // BE: POST api/Payments
        createPayment: builder.mutation<
            PaymentResponse,
            { orderId: number; paymentMethod: number }
        >({
            query: (body) => ({
                url: "Payments",
                method: "POST",
                body,
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = paymentResponseSchema.safeParse(normalized);
                if (!parsed.success) throw new Error("Invalid payment response");
                return parsed.data;
            },
        }),

        // BE: GET api/Payments/order/{orderId}
        getLatestPaymentByOrder: builder.query<PaymentResponse, number>({
            query: (orderId) => ({
                url: `Payments/order/${orderId}`,
                method: "GET",
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = paymentResponseSchema.safeParse(normalized);
                if (!parsed.success) throw new Error("Invalid payment response");
                return parsed.data;
            },
        }),

        // BE: POST api/Payments/{paymentId}/cancel
        cancelPayment: builder.mutation<PaymentResponse, number>({
            query: (paymentId) => ({
                url: `Payments/${paymentId}/cancel`,
                method: "POST",
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = paymentResponseSchema.safeParse(normalized);
                if (!parsed.success) throw new Error("Invalid payment response");
                return parsed.data;
            },
        }),

        // BE: GET api/Payments/staff/pending-cod
        getPendingCodPayments: builder.query<
            PendingCodPaymentItem[],
            { orderId?: number; customerUserId?: string; skip?: number; take?: number } | void
        >({
            query: (arg) => ({
                url: "Payments/staff/pending-cod",
                method: "GET",
                params: {
                    orderId: arg?.orderId,
                    customerUserId: arg?.customerUserId,
                    skip: arg?.skip ?? 0,
                    take: arg?.take ?? 50,
                },
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = pendingCodPaymentListSchema.safeParse(normalized);
                if (!parsed.success) return [];
                return parsed.data;
            },
        }),

        // BE: PATCH api/Payments/{paymentId}/confirm-cod
        confirmCodPayment: builder.mutation<PaymentResponse, number>({
            query: (paymentId) => ({
                url: `Payments/${paymentId}/confirm-cod`,
                method: "PATCH",
            }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = paymentResponseSchema.safeParse(normalized);
                if (!parsed.success) throw new Error("Invalid payment response");
                return parsed.data;
            },
        }),
    }),
});

export const {
    useCreatePaymentMutation,
    useGetLatestPaymentByOrderQuery,
    useLazyGetLatestPaymentByOrderQuery,
    useCancelPaymentMutation,
    useGetPendingCodPaymentsQuery,
    useConfirmCodPaymentMutation,
} = paymentApi;

