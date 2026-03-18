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
    type HomeProduct,
    type HomeProductDetail,
    type AddToCartRequest
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

        // BE: GET api/Home/{id}
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

        // BE: POST api/Carts/items
        addToCart: builder.mutation<void, AddToCartRequest>({
            query: (body) => ({
                url: "Carts/items",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Cart"],
        }),

    }),
});

export const {
    useGetHomeProductsQuery,
    useGetHomeProductDetailQuery,
    useAddToCartMutation
} = homeApi;