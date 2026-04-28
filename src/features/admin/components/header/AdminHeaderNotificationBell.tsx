import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../../../notification/api/notification.api";
import { useRoleGuard } from "../../../auth/hooks/useRoleGuard";

import { formatVietnamNotificationTime } from "../../../../shared/lib/vietnamTime";
import { useGetWarehousesQuery } from "../../api/create-user.api";
import { useGetUnassignedBoxesByWarehouseQuery } from "../../../goods-receipt/api/goods-receipt.api";

export default function AdminHeaderNotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const { isManager, isWarehouseStaff } = useRoleGuard();

  const lotBasePath = isWarehouseStaff()
    ? "/warehouse/lots"
    : isManager()
      ? "/manager/lots"
      : "/admin/lots";
  const goodsReceiptBasePath = isWarehouseStaff()
    ? "/warehouse/goods-receipts"
    : isManager()
      ? "/manager/goods-receipts"
      : "/admin/goods-receipts";
  const purchaseOrderBasePath = isManager()
    ? "/manager/purchase-orders"
    : "/admin/purchase-orders";
  const putawayBasePath = isWarehouseStaff()
    ? "/warehouse/putaway"
    : isManager()
      ? "/manager/putaway"
      : "/admin/putaway";

  const { data: notificationData, refetch: refetchNotifications } =
    useGetMyNotificationsQuery({ page: 1, pageSize: 10 });
  const { data: unreadCountData, refetch: refetchUnreadCount } =
    useGetUnreadNotificationCountQuery();
  const shouldShowPutawayFallback = isManager() || isWarehouseStaff();
  const { data: warehouses = [] } = useGetWarehousesQuery(undefined, {
    skip: !shouldShowPutawayFallback,
  });
  const warehouseWithMostUnassigned = useMemo(() => {
    return warehouses
      .filter((w) => Number(w.unassignedStockWeight ?? 0) > 0)
      .sort(
        (a, b) =>
          Number(b.unassignedStockWeight ?? 0) - Number(a.unassignedStockWeight ?? 0),
      )[0];
  }, [warehouses]);
  const { data: unassignedBoxes = [] } = useGetUnassignedBoxesByWarehouseQuery(
    warehouseWithMostUnassigned?.id ?? 0,
    { skip: !warehouseWithMostUnassigned?.id },
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] =
    useMarkAllNotificationsAsReadMutation();

  const hasServerPutawayNotification = useMemo(() => {
    const items = notificationData?.items ?? [];
    return items.some((item) => {
      const ref = item.referenceType ?? "";
      const t = item.type ?? "";
      return (
        ref.includes("Putaway") ||
        ref.includes("Unassigned") ||
        ref === "LotPendingPutaway" ||
        t.includes("Putaway") ||
        t.includes("Unassigned")
      );
    });
  }, [notificationData?.items]);

  const fallbackPutawayNotification = useMemo(() => {
    if (!shouldShowPutawayFallback || hasServerPutawayNotification) return null;
    if (!warehouseWithMostUnassigned) return null;
    const lotId =
      unassignedBoxes.find((b) => Number(b.lotId) > 0)?.lotId ?? null;
    const unassignedWeight = Number(
      warehouseWithMostUnassigned.unassignedStockWeight ?? 0,
    );
    if (unassignedWeight <= 0) return null;

    return {
      userNotificationId: -1,
      notificationId: -1,
      type: "NeedPutawayLocal",
      message: `Kho ${warehouseWithMostUnassigned.name} còn ${unassignedWeight.toLocaleString("vi-VN")} kg hàng chưa xếp vị trí.`,
      referenceType: "LotPendingPutaway",
      referenceId: lotId,
      warehouseId: warehouseWithMostUnassigned.id,
      createdAt: new Date().toISOString(),
      isRead: false,
      readAt: null,
    };
  }, [
    shouldShowPutawayFallback,
    hasServerPutawayNotification,
    warehouseWithMostUnassigned,
    unassignedBoxes,
  ]);

  const displayedNotifications = useMemo(() => {
    const base = notificationData?.items ?? [];
    return fallbackPutawayNotification
      ? [fallbackPutawayNotification, ...base]
      : base;
  }, [notificationData?.items, fallbackPutawayNotification]);

  const unreadCount =
    (unreadCountData?.unreadCount ?? 0) + (fallbackPutawayNotification ? 1 : 0);

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

  const handleReadAll = async () => {
    try {
      await markAllAsRead().unwrap();
      await Promise.all([refetchNotifications(), refetchUnreadCount()]);
    } catch {
      // Keep UI responsive even if mark all read fails.
    }
  };

  const getNavigationPath = (item: {
    type?: string | null;
    referenceType?: string | null;
    referenceId?: number | null;
    warehouseId?: number | null;
  }): string | null => {
    const referenceType = item.referenceType ?? "";
    const notificationType = item.type ?? "";
    const referenceId = item.referenceId ?? null;

    if (
      referenceType === "PurchaseOrder" ||
      referenceType === "PurchaseOrderApproval" ||
      referenceType === "PurchaseOrderApprovalRequest" ||
      referenceType.includes("PurchaseOrder") ||
      notificationType.includes("PurchaseOrder")
    ) {
      return referenceId ? `${purchaseOrderBasePath}/${referenceId}` : purchaseOrderBasePath;
    }

    const putawayKeywords = ["Putaway", "Unassigned", "Unslotted", "NeedSlot", "NeedPutaway"];
    const isPutawayNotification =
      putawayKeywords.some((k) => referenceType.includes(k) || notificationType.includes(k)) ||
      referenceType === "LotPendingPutaway";
    if (isPutawayNotification) {
      const params = new URLSearchParams();
      if (referenceId) params.set("lotId", String(referenceId));
      if (item.warehouseId && item.warehouseId > 0) params.set("warehouseId", String(item.warehouseId));
      const query = params.toString();
      return query ? `${putawayBasePath}?${query}` : putawayBasePath;
    }

    switch (referenceType) {
      case "NearExpiryLot":
        return referenceId ? `${lotBasePath}/${referenceId}` : lotBasePath;
      case "StockCheck": {
        if (!referenceId) return isWarehouseStaff() ? "/warehouse/stock-checks" : isManager() ? "/manager/stock-checks" : "/admin/stock-checks";
        if (isWarehouseStaff()) return `/warehouse/stock-checks/${item.referenceId}`;
        if (isManager()) return `/manager/stock-checks/${item.referenceId}`;
        return `/admin/stock-checks/${item.referenceId}`;
      }
      case "GoodsReceipt":
        return referenceId ? `${goodsReceiptBasePath}/${referenceId}` : goodsReceiptBasePath;
      case "BackorderExpired":
        // Only warehouse staff has the proposals page.
        if (isWarehouseStaff()) {
          return referenceId ? `/warehouse/orders/${referenceId}/proposals` : "/warehouse/orders";
        }
        return null;
      case "DisposalRequest":
        return isManager()
          ? "/manager/disposal-requests"
          : isWarehouseStaff()
            ? "/warehouse/goods-receipts"
            : "/admin/disposal-requests";
      default:
        return null;
    }
  };

  const handleNotificationClick = async (item: {
    notificationId: number;
    isRead: boolean;
    type?: string | null;
    referenceType?: string | null;
    referenceId?: number | null;
    warehouseId?: number | null;
  }) => {
    // Navigate after marking as read (best effort).
    if (!item.isRead) {
      try {
        await markAsRead(item.notificationId).unwrap();
        await Promise.all([refetchNotifications(), refetchUnreadCount()]);
      } catch {
        // Even if mark-as-read fails, still navigate to reduce user friction.
      }
    }

    const referenceType = item.referenceType ?? "";
    const notificationType = item.type ?? "";
    const putawayKeywords = ["Putaway", "Unassigned", "Unslotted", "NeedSlot", "NeedPutaway"];
    const isPutawayNotification =
      putawayKeywords.some((k) => referenceType.includes(k) || notificationType.includes(k)) ||
      referenceType === "LotPendingPutaway";

    setOpen(false);
    if (isPutawayNotification) {
      navigate(putawayBasePath, {
        state: {
          lotId: item.referenceId ?? null,
          warehouseId: item.warehouseId ?? null,
        },
      });
      return;
    }

    const path = getNavigationPath(item);
    if (path) navigate(path);
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
        <div className="fixed left-3 right-3 top-[68px] z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[360px] sm:max-w-[90vw]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 gap-2">
            <p className="text-sm font-semibold text-gray-800">Thông báo</p>
            <button
              type="button"
              onClick={() => void handleReadAll()}
              disabled={isMarkingAllAsRead || unreadCount === 0}
              className="text-[11px] sm:text-xs font-semibold text-emerald-700 hover:underline disabled:text-gray-400 whitespace-nowrap"
            >
              <span className="sm:hidden">Đã đọc hết</span>
              <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
            </button>
          </div>

          <div className="max-h-[380px] overflow-auto">
            {!displayedNotifications.length ? (
              <p className="px-4 py-5 text-sm text-gray-500">
                Chưa có thông báo nào.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayedNotifications.map((item) => (
                  <button
                    key={item.userNotificationId}
                    type="button"
                    onClick={() => void handleNotificationClick(item)}
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
                      {formatVietnamNotificationTime(item.createdAt)}
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
