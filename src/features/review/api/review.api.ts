import { api } from "../../../shared/api";
import {
  approvedReviewListSchema,
  createReviewRequestSchema,
  reviewableResponseSchema,
  type ApprovedReviewList,
  type CreateReviewRequest,
  type ReviewableResponse,
} from "../schemas/review.schema";

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

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    isReviewableByOrderDetail: builder.query<ReviewableResponse, number>({
      query: (orderDetailId) => ({
        url: `Reviews/order-details/${orderDetailId}/is-reviewable`,
        method: "GET",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = reviewableResponseSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid reviewable response");
        return parsed.data;
      },
    }),

    createReview: builder.mutation<void, CreateReviewRequest>({
      query: (body) => {
        const parsed = createReviewRequestSchema.safeParse(body);
        if (!parsed.success) throw new Error("Invalid review request");
        return {
          url: "Reviews",
          method: "POST",
          body: parsed.data,
        };
      },
    }),

    getApprovedReviewsByProductVariant: builder.query<
      ApprovedReviewList,
      { productVariantId: number; skip?: number; take?: number }
    >({
      query: ({ productVariantId, skip = 0, take = 10 }) => ({
        url: `Reviews/product-variants/${productVariantId}/approved`,
        method: "GET",
        params: { skip, take },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = approvedReviewListSchema.safeParse(normalized);
        if (!parsed.success) {
          return {
            productVariantId: 0,
            skip: 0,
            take: 10,
            count: 0,
            items: [],
          };
        }
        return parsed.data;
      },
    }),
  }),
});

export const {
  useIsReviewableByOrderDetailQuery,
  useCreateReviewMutation,
  useGetApprovedReviewsByProductVariantQuery,
} = reviewApi;

