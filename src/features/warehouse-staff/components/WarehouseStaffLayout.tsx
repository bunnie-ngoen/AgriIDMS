import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CircleAlert,
  Boxes,
  ChevronRight,
  Sparkles,
  FileText,
  LogOut,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Truck,
  User,
  Warehouse,
  Menu,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hook";
import { logout } from "../../auth/slices/auth.slice";
import { api } from "../../../shared/api";
import { persistor } from "../../../app/store";
import toast from "react-hot-toast";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../../notification/api/notification.api";

import { formatVietnamNotificationTime } from "../../../shared/lib/vietnamTime";

export default function WarehouseStaffLayout() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.user?.username?.trim() ?? "");
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isGoodsReceiptQcPage = /^\/warehouse\/goods-receipts\/\d+\/qc\/?$/.test(
    location.pathname,
  );

  const { data: notificationData, refetch: refetchNotifications } = useGetMyNotificationsQuery({
    page: 1,
    pageSize: 10,
  });
  const { data: unreadCountData, refetch: refetchUnreadCount } = useGetUnreadNotificationCountQuery();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] = useMarkAllNotificationsAsReadMutation();
  const displayedNotifications = notificationData?.items ?? [];
  const unreadCount = unreadCountData?.unreadCount ?? 0;
  const previousUnreadCountRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (previousUnreadCountRef.current === null) {
      previousUnreadCountRef.current = unreadCount;
      return;
    }
    if (unreadCount > previousUnreadCountRef.current) {
      const newItems = unreadCount - previousUnreadCountRef.current;
      toast.success(
        newItems === 1
          ? "Bạn có 1 thông báo mới."
          : `Bạn có ${newItems} thông báo mới.`,
      );
    }
    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const handleNotificationClick = async (
    userNotificationId: number,
    isRead: boolean,
    referenceId?: number | null,
    referenceType?: string | null,
    type?: string | null,
    warehouseId?: number | null,
  ) => {
    if (!isRead) {
      try {
        await markAsRead(userNotificationId).unwrap();
        await Promise.all([refetchNotifications(), refetchUnreadCount()]);
      } catch {
        // ignore
      }
    }

    const normalizedReferenceType = referenceType ?? "";
    const normalizedType = type ?? "";
    const isGoodsReceiptNotification =
      normalizedReferenceType === "GoodsReceipt" ||
      normalizedReferenceType.includes("GoodsReceipt") ||
      normalizedType.includes("GoodsReceipt");
    const isGoodsReceiptQcNotification =
      normalizedReferenceType.includes("Qc") ||
      normalizedType.includes("Qc") ||
      normalizedType.includes("QC");

    if (normalizedReferenceType === "ExportReceipt" && referenceId) {
      navigate(`/warehouse/exports?exportId=${referenceId}`);
      setNotificationOpen(false);
      return;
    }

    const putawayKeywords = ["Putaway", "Unassigned", "Unslotted", "NeedSlot", "NeedPutaway"];
    const isPutawayNotification =
      putawayKeywords.some(
        (k) => normalizedReferenceType.includes(k) || normalizedType.includes(k),
      ) || normalizedReferenceType === "LotPendingPutaway";
    if (isPutawayNotification) {
      navigate("/warehouse/putaway", {
        state: {
          lotId: referenceId ?? null,
          warehouseId: warehouseId ?? null,
        },
      });
      setNotificationOpen(false);
      return;
    }

    if (normalizedReferenceType.startsWith("Order")) {
      navigate("/warehouse/exports");
      setNotificationOpen(false);
      return;
    }

    if (isGoodsReceiptNotification) {
      const goodsReceiptPath = referenceId
        ? isGoodsReceiptQcNotification
          ? `/warehouse/goods-receipts/${referenceId}/qc`
          : `/warehouse/goods-receipts/${referenceId}`
        : "/warehouse/goods-receipts";
      navigate(goodsReceiptPath);
      setNotificationOpen(false);
      return;
    }

    navigate("/warehouse/exports");
    setNotificationOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      await Promise.all([refetchNotifications(), refetchUnreadCount()]);
    } catch {
      // ignore
    }
  };

  const [isStockCheckOpen, setIsStockCheckOpen] = useState(
    location.pathname.includes("/warehouse/stock-checks")
  );
  const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(
    location.pathname.includes("/warehouse/warehouses") ||
      location.pathname.includes("/warehouse/putaway") ||
      location.pathname.includes("/warehouse/unassigned-inventory") ||
      location.pathname.includes("/warehouse/inventory-issues") ||
      location.pathname.includes("/warehouse/damage-reports"),
  );

  const handleLogout = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState());
    persistor.purge();
    navigate("/login");
  };

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shadow-2xl shrink-0 transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onClickCapture={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("a[href]") &&
            window.innerWidth < 1024
          ) {
            setSidebarOpen(false);
          }
        }}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 bg-slate-950">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow">
            <Warehouse size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Vận hành kho</p>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {username ? `Tài khoản: ${username}` : "Tài khoản đăng nhập"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/warehouse/exports"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <PackageCheck size={15} />
                </span>
                Xuất hàng
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/warehouse/shipping"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <Truck size={15} />
                </span>
                Xác nhận shipper đã lấy hàng
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/warehouse/goods-receipts"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <FileText size={15} />
                </span>
                Nhập kho
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/warehouse/lots"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <QrCode size={15} />
                </span>
                Danh sách lô hàng
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/warehouse/profile"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <User size={15} />
                </span>
                Hồ sơ cá nhân
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/warehouse/damage-reports"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <CircleAlert size={15} />
                </span>
                Phiếu báo hỏng
              </NavLink>
            </li>

            <li className="mt-3 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setIsWarehouseMenuOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname.includes("/warehouse/warehouses")
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/70"
                }`}
              >
                <span className="flex items-center min-w-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                    <Boxes size={15} />
                  </span>
                  <span className="truncate">Quản lý kho</span>
                </span>
                <ChevronRight
                  size={16}
                  className={`transition-transform ${isWarehouseMenuOpen ? "rotate-90" : ""}`}
                />
              </button>

              {isWarehouseMenuOpen ? (
                <ul className="mt-1 pl-3 space-y-1">
                  <li>
                    <NavLink
                      to="/warehouse/warehouses"
                      className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-slate-700 text-white border border-slate-600"
                            : "text-slate-300 hover:bg-slate-800/70"
                        }`
                      }
                    >
                      Danh sách kho (sơ đồ)
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/warehouse/putaway"
                      className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-slate-700 text-white border border-slate-600"
                            : "text-slate-300 hover:bg-slate-800/70"
                        }`
                      }
                    >
                      Xếp hàng vào vị trí
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/warehouse/inventory-issues"
                      className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-slate-700 text-white border border-slate-600"
                            : "text-slate-300 hover:bg-slate-800/70"
                        }`
                      }
                    >
                      Hàng hư hỏng / quá hạn
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/warehouse/unassigned-inventory"
                      className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-slate-700 text-white border border-slate-600"
                            : "text-slate-300 hover:bg-slate-800/70"
                        }`
                      }
                    >
                      Hàng chưa xếp vị trí
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/warehouse/damage-reports"
                      className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-slate-700 text-white border border-slate-600"
                            : "text-slate-300 hover:bg-slate-800/70"
                        }`
                      }
                    >
                      Phiếu báo hỏng
                    </NavLink>
                  </li>
                </ul>
              ) : null}
            </li>

            <li>
              <button
                type="button"
                onClick={() => setIsStockCheckOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname.includes("/warehouse/stock-checks")
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/70"
                }`}
              >
                <span className="flex items-center min-w-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                    <ShieldCheck size={15} />
                  </span>
                  <span className="truncate">Kiểm kê</span>
                </span>
                <ChevronRight
                  size={16}
                  className={`transition-transform ${isStockCheckOpen ? "rotate-90" : ""}`}
                />
              </button>

              {isStockCheckOpen ? (
                <ul className="mt-1 pl-3 space-y-1">
                  <li>
                    <NavLink
                      to="/warehouse/stock-checks"
                      className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-slate-700 text-white border border-slate-600"
                            : "text-slate-300 hover:bg-slate-800/70"
                        }`
                      }
                    >
                      Phiếu kiểm kê
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/warehouse/stock-checks/create"
                      className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-slate-700 text-white border border-slate-600"
                            : "text-slate-300 hover:bg-slate-800/70"
                        }`
                      }
                    >
                      Tạo phiếu kiểm kê
                    </NavLink>
                  </li>
                </ul>
              ) : null}
            </li>
          </ul>
        </div>

        <div className="px-4 py-4 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 transition-colors"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-sm text-slate-500">Không gian kho</p>
              <span className="hidden text-slate-800 font-semibold">
                Xử lý allocate, tiền mặt và xuất hàng
              </span>
            </div>
          </div>
          <div className="relative shrink-0 flex items-center gap-2" ref={notificationRef}>
            {isGoodsReceiptQcPage ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-ai-qc-modal"))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                aria-label="Kiểm tra chất lượng bằng AI"
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline">AI QC</span>
              </button>
            ) : null}
            {unreadCount > 0 && !notificationOpen ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                Mới
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setNotificationOpen((v) => !v)}
              className={`relative rounded-lg p-2 transition-colors ${
                unreadCount > 0
                  ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              aria-label="Thông báo"
            >
              <Bell size={20} className={unreadCount > 0 ? "animate-pulse" : ""} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-amber-600 px-1 text-[11px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="fixed left-3 right-3 top-[68px] z-50 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:mt-0 sm:w-[360px] sm:max-w-[90vw]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">Thông báo của bạn</p>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAllAsRead || unreadCount === 0}
                    className="text-[11px] sm:text-xs font-semibold text-amber-700 hover:underline disabled:text-slate-400 whitespace-nowrap"
                  >
                    <span className="sm:hidden">Đã đọc hết</span>
                    <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
                  </button>
                </div>

                <div className="max-h-[380px] overflow-auto">
                  {!displayedNotifications.length ? (
                    <p className="px-4 py-5 text-sm text-slate-500">Chưa có thông báo nào.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {displayedNotifications.map((item) => (
                        <button
                          key={item.userNotificationId}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(
                              item.userNotificationId,
                              item.isRead,
                              item.referenceId,
                              item.referenceType,
                              item.type,
                              (item as { warehouseId?: number | null }).warehouseId,
                            )
                          }
                          className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                            item.isRead ? "bg-white" : "bg-amber-50/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm leading-5 text-slate-800">{item.message}</p>
                            {!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatVietnamNotificationTime(item.createdAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

