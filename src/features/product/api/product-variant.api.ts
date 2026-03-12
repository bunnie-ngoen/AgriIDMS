import { api } from "../../../shared/api";
import type { ProductVariant } from "../types/product-variant.type";
import type { ProductVariantDto } from "../schemas/product-variant.schema";

export const productVariantApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getProductVariants: builder.query<ProductVariant[], void>({
            query: () => ({ url: "ProductVariant" }),
            providesTags: ["ProductVariant"],
        }),

        createProductVariant: builder.mutation<number, ProductVariantDto>({
            query: (body) => ({
                url: "ProductVariant",
                method: "POST",
                body,
            }),
            invalidatesTags: ["ProductVariant"],
        }),

        updateProductVariant: builder.mutation<void, { id: number } & ProductVariantDto>({
            query: ({ id, ...body }) => ({
                url: `ProductVariant/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["ProductVariant"],
        }),

        deleteProductVariant: builder.mutation<void, number>({
            query: (id) => ({
                url: `ProductVariant/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ProductVariant"],
        }),
        toggleProductVariantStatus: builder.mutation<void, { id: number; isActive: boolean }>({
            query: ({ id, isActive }) => ({
                url: `ProductVariant/${id}`,
                method: "PATCH",
                body: { isActive },
            }),
            invalidatesTags: ["ProductVariant"],
        }),
    }),
});

export const {
    useGetProductVariantsQuery,
    useCreateProductVariantMutation,
    useUpdateProductVariantMutation,
    useDeleteProductVariantMutation,
    useToggleProductVariantStatusMutation
} = productVariantApi;