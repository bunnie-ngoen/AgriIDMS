import { api } from "../../../shared/api";

/** BE PaymentMethod: 0=COD, 1=VNPay, 2=Momo, 3=Banking */
export type PaymentMethod = 0 | 1 | 2 | 3;

export type CreatePaymentRequest = {
    orderId: number;
    paymentMethod: PaymentMethod;
};

export type PaymentResponse = {
    id: number;
    orderId: number;
    paymentMethod: string;
    paymentStatus: string;
    transactionCode?: string | null;
    amount: number;
    paidAt?: string | null;
    createdAt: string;
    checkoutUrl?: string | null;
};

/** BE: POST api/Payments, GET api/Payments/order/{orderId}, PATCH api/Payments/{id}/confirm-cod */
export const paymentApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createPayment: builder.mutation<PaymentResponse, CreatePaymentRequest>({
            query: (body) => ({
                url: "Payments",
                method: "POST",
                body: {
                    OrderId: body.orderId,
                    PaymentMethod: body.paymentMethod,
                },
            }),
            transformResponse: (raw: unknown): PaymentResponse => {
                const r = raw as Record<string, unknown>;
                return {
                    id: (r.id as number) ?? (r.Id as number) ?? 0,
                    orderId: (r.orderId as number) ?? (r.OrderId as number) ?? 0,
                    paymentMethod: String(r.paymentMethod ?? r.PaymentMethod ?? ""),
                    paymentStatus: String(r.paymentStatus ?? r.PaymentStatus ?? ""),
                    transactionCode: (r.transactionCode as string) ?? (r.TransactionCode as string) ?? null,
                    amount: (r.amount as number) ?? (r.Amount as number) ?? 0,
                    paidAt: (r.paidAt as string) ?? (r.PaidAt as string) ?? null,
                    createdAt: String(r.createdAt ?? r.CreatedAt ?? ""),
                    checkoutUrl: (r.checkoutUrl as string) ?? (r.CheckoutUrl as string) ?? null,
                };
            },
            invalidatesTags: ["Payment", "Order"],
        }),
        getLatestPayment: builder.query<PaymentResponse | null, number>({
            query: (orderId) => ({ url: `Payments/order/${orderId}` }),
            transformResponse: (raw: unknown): PaymentResponse | null => {
                if (raw == null) return null;
                const r = raw as Record<string, unknown>;
                return {
                    id: (r.id as number) ?? (r.Id as number) ?? 0,
                    orderId: (r.orderId as number) ?? (r.OrderId as number) ?? 0,
                    paymentMethod: String(r.paymentMethod ?? r.PaymentMethod ?? ""),
                    paymentStatus: String(r.paymentStatus ?? r.PaymentStatus ?? ""),
                    transactionCode: (r.transactionCode as string) ?? (r.TransactionCode as string) ?? null,
                    amount: (r.amount as number) ?? (r.Amount as number) ?? 0,
                    paidAt: (r.paidAt as string) ?? (r.PaidAt as string) ?? null,
                    createdAt: String(r.createdAt ?? r.CreatedAt ?? ""),
                    checkoutUrl: (r.checkoutUrl as string) ?? (r.CheckoutUrl as string) ?? null,
                };
            },
            providesTags: (_res, _err, orderId) => [{ type: "Payment" as const, id: `ORDER-${orderId}` }],
        }),
        confirmCODPaid: builder.mutation<PaymentResponse, number>({
            query: (paymentId) => ({
                url: `Payments/${paymentId}/confirm-cod`,
                method: "PATCH",
            }),
            transformResponse: (raw: unknown): PaymentResponse => {
                const r = raw as Record<string, unknown>;
                return {
                    id: (r.id as number) ?? (r.Id as number) ?? 0,
                    orderId: (r.orderId as number) ?? (r.OrderId as number) ?? 0,
                    paymentMethod: String(r.paymentMethod ?? r.PaymentMethod ?? ""),
                    paymentStatus: String(r.paymentStatus ?? r.PaymentStatus ?? ""),
                    transactionCode: (r.transactionCode as string) ?? (r.TransactionCode as string) ?? null,
                    amount: (r.amount as number) ?? (r.Amount as number) ?? 0,
                    paidAt: (r.paidAt as string) ?? (r.PaidAt as string) ?? null,
                    createdAt: String(r.createdAt ?? r.CreatedAt ?? ""),
                    checkoutUrl: (r.checkoutUrl as string) ?? (r.CheckoutUrl as string) ?? null,
                };
            },
            invalidatesTags: ["Payment", "Order"],
        }),
    }),
});

export const {
    useCreatePaymentMutation,
    useGetLatestPaymentQuery,
    useConfirmCODPaidMutation,
} = paymentApi;
