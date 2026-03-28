import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../../../notification/api/notification.api";

function formatNotificationTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString("vi-VN");
}

export default function AdminHeaderNotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const { data: notificationData, refetch: refetchNotifications } =
    useGetMyNotificationsQuery({ page: 1, pageSize: 10 });
  const { data: unreadCountData, refetch: refetchUnreadCount } =
    useGetUnreadNotificationCountQuery();

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] =
    useMarkAllNotificationsAsReadMutation();

  const unreadCount = unreadCountData?.unreadCount ?? 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((prev) => !prev);
    await Promise.all([refetchNotifications(), refetchUnreadCount()]);
  };

  const handleReadOne = async (notificationId: number, isRead: boolean) => {
    if (isRead) return;
    try {
      await markAsRead(notificationId).unwrap();
      await Promise.all([refetchNotifications(), refetchUnreadCount()]);
    } catch {
      // Keep UI responsive even if mark read fails.
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAsRead().unwrap();
      await Promise.all([refetchNotifications(), refetchUnreadCount()]);
    } catch {
      // Keep UI responsive even if mark all read fails.
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        aria-label="Thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Thông báo</p>
            <button
              type="button"
              onClick={() => void handleReadAll()}
              disabled={isMarkingAllAsRead || unreadCount === 0}
              className="text-xs font-semibold text-emerald-700 hover:underline disabled:text-gray-400"
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          <div className="max-h-[380px] overflow-auto">
            {!notificationData?.items?.length ? (
              <p className="px-4 py-5 text-sm text-gray-500">
                Chưa có thông báo nào.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {notificationData.items.map((item) => (
                  <button
                    key={item.userNotificationId}
                    type="button"
                    onClick={() =>
                      void handleReadOne(item.notificationId, item.isRead)
                    }
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      item.isRead ? "bg-white" : "bg-emerald-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-5 text-gray-800">
                        {item.message}
                      </p>
                      {!item.isRead ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {formatNotificationTime(item.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
