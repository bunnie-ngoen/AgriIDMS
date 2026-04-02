import { z } from "zod";

export const reviewableResponseSchema = z.object({
  orderDetailId: z.coerce.number().int(),
  isReviewable: z.boolean(),
});

export type ReviewableResponse = z.infer<typeof reviewableResponseSchema>;

export const createReviewRequestSchema = z.object({
  orderDetailId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  freshness: z.coerce.number().int().min(1).max(5),
  packaging: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type CreateReviewRequest = z.infer<typeof createReviewRequestSchema>;

export const approvedReviewItemSchema = z.object({
  id: z.coerce.number().int(),
  productVariantId: z.coerce.number().int(),
  customerId: z.string(),
  customerName: z.string().nullable().optional(),
  rating: z.coerce.number().int(),
  freshness: z.coerce.number().int(),
  packaging: z.coerce.number().int(),
  comment: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const approvedReviewListSchema = z.object({
  productVariantId: z.coerce.number().int(),
  skip: z.coerce.number().int(),
  take: z.coerce.number().int(),
  count: z.coerce.number().int(),
  items: z.array(approvedReviewItemSchema),
});

export type ApprovedReviewList = z.infer<typeof approvedReviewListSchema>;

