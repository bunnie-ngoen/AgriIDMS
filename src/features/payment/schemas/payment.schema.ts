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

export const pendingCodPaymentItemSchema = z.object({
    paymentId: z.coerce.number().int(),
    orderId: z.coerce.number().int(),
    customerUserId: z.string(),
    customerName: z.string().nullable().optional(),
    customerPhone: z.string().nullable().optional(),
    amount: z.coerce.number(),
    paymentStatus: z.string(),
    paymentMethod: z.string(),
    orderStatus: z.string(),
    createdAt: z.string(),
});

export const pendingCodPaymentListSchema = z.array(pendingCodPaymentItemSchema);
export type PendingCodPaymentItem = z.infer<typeof pendingCodPaymentItemSchema>;

export const paymentMethodEnum = {
    COD: 0,
    VNPAY: 1,
    MOMO: 2,
    BANKING: 3,
} as const;

export type PaymentMethodValue =
    (typeof paymentMethodEnum)[keyof typeof paymentMethodEnum];

/** BE PaymentService: POST Payments/staff/online-paybefore chỉ cho PayBefore + Delivery (+ Online/POS). */
export function shouldUseStaffOnlinePayBeforeEndpoint(order: {
    fulfillmentType?: string | null;
    paymentTiming?: string | null;
}): boolean {
    return order.fulfillmentType === "Delivery" && order.paymentTiming === "PayBefore";
}

