import { z } from "zod";

export const exportDetailSchema = z.object({
  id: z.coerce.number().int(),
  boxId: z.coerce.number().int(),
  boxCode: z.string(),
  actualQuantity: z.coerce.number(),
  boxStatus: z.string(),
});

export const exportReceiptSchema = z.object({
  id: z.coerce.number().int(),
  exportCode: z.string(),
  orderId: z.coerce.number().int(),
  status: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  details: z.array(exportDetailSchema),
});

export type ExportDetail = z.infer<typeof exportDetailSchema>;
export type ExportReceipt = z.infer<typeof exportReceiptSchema>;

/** Khớp ExportPrintLineDto (JSON camelCase). */
export const exportPrintLineSchema = z.object({
  lineNo: z.coerce.number().int(),
  boxId: z.coerce.number().int(),
  boxCode: z.string(),
  lotCode: z.string(),
  productName: z.string(),
  grade: z.string(),
  boxWeightKg: z.coerce.number(),
  requestedQuantity: z.coerce.number().optional(),
  unitPrice: z.coerce.number().optional(),
  lineAmount: z.coerce.number().optional(),
  actualQuantity: z.coerce.number(),
  boxType: z.string(),
  isPartial: z.boolean(),
});

/** Khớp ExportPrintDataDto (JSON camelCase). */
export const exportPrintDataSchema = z.object({
  schemaVersion: z.string().optional(),
  snapshotAtUtc: z.string(),
  isPreview: z.boolean(),
  exportId: z.coerce.number().int(),
  exportCode: z.string(),
  exportStatus: z.string(),
  orderId: z.coerce.number().int(),
  orderStatus: z.string(),
  orderSource: z.string(),
  fulfillmentType: z.string(),
  totalAmount: z.coerce.number(),
  recipientFullName: z.string(),
  recipientPhone: z.string(),
  recipientAddress: z.string(),
  customerUserId: z.string().optional().nullable(),
  lines: z.array(exportPrintLineSchema),
});

export type ExportPrintData = z.infer<typeof exportPrintDataSchema>;

/** GET Exports/staff/pending-approve */
export const pendingApproveExportListItemSchema = z.object({
  exportId: z.coerce.number().int(),
  exportCode: z.string(),
  orderId: z.coerce.number().int(),
  status: z.string(),
  createdAt: z.string(),
  boxCount: z.coerce.number().int(),
});

export const pendingApproveExportListSchema = z.array(pendingApproveExportListItemSchema);
export type PendingApproveExportListItem = z.infer<typeof pendingApproveExportListItemSchema>;
