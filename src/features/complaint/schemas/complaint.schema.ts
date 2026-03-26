import { z } from "zod";

export const complaintTypeEnum = z.enum(["Damaged", "MissingQuantity", "WrongItem", "Other"]);
export const complaintStatusEnum = z.enum(["Pending", "Verified", "Rejected", "Closed"]);

export const complaintableBoxListItemSchema = z.object({
  boxId: z.coerce.number().int(),
  boxCode: z.string(),
  reservedQuantity: z.coerce.number(),
  complaintableQuantity: z.coerce.number(),
  hasPendingComplaint: z.boolean(),
});

export const eligibleOrderForComplaintListItemSchema = z.object({
  orderId: z.coerce.number().int(),
  status: z.string(),
  createdAt: z.string(),
  boxCount: z.coerce.number().int(),
});

export const complaintSchema = z.object({
  id: z.coerce.number().int(),
  orderId: z.coerce.number().int(),
  boxId: z.coerce.number().int(),
  type: z.string(),
  status: z.string(),
  damagedQuantity: z.coerce.number(),
  description: z.string().nullable().optional(),
  customerEvidenceUrl: z.string().nullable().optional(),
  isVerified: z.boolean(),
  verifiedBy: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  boxCode: z.string().nullable().optional(),
});

export const complaintListSchema = z.array(complaintSchema);

export const createComplaintRequestSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  boxId: z.coerce.number().int().positive(),
  type: complaintTypeEnum,
  damagedQuantity: z.coerce.number().positive(),
  description: z.string().max(500).optional(),
  customerEvidenceUrl: z.string().max(500).optional(),
});

export type Complaint = z.infer<typeof complaintSchema>;
export type ComplaintType = z.infer<typeof complaintTypeEnum>;
export type ComplaintStatus = z.infer<typeof complaintStatusEnum>;
export type CreateComplaintRequest = z.infer<typeof createComplaintRequestSchema>;

export type ComplaintableBoxListItemDto = z.infer<typeof complaintableBoxListItemSchema>;
export type EligibleOrderForComplaintListItemDto = z.infer<
  typeof eligibleOrderForComplaintListItemSchema
>;
