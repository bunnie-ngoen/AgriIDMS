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
    items: z.array(cartItemSchema).default([]),
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
    recipient: z
        .object({
            fullName: z.string(),
            phone: z.string(),
            address: z.string(),
        })
        .optional(),
    items: z.array(orderItemFromCartSchema),
    allocationSucceeded: z.boolean(),
    allocationMessage: z.string().nullable().optional(),
});

export type CreateOrderFromCartResponse = z.infer<
    typeof createOrderFromCartResponseSchema
>;

/** BE: GET Orders/checkout-defaults → OrderCheckoutDefaultsDto */
export const orderCheckoutDefaultsSchema = z.object({
    fullName: z.string(),
    phone: z.string(),
    address: z.string(),
});

export type OrderCheckoutDefaults = z.infer<typeof orderCheckoutDefaultsSchema>;

/** BE: OrderRecipientCheckoutDto (POST from-cart / from-cart/variants) */
export const orderRecipientCheckoutSchema = z.object({
    fullName: z.string().min(1, "Họ tên người nhận không được để trống"),
    phone: z.string().min(1, "Số điện thoại không được để trống"),
    address: z.string().min(1, "Địa chỉ không được để trống"),
});

export type OrderRecipientCheckout = z.infer<typeof orderRecipientCheckoutSchema>;

/** Kiểm tra trước khi gọi API đặt hàng — nếu thiếu/sai thì trả message để hiển thị lỗi FE. */
export function validateOrderRecipientCheckout(input: {
    fullName: string;
    phone: string;
    address: string;
}):
    | { ok: true; value: OrderRecipientCheckout }
    | { ok: false; message: string } {
    const trimmed = {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
    };
    const parsed = orderRecipientCheckoutSchema.safeParse(trimmed);
    if (!parsed.success) {
        const first = parsed.error.issues[0];
        return {
            ok: false,
            message: first?.message ?? "Thông tin người nhận không hợp lệ.",
        };
    }
    return { ok: true, value: parsed.data };
}

