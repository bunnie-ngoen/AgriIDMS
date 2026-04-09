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

export const exportPrintLineSchema = z.object({
  boxCode: z.string(),
  grade: z.string().optional().nullable(),
  boxWeight: z.coerce.number().optional().nullable(),
  quantity: z.coerce.number(),
});

export const exportPrintDataSchema = z.object({
  exportId: z.coerce.number().int(),
  exportCode: z.string(),
  orderId: z.coerce.number().int(),
  createdAt: z.string(),
  snapshotPhase: z.string().optional().nullable(),
  isPreview: z.boolean().optional().nullable(),
  printWarningMessage: z.string().optional().nullable(),
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
