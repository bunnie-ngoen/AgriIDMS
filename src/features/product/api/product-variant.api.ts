import { api } from "../../../shared/api";
import type { ProductVariant } from "../types/product-variant.type";
import type { ProductVariantDto } from "../schemas/product-variant.schema";

type RawObject = Record<string, unknown>;

export const productVariantApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getProductVariants: builder.query<ProductVariant[], void>({
            query: () => ({ url: "ProductVariant" }),
            transformResponse: (raw: unknown): ProductVariant[] => {
                const arr = Array.isArray(raw) ? raw : [];
                return arr.map((item) => {
                    const row = (item ?? {}) as RawObject;
                    return {
                        id: (row.id as number) ?? (row.Id as number) ?? 0,
                        productId:
                            (row.productId as number) ?? (row.ProductId as number) ?? 0,
                        productName:
                            (row.productName as string) ??
                            (row.ProductName as string) ??
                            "",
                        grade:
                            (row.grade as number) ??
                            (row.Grade as number) ??
                            0,
                        price:
                            (row.price as number) ??
                            (row.Price as number) ??
                            0,
                        isActive:
                            (row.isActive as boolean) ??
                            (row.IsActive as boolean) ??
                            false,
                        shelfLifeDays:
                            (row.shelfLifeDays as number) ??
                            (row.ShelfLifeDays as number) ??
                            0,
                        imageUrl:
                            (row.imageUrl as string | null) ??
                            (row.ImageUrl as string | null) ??
                            null,
                        minReceiptWeight:
                            (row.minReceiptWeight as number | null | undefined) ??
                            (row.MinReceiptWeight as number | null | undefined) ??
                            null,
                        densityKgPerM3:
                            (row.densityKgPerM3 as number | undefined) ??
                            (row.DensityKgPerM3 as number | undefined) ??
                            0,
                        availableBoxCount:
                            (row.availableBoxCount as number | undefined) ??
                            (row.AvailableBoxCount as number | undefined) ??
                            0,
                    } satisfies ProductVariant;
                });
            },
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