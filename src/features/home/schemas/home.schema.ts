import { z } from "zod";

/**
 * Khớp BE: ProductVariantResponseCustomerHomeDto
 * Grade từ BE là enum ProductGrade (1, 2, 3) serialized thành number.
 */
export const homeProductSchema = z.object({
    id: z.number(),
    productId: z.number(),
    productName: z.string(),
    grade: z.number(), // 1 = Grade1, 2 = Grade2, 3 = Grade3
    price: z.number(),
    imageUrl: z.string().optional().nullable(),
});

export const homeProductListSchema = z.array(homeProductSchema);

export type HomeProduct = z.infer<typeof homeProductSchema>;

// ─── Cart (khớp BE AddCartItemRequest) ─────────────────────────────────────

export const addToCartRequestSchema = z.object({
    productVariantId: z.number(),
    boxWeight: z.number().min(0.01),
    isPartial: z.boolean(),
    quantity: z.number().int().min(1),
});

export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;

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
