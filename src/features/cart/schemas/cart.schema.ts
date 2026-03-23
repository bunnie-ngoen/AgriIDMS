import { z } from "zod";

export const cartItemSchema = z.object({
    productVariantId: z.coerce.number().int(),
    productVariantName: z.string(),
    productName: z.string(),
    grade: z.string(),
    imageUrl: z.string().nullable().optional(),
    quantity: z.coerce.number().int(),
    boxWeight: z.coerce.number(),
    isPartial: z.boolean(),
    unitPrice: z.coerce.number(),
    // BE có thể trả sẵn; FE cũng có thể tự tính lại cho chắc.
    lineAmount: z.coerce.number().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const cartDtoSchema = z.object({
    items: z.array(cartItemSchema),
    totalAmount: z.coerce.number(),
    // BE: CreatedAt/UpdatedAt là DateTime (serializes string ISO).
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
});

export type CartDto = z.infer<typeof cartDtoSchema>;

// ─── Checkout (from-cart) response ────────────────────────────────────────

export const orderItemFromCartSchema = z.object({
    productVariantId: z.coerce.number().int(),
    productName: z.string(),
    grade: z.string(),
    boxWeight: z.coerce.number(),
    isPartial: z.boolean(),
    quantity: z.coerce.number().int(),
    unitPrice: z.coerce.number(),
});

export const createOrderFromCartResponseSchema = z.object({
    orderId: z.coerce.number().int(),
    totalAmount: z.coerce.number(),
    items: z.array(orderItemFromCartSchema),
    allocationSucceeded: z.boolean(),
    allocationMessage: z.string().nullable().optional(),
});

export type CreateOrderFromCartResponse = z.infer<
    typeof createOrderFromCartResponseSchema
>;

