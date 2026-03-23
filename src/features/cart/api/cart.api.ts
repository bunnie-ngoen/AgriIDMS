import { api } from "../../../shared/api";
import type { CartDto, CreateOrderFromCartResponse } from "../schemas/cart.schema";
import {
    cartDtoSchema,
    createOrderFromCartResponseSchema,
} from "../schemas/cart.schema";

/** Chuyển key PascalCase (BE) -> camelCase (FE). */
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

export const cartApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // BE: GET api/Carts
        getMyCart: builder.query<CartDto, void>({
            query: () => ({
                url: "Carts",
                method: "GET",
            }),
            providesTags: ["Cart"],
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = cartDtoSchema.safeParse(normalized);
                if (!parsed.success) {
                    console.error("[cartApi] getMyCart schema failed:", parsed.error.flatten());
                    // Trả fallback để FE vẫn render được (thay vì crash).
                    return { items: [], totalAmount: 0, createdAt: undefined, updatedAt: undefined };
                }
                return parsed.data;
            },
        }),

        // BE: PUT api/Carts/items/{productVariantId}
        updateCartItemQuantity: builder.mutation<
            void,
            { productVariantId: number; boxWeight: number; isPartial: boolean; quantity: number }
        >({
            query: ({ productVariantId, ...body }) => ({
                url: `Carts/items/${productVariantId}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Cart"],
        }),

        // BE: DELETE api/Carts/items/{productVariantId}?boxWeight=...&isPartial=...
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
            query: () => ({
                url: "Carts",
                method: "DELETE",
            }),
            invalidatesTags: ["Cart"],
        }),

        // BE: POST api/Orders/from-cart
        createOrderFromCart: builder.mutation<CreateOrderFromCartResponse, void>({
            query: () => ({
                url: "Orders/from-cart",
                method: "POST",
            }),
            invalidatesTags: ["Cart"],
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = createOrderFromCartResponseSchema.safeParse(normalized);
                if (!parsed.success) {
                    console.error("[cartApi] createOrderFromCart schema failed:", parsed.error.flatten());
                    // Nếu schema fail thì ném để UI bắt error.
                    throw new Error("Invalid order response");
                }
                return parsed.data;
            },
        }),

        // BE: POST api/Orders/from-cart/variants
        createOrderFromCartVariants: builder.mutation<
            CreateOrderFromCartResponse,
            { items: Array<{ productVariantId: number; boxWeight: number; isPartial: boolean; quantity: number }> }
        >({
            query: (body) => ({
                url: "Orders/from-cart/variants",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Cart"],
            transformResponse: (raw: unknown) => {
                const normalized = toCamelCase(raw);
                const parsed = createOrderFromCartResponseSchema.safeParse(normalized);
                if (!parsed.success) {
                    console.error("[cartApi] createOrderFromCartVariants schema failed:", parsed.error.flatten());
                    throw new Error("Invalid order response");
                }
                return parsed.data;
            },
        }),
    }),
});

export const {
    useGetMyCartQuery,
    useUpdateCartItemQuantityMutation,
    useRemoveCartItemMutation,
    useClearCartMutation,
    useCreateOrderFromCartMutation,
    useCreateOrderFromCartVariantsMutation,
} = cartApi;

