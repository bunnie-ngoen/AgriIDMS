import { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  ShieldCheck,
  MessageCircleWarning,
  ChevronDown,
  Bell,
  PlusCircle,
  Wallet,
  User,
  UserCheck,
  CreditCard,
  PackageCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch } from "../../../app/hook";
import { logout } from "../../auth/slices/auth.slice";
import { persistor } from "../../../app/store";
import { api } from "../../../shared/api";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../../notification/api/notification.api";
import { formatVietnamNotificationTime } from "../../../shared/lib/vietnamTime";

export default function SalesStaffLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isOrdersRouteActive = location.pathname.startsWith("/sales/orders");
  const isComplaintsRouteActive = location.pathname.startsWith("/sales/complaints");
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(isOrdersRouteActive);
  const [isComplaintsOpen, setIsComplaintsOpen] = useState<boolean>(isComplaintsRouteActive);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { data: notificationData, refetch: refetchNotifications } = useGetMyNotificationsQuery({
    page: 1,
    pageSize: 10,
  });
  const { data: unreadCountData, refetch: refetchUnreadCount } = useGetUnreadNotificationCountQuery();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] = useMarkAllNotificationsAsReadMutation();
  const unreadCount = unreadCountData?.unreadCount ?? 0;

  useEffect(() => {
    if (isOrdersRouteActive) {
      setIsOrdersOpen(true);
    }
  }, [isOrdersRouteActive]);

  useEffect(() => {
    if (isComplaintsRouteActive) {
      setIsComplaintsOpen(true);
    }
  }, [isComplaintsRouteActive]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (
    userNotificationId: number,
    isRead: boolean,
    referenceId?: number | null,
    referenceType?: string | null,
  ) => {
    if (!isRead) {
      try {
        await markAsRead(userNotificationId).unwrap();
        await Promise.all([refetchNotifications(), refetchUnreadCount()]);
      } catch {
        // Keep navigation responsive even if marking read fails.
      }
    }

    if (referenceType === "OrderAllocationShortage" && referenceId) {
      navigate(`/sales/orders?orderId=${referenceId}`);
      setNotificationOpen(false);
      return;
    }

    navigate(referenceId ? `/sales/orders/sale-confirm?orderId=${referenceId}` : "/sales/orders/sale-confirm");
    setNotificationOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      await Promise.all([refetchNotifications(), refetchUnreadCount()]);
    } catch {
      // Ignore and allow user to continue.
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState());
    persistor.purge();
    navigate("/login");
  };

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shadow-2xl shrink-0">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 bg-slate-950">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Vận hành bán hàng</p>
            <p className="text-[11px] text-slate-400">Trung tâm xử lý đơn</p>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-slate-800">
          <div className="rounded-xl bg-slate-800/80 border border-slate-700 px-3 py-2.5">
            <div className="flex items-center gap-2 text-slate-200 text-xs font-medium">
              <ShieldCheck size={14} className="text-emerald-400" />
              Kênh nội bộ Sales Staff
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Theo dõi trạng thái đơn và xác nhận.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setIsOrdersOpen((prev) => !prev)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isOrdersRouteActive
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/70"
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <ClipboardList size={15} />
                </span>
                <span className="flex-1 text-left">Đơn cần xử lý</span>
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${isOrdersOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div className={`grid transition-all duration-200 ${isOrdersOpen ? "grid-rows-[1fr] mt-1" : "grid-rows-[0fr]"}`}>
                <ul className="overflow-hidden space-y-1 pl-4">
                  <li>
                    <NavLink
                      to="/sales/orders/pos-create"
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-emerald-900/30 text-emerald-200 border border-emerald-700/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`
                      }
                    >
                      <PlusCircle size={14} />
                      Tạo đơn tại quầy (POS)
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/sales/orders/unpaid-pos"
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-emerald-900/30 text-emerald-200 border border-emerald-700/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`
                      }
                    >
                      <Wallet size={14} />
                      Đơn mua tại quầy chưa thanh toán
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/sales/orders/sale-confirm"
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-sky-900/30 text-sky-200 border border-sky-700/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`
                      }
                    >
                      <UserCheck size={14} />
                      Đơn hàng chờ xác nhận bán
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/sales/orders/pending-cod"
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-violet-900/30 text-violet-200 border border-violet-700/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`
                      }
                    >
                      <CreditCard size={14} />
                      Thanh toán chờ xử lý
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/sales/orders/approved-export"
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-teal-900/30 text-teal-200 border border-teal-700/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`
                      }
                    >
                      <PackageCheck size={14} />
                      Xác nhận đơn hàng đã giao
                    </NavLink>
                  </li>
                </ul>
              </div>
            </li>
            <li>
              <NavLink
                to="/sales/profile"
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
                <span className="flex-1 text-left">Hồ sơ cá nhân</span>
              </NavLink>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setIsComplaintsOpen((prev) => !prev)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isComplaintsRouteActive
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/70"
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <MessageCircleWarning size={15} />
                </span>
                <span className="flex-1 text-left">Khiếu nại</span>
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${isComplaintsOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div className={`grid transition-all duration-200 ${isComplaintsOpen ? "grid-rows-[1fr] mt-1" : "grid-rows-[0fr]"}`}>
                <ul className="overflow-hidden space-y-1 pl-4">
                  <li>
                    <NavLink
                      to="/sales/complaints/pending"
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-amber-900/30 text-amber-200 border border-amber-700/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`
                      }
                    >
                      <Clock size={14} />
                      Khiếu nại chờ xử lý
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/sales/complaints/processed"
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-emerald-900/30 text-emerald-200 border border-emerald-700/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`
                      }
                    >
                      <CheckCircle2 size={14} />
                      Khiếu nại đã xử lý
                    </NavLink>
                  </li>
                </ul>
              </div>
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 pl-0 pr-3 backdrop-blur">
          <div className="min-w-0 pl-0">
            <p className="text-sm text-slate-500">Không gian bán hàng</p>
            <span className="text-slate-800 font-semibold">Hệ thống xử lý đơn bán</span>
          </div>
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationOpen((v) => !v)}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Thông báo"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[11px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center border border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white rounded-xl shadow-lg border border-slate-100 z-30 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Thông báo của bạn</p>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAllAsRead || unreadCount === 0}
                    className="text-xs font-semibold text-amber-700 disabled:text-slate-400 hover:underline"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                </div>

                <div className="max-h-[380px] overflow-auto">
                  {!notificationData?.items?.length ? (
                    <p className="px-4 py-5 text-sm text-slate-500">Chưa có thông báo nào.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notificationData.items.map((item) => (
                        <button
                          key={item.userNotificationId}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(
                              item.userNotificationId,
                              item.isRead,
                              item.referenceId,
                              item.referenceType,
                            )
                          }
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                            item.isRead ? "bg-white" : "bg-amber-50/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-slate-800 leading-5">{item.message}</p>
                            {!item.isRead && (
                              <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
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
        <main className="min-h-0 flex-1 overflow-y-auto p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

