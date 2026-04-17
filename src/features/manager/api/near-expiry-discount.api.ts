import { api } from "../../../shared/api";

export type NearExpiryDiscountRule = {
  id: number;
  name?: string | null;
  minDaysLeft?: number | null;
  maxDaysLeft: number;
  discountPercent: number;
  priority: number;
  isActive: boolean;
  startAtUtc?: string | null;
  endAtUtc?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type UpsertNearExpiryDiscountRule = {
  name?: string | null;
  minDaysLeft?: number | null;
  maxDaysLeft: number;
  discountPercent: number;
  priority: number;
  isActive: boolean;
  startAtUtc?: string | null;
  endAtUtc?: string | null;
};

export const nearExpiryDiscountApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNearExpiryDiscountRules: builder.query<NearExpiryDiscountRule[], void>({
      query: () => ({ url: "Lots/near-expiry-discount-rules" }),
      providesTags: [{ type: "Lot" as const, id: "NEAR_EXPIRY_RULES" }],
    }),
    updateNearExpiryDiscountRules: builder.mutation<
      { message?: string },
      UpsertNearExpiryDiscountRule[]
    >({
      query: (body) => ({
        url: "Lots/near-expiry-discount-rules",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Lot" as const, id: "NEAR_EXPIRY_RULES" }],
    }),
  }),
});

export const {
  useGetNearExpiryDiscountRulesQuery,
  useUpdateNearExpiryDiscountRulesMutation,
} = nearExpiryDiscountApi;

