import { api } from "../../../shared/api";

/** Chuyển key PascalCase sang camelCase (BE .NET có thể trả PascalCase). */
function toCamelCase(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);
    if (typeof obj === "object") {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(obj as Record<string, unknown>)) {
            const camel = key.charAt(0).toLowerCase() + key.slice(1);
            out[camel] = toCamelCase((obj as Record<string, unknown>)[key]);
        }
        return out;
    }
    return obj;
}

import {
    homeProductListSchema,
    homeProductDetailSchema,
    cartSchema,
    createOrderFromCartResponseSchema,
    type HomeProduct,
    type HomeProductDetail,
    type AddToCartRequest,
    type Cart,
    type UpdateCartItemRequest,
    type CreateOrderFromCartResponse,
} from "../schemas/home.schema";

function normalizeDetailResponse(raw: unknown): unknown {
    return toCamelCase(raw);
}

export const homeApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // BE: GET api/Home/product-variants
        getHomeProducts: builder.query<HomeProduct[], void>({
            query: () => ({
                url: "Home/product-variants",
                method: "GET",
            }),
            transformResponse: (raw: unknown) => {
                const parsed = homeProductListSchema.safeParse(raw);

                if (!parsed.success) {
                    console.error("[homeApi] Schema validation failed:", parsed.error.flatten());
                    return [];
                }

                return parsed.data;
            },
        }),

        // BE: GET api/Home?id=... (BE dùng query param, không phải path /Home/4)
        getHomeProductDetail: builder.query<HomeProductDetail, number>({
            query: (id) => ({
                url: `Home/${id}`,
                method: "GET",
            }),
            transformResponse: (raw: unknown) => {
                const normalized = normalizeDetailResponse(raw);
                const parsed = homeProductDetailSchema.safeParse(normalized);

                if (!parsed.success) {
                    console.error("[homeApi] Detail schema failed:", parsed.error.flatten());
                    throw new Error("Invalid product detail");
                }

                return parsed.data;
            },
        }),

        // BE: POST api/Carts/items (body PascalCase cho model binding)
        addToCart: builder.mutation<void, AddToCartRequest>({
            query: (body) => ({
                url: "Carts/items",
                method: "POST",
                body: {
                    ProductVariantId: body.productVariantId,
                    BoxWeight: body.boxWeight,
                    IsPartial: body.isPartial,
                    Quantity: body.quantity,
                },
            }),
            invalidatesTags: ["Cart"],
        }),

        // BE: GET api/Carts (hoặc Carts/items) – trả CartDto
        getCart: builder.query<Cart, void>({
            query: () => ({ url: "Carts", method: "GET" }),
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw) as Record<string, unknown>;
                const parsed = cartSchema.safeParse(normalized);
                if (!parsed.success) {
                    console.warn("[homeApi] getCart parse:", parsed.error.flatten());
                    return { items: [], totalAmount: 0 };
                }
                return parsed.data;
            },
            providesTags: ["Cart"],
        }),

        // BE: PUT api/Carts/items/{productVariantId} – body UpdateCartItemRequest (BoxWeight, IsPartial, Quantity)
        updateCartItem: builder.mutation<
            void,
            { productVariantId: number; boxWeight: number; isPartial: boolean; quantity: number }
        >({
            query: ({ productVariantId, boxWeight, isPartial, quantity }) => ({
                url: `Carts/items/${productVariantId}`,
                method: "PUT",
                body: {
                    BoxWeight: boxWeight,
                    IsPartial: isPartial,
                    Quantity: quantity,
                },
            }),
            invalidatesTags: ["Cart"],
        }),

        // BE: DELETE api/Carts/items/{productVariantId}?boxWeight=&isPartial=
        removeCartItem: builder.mutation<
            void,
            { productVariantId: number; boxWeight: number; isPartial: boolean }
        >({
            query: ({ productVariantId, boxWeight, isPartial }) => ({
                url: `Carts/items/${productVariantId}`,
                method: "DELETE",
                params: { boxWeight, isPartial },
            }),
            invalidatesTags: ["Cart"],
        }),

        // BE: DELETE api/Carts
        clearCart: builder.mutation<void, void>({
            query: () => ({ url: "Carts", method: "DELETE" }),
            invalidatesTags: ["Cart"],
        }),

        // BE: POST api/Orders/from-cart – trả { Message, OrderId, TotalAmount, Items }
        createOrderFromCart: builder.mutation<CreateOrderFromCartResponse, void>({
            query: () => ({
                url: "Orders/from-cart",
                method: "POST",
            }),
            invalidatesTags: ["Cart"],
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw) as Record<string, unknown>;
                const orderId = (normalized.orderId as number) ?? (normalized.OrderId as number) ?? 0;
                const totalAmount = (normalized.totalAmount as number) ?? (normalized.TotalAmount as number) ?? 0;
                const items = (normalized.items as unknown[]) ?? (normalized.Items as unknown[]) ?? [];
                const parsed = createOrderFromCartResponseSchema.safeParse({
                    orderId,
                    totalAmount,
                    message: normalized.message ?? normalized.Message,
                    items: items.length ? items : undefined,
                });
                if (!parsed.success) {
                    return { orderId, totalAmount };
                }
                return parsed.data;
            },
        }),
    }),
});

export const {
    useGetHomeProductsQuery,
    useGetHomeProductDetailQuery,
    useAddToCartMutation,
    useGetCartQuery,
    useUpdateCartItemMutation,
    useRemoveCartItemMutation,
    useClearCartMutation,
    useCreateOrderFromCartMutation,
} = homeApi;