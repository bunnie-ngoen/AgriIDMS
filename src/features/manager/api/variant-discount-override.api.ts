import { api } from "../../../shared/api";

export type ProductVariantDiscountOverride = {
  id: number;
  productVariantId: number;
  lotId?: number | null;
  overrideNearExpiryDiscountPercent: number;
  reason?: string | null;
  isActive: boolean;
  startAtUtc?: string | null;
  endAtUtc?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type UpsertProductVariantDiscountOverride = {
  productVariantId: number;
  lotId?: number | null;
  overrideNearExpiryDiscountPercent: number;
  reason?: string | null;
  isActive: boolean;
  startAtUtc?: string | null;
  endAtUtc?: string | null;
};

export const variantDiscountOverrideApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductVariantDiscountOverrides: builder.query<
      ProductVariantDiscountOverride[],
      void
    >({
      query: () => ({ url: "Lots/product-variant-discount-overrides" }),
      providesTags: [{ type: "Lot" as const, id: "VARIANT_DISCOUNT_OVERRIDES" }],
    }),
    updateProductVariantDiscountOverrides: builder.mutation<
      { message?: string },
      UpsertProductVariantDiscountOverride[]
    >({
      query: (body) => ({
        url: "Lots/product-variant-discount-overrides",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Lot" as const, id: "VARIANT_DISCOUNT_OVERRIDES" }],
    }),
  }),
});

export const {
  useGetProductVariantDiscountOverridesQuery,
  useUpdateProductVariantDiscountOverridesMutation,
} = variantDiscountOverrideApi;
