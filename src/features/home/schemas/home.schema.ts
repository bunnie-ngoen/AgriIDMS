import { z } from "zod";

/**
 * Khớp BE: ProductVariantResponseCustomerHomeDto
 * Grade từ BE là enum ProductGrade (1, 2, 3) serialized thành number.
 * Các field nearExpiry* do HomePageService tính — gộp rule gần HSD và ghi đè variant; FE dùng productHasActiveSaleDisplay() cho badge danh sách.
 */
export const homeProductSchema = z.object({
    id: z.number(),
    productId: z.number(),
    productName: z.string(),
    grade: z.number(), // 1 = Grade1, 2 = Grade2, 3 = Grade3
    price: z.number(),
    imageUrl: z.string().optional().nullable(),
    hasNearExpiryStock: z.boolean().optional().default(false),
    nearExpiryDiscountPercent: z.number().optional().nullable(),
    nearExpiryPricePerKg: z.number().optional().nullable(),
    nearExpiryPriceTiers: z.array(z.object({
        maxDaysLeft: z.number(),
        discountPercent: z.number(),
        pricePerKg: z.number(),
        boxCount: z.number(),
    })).optional().default([]),
});

export const homeProductListSchema = z.array(homeProductSchema);

export type HomeProduct = z.infer<typeof homeProductSchema>;

// ─── Cart (khớp BE AddCartItemRequest) ─────────────────────────────────────

export const addToCartRequestSchema = z.object({
    productVariantId: z.number().int().positive("Vui lòng chọn biến thể sản phẩm hợp lệ"),
    boxWeight: z.number().min(0.01, "Trọng lượng hộp phải lớn hơn 0"),
    isPartial: z.boolean(),
    quantity: z.number().int().min(1, "Số lượng phải ít nhất 1"),
});

export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;

/** Kiểm tra body trước khi POST Carts/items — tránh gửi thiếu dữ liệu. */
export function validateAddToCartRequest(
    input: unknown,
): { ok: true; value: AddToCartRequest } | { ok: false; message: string } {
    const parsed = addToCartRequestSchema.safeParse(input);
    if (!parsed.success) {
        const first = parsed.error.issues[0];
        return {
            ok: false,
            message: first?.message ?? "Dữ liệu thêm vào giỏ không hợp lệ.",
        };
    }
    return { ok: true, value: parsed.data };
}

// ─── Detail – BoxType (khớp BE BoxTypeDto) ───────────────────────────────────

export const boxTypeSchema = z.object({
    boxType: z.string(),       // "Full" | "Partial"
    weight: z.number(),
    availableCount: z.number(),
    boxPrice: z.number(),
});

export type BoxType = z.infer<typeof boxTypeSchema>;

/**
 * Khớp BE: ProductVariantResponseCustomerDto
 * boxTypes mặc định [] nếu BE không trả hoặc parse lỗi từng phần.
 */
export const homeProductDetailSchema = homeProductSchema.extend({
    isActive: z.boolean(),
    shelfLifeDays: z.number(),
    availableBoxCount: z.number(),
    boxTypes: z.array(boxTypeSchema).default([]),
});

export type HomeProductDetail = z.infer<typeof homeProductDetailSchema>;
