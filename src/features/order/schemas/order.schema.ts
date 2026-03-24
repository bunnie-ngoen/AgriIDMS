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

export const saleConfirmResponseSchema = z.object({
    message: z.string(),
    order: orderListItemSchema,
});
export type SaleConfirmResponse = z.infer<typeof saleConfirmResponseSchema>;

export const allocationProposalDetailSchema = z.object({
    orderDetailId: z.coerce.number().int(),
    productVariantId: z.coerce.number().int(),
    productName: z.string(),
    grade: z.string(),
    boxWeight: z.coerce.number(),
    isPartial: z.boolean(),
    requestedQuantity: z.coerce.number().int(),
    proposedQuantity: z.coerce.number().int(),
    shortageQuantity: z.coerce.number().int(),
    isSufficient: z.boolean(),
});

export const allocationProposalItemSchema = z.object({
    allocationId: z.coerce.number().int(),
    orderDetailId: z.coerce.number().int(),
    boxId: z.coerce.number().int(),
    boxCode: z.string(),
    status: z.string(),
    expiryDate: z.string().nullable().optional(),
});

export const allocationProposalsResponseSchema = z.object({
    orderId: z.coerce.number().int(),
    totalRequestedBoxes: z.coerce.number().int(),
    totalProposedBoxes: z.coerce.number().int(),
    totalShortageBoxes: z.coerce.number().int(),
    isFullyProposed: z.boolean(),
    details: z.array(allocationProposalDetailSchema),
    proposals: z.array(allocationProposalItemSchema),
});
export type AllocationProposalsResponse = z.infer<typeof allocationProposalsResponseSchema>;

export const allocationConfirmResponseSchema = z.object({
    orderId: z.coerce.number().int(),
    status: z.string(),
    fulfilledQuantity: z.coerce.number().int().optional(),
    shortageQuantity: z.coerce.number().int().optional(),
    customerActionRequired: z.boolean().optional(),
    customerActions: z.array(z.string()).optional(),
    message: z.string().optional(),
});
export type AllocationConfirmResponse = z.infer<typeof allocationConfirmResponseSchema>;

