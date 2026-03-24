import { z } from "zod";

export const notificationItemSchema = z.object({
  userNotificationId: z.coerce.number().int(),
  notificationId: z.coerce.number().int(),
  type: z.string(),
  message: z.string(),
  referenceType: z.string().nullable().optional(),
  referenceId: z.coerce.number().int().nullable().optional(),
  createdAt: z.string(),
  isRead: z.boolean(),
  readAt: z.string().nullable().optional(),
});

export const pagedNotificationSchema = z.object({
  total: z.coerce.number().int(),
  items: z.array(notificationItemSchema),
});

export const unreadCountSchema = z.object({
  unreadCount: z.coerce.number().int(),
});

export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type PagedNotification = z.infer<typeof pagedNotificationSchema>;
export type UnreadCountResponse = z.infer<typeof unreadCountSchema>;
