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

/** Khớp BE UpdateCartItemRequest */
export const updateCartItemRequestSchema = z.object({
    boxWeight: z.number().min(0.01),
    isPartial: z.boolean(),
    quantity: z.number().int().min(1),
});
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>;

/** Khớp BE CartItemDto (Grade từ BE là string, LineAmount computed) */
export const cartItemSchema = z.object({
    productVariantId: z.number(),
    productVariantName: z.string().optional().nullable(),
    productName: z.string(),
    grade: z.union([z.number(), z.string()]),
    imageUrl: z.string().optional().nullable(),
    quantity: z.number(),
    boxWeight: z.number(),
    isPartial: z.boolean(),
    unitPrice: z.number(),
    lineAmount: z.number().optional(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

/** Khớp BE CartDto */
export const cartSchema = z.object({
    items: z.array(cartItemSchema).default([]),
    totalAmount: z.number().default(0),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
});
export type Cart = z.infer<typeof cartSchema>;

/** Response POST Orders/from-cart – BE trả { Message, OrderId, TotalAmount, Items } */
export const createOrderFromCartResponseSchema = z.object({
    orderId: z.number(),
    totalAmount: z.number().optional(),
    message: z.string().optional(),
    items: z.array(z.object({
        productVariantId: z.number(),
        productName: z.string(),
        grade: z.union([z.number(), z.string()]),
        quantity: z.number(),
        unitPrice: z.number(),
        lineAmount: z.number().optional(),
    })).optional(),
});
export type CreateOrderFromCartResponse = z.infer<typeof createOrderFromCartResponseSchema>;

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
