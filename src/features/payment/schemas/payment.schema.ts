import { z } from "zod";

export const paymentResponseSchema = z.object({
    id: z.coerce.number().int(),
    orderId: z.coerce.number().int(),
    paymentMethod: z.string(),
    paymentStatus: z.string(),
    transactionCode: z.string().nullable().optional(),
    amount: z.coerce.number(),
    paidAt: z.string().nullable().optional(),
    createdAt: z.string(),
    checkoutUrl: z.string().nullable().optional(),
});

export type PaymentResponse = z.infer<typeof paymentResponseSchema>;

export const paymentMethodEnum = {
    COD: 0,
    VNPAY: 1,
    MOMO: 2,
    BANKING: 3,
} as const;

export type PaymentMethodValue =
    (typeof paymentMethodEnum)[keyof typeof paymentMethodEnum];

