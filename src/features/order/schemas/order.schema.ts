import { z } from "zod";

export const orderListItemSchema = z.object({
    orderId: z.coerce.number().int(),
    totalAmount: z.coerce.number(),
    status: z.string(),
    source: z.string(),
    createdAt: z.string(),
    itemCount: z.coerce.number().int(),
    latestPaymentStatus: z.string().nullable().optional(),
});

export const orderListSchema = z.array(orderListItemSchema);
export type OrderListItem = z.infer<typeof orderListItemSchema>;

export const orderDetailItemSchema = z.object({
    productVariantId: z.coerce.number().int(),
    productName: z.string(),
    grade: z.string(),
    boxWeight: z.coerce.number(),
    isPartial: z.boolean(),
    quantity: z.coerce.number(),
    unitPrice: z.coerce.number(),
    fulfilledQuantity: z.coerce.number(),
    shortageQuantity: z.coerce.number(),
});

export const orderDetailSchema = z.object({
    orderId: z.coerce.number().int(),
    totalAmount: z.coerce.number(),
    status: z.string(),
    source: z.string(),
    createdAt: z.string(),
    latestPaymentStatus: z.string().nullable().optional(),
    items: z.array(orderDetailItemSchema),
});

export type OrderDetail = z.infer<typeof orderDetailSchema>;

export const overdueBackorderItemSchema = z.object({
    orderId: z.coerce.number().int(),
    customerUserId: z.string(),
    createdAt: z.string(),
    backorderDeadlineAt: z.string(),
    totalShortageQuantity: z.coerce.number(),
    totalReservedQuantity: z.coerce.number(),
    currentTotalAmount: z.coerce.number(),
    status: z.string(),
});

export const overdueBackorderListSchema = z.array(overdueBackorderItemSchema);
export type OverdueBackorderItem = z.infer<typeof overdueBackorderItemSchema>;

