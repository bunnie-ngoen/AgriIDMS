import { api } from "../../../shared/api";
import {
  pagedNotificationSchema,
  unreadCountSchema,
  type PagedNotification,
  type UnreadCountResponse,
} from "../schemas/notification.schema";

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

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query<
      PagedNotification,
      { unreadOnly?: boolean; page?: number; pageSize?: number } | void
    >({
      query: (arg) => ({
        url: "Notifications",
        method: "GET",
        params: {
          unreadOnly: arg?.unreadOnly ?? false,
          page: arg?.page ?? 1,
          pageSize: arg?.pageSize ?? 20,
        },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = pagedNotificationSchema.safeParse(normalized);
        if (!parsed.success) return { total: 0, items: [] };
        return parsed.data;
      },
      providesTags: ["Notification"],
    }),

    getUnreadNotificationCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: "Notifications/unread-count",
        method: "GET",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = unreadCountSchema.safeParse(normalized);
        if (!parsed.success) return { unreadCount: 0 };
        return parsed.data;
      },
      providesTags: ["Notification"],
    }),

    markNotificationAsRead: builder.mutation<void, number>({
      query: (userNotificationId) => ({
        url: `Notifications/${userNotificationId}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "Notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApi;
