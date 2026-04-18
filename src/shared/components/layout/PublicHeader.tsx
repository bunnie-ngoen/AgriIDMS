import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Leaf,
  LayoutDashboard,
  UserPlus,
  Search,
  Home,
  ChevronDown,
  LogOut,
  User,
  ShoppingCart,
  Bell,
} from "lucide-react";

import { ROUTES } from "../../constants/routes";
import { usePublicLayout } from "../../hooks/usePublicLayout";
import { useAppDispatch } from "../../../app/hook";
import { logout } from "../../../features/auth/slices/auth.slice";
import { api } from "../../api";
import { useGetMyProfileQuery } from "../../../features/admin/api/profile.api";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { AUTH_ROLE } from "../../../features/auth/constants/auth.constants";
import { useGetMyCartQuery } from "../../../features/cart/api/cart.api";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../../../features/notification/api/notification.api";
import { formatVietnamNotificationTime } from "../../lib/vietnamTime";

export default function PublicHeader() {
  const { isLoggedIn, hasDashboard, dashboardPath } = usePublicLayout();
  const auth = useAuth();
  const isCustomer = auth.user?.roles?.[0] === AUTH_ROLE.CUSTOMER;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: user } = useGetMyProfileQuery(undefined, {
    skip: !isLoggedIn,
    refetchOnMountOrArgChange: true,
  });

  const { data: cart } = useGetMyCartQuery(undefined, {
    skip: !isLoggedIn || !isCustomer,
  });

  const cartCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { data: notificationData, refetch: refetchNotifications } =
    useGetMyNotificationsQuery(
      { page: 1, pageSize: 10 },
      { skip: !isLoggedIn || !isCustomer },
    );
  const { data: unreadCountData, refetch: refetchUnreadCount } =
    useGetUnreadNotificationCountQuery(undefined, {
      skip: !isLoggedIn || !isCustomer,
    });
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] =
    useMarkAllNotificationsAsReadMutation();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState());
    navigate(ROUTES.LOGIN);
  };

  const avatarLetter = (user?.fullName || user?.email || "U")
    .charAt(0)
    .toUpperCase();
  const unreadCount = unreadCountData?.unreadCount ?? 0;

  const handleNotificationClick = async (
    userNotificationId: number,
    isRead: boolean,
    referenceId?: number | null,
    referenceType?: string | null,
    message?: string,
  ) => {
    if (!isRead) {
      try {
        await markAsRead(userNotificationId).unwrap();
        await Promise.all([refetchNotifications(), refetchUnreadCount()]);
      } catch {
        // Swallow notification marking errors to keep navigation responsive.
      }
    }

    const extractOrderIdFromMessage = (text?: string) => {
      if (!text) return null;
      const match = text.match(/Đơn hàng\s*#?(\d+)/i);
      if (!match) return null;
      const parsed = Number(match[1]);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    };

    if (referenceType === "ExportReceipt") {
      const orderIdFromMessage = extractOrderIdFromMessage(message);
      navigate(orderIdFromMessage ? `/my-orders/${orderIdFromMessage}` : "/my-orders");
      setNotificationOpen(false);
      return;
    }

    if (referenceId) {
      navigate(`/my-orders/${referenceId}`);
      setNotificationOpen(false);
      return;
    }

    navigate("/my-orders");
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

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-6">

        {/* LOGO */}
        <Link to={ROUTES.HOME} className="flex flex-shrink-0 items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[#1a5f2a] flex items-center justify-center">
            <Leaf size={26} className="text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-[#1a5f2a] uppercase tracking-tight">
              AgriIDMS
            </div>
            <div className="hidden text-xs text-slate-500 sm:block">
              Quản lý kho & phân phối hoa quả
            </div>
          </div>
        </Link>

        {/* NAV */}
        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 sm:gap-2 lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:overflow-visible lg:pb-0">
          <Link
            to={ROUTES.HOME}
            className="flex shrink-0 items-center gap-1 rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a5f2a]"
          >
            <Home size={14} className="text-[#1a5f2a]" />
            Trang chủ
          </Link>

          <Link
            to={ROUTES.GIOI_THIEU}
            className="shrink-0 rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a5f2a]"
          >
            Giới thiệu
          </Link>

          <a
            href="/#san-pham"
            className="shrink-0 rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a5f2a]"
          >
            Sản phẩm
          </a>

          <a
            href="/#vi-sao-chon"
            className="hidden shrink-0 rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a5f2a] sm:inline"
          >
            Tin tức
          </a>

          <a
            href="/#lien-he"
            className="shrink-0 rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a5f2a]"
          >
            Liên hệ
          </a>
        </nav>

        {/* RIGHT SIDE */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-2 sm:gap-3">

          <a
            href="/#san-pham"
            className="p-2 text-slate-600 hover:text-[#1a5f2a] rounded-lg hover:bg-slate-50"
            aria-label="Tìm kiếm"
          >
            <Search size={20} className="text-[#1a5f2a]" />
          </a>

          {isLoggedIn && isCustomer && (
            <>
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setNotificationOpen((v) => !v)}
                  className="relative p-2 text-slate-600 hover:text-[#1a5f2a] rounded-lg hover:bg-slate-50"
                  aria-label="Thông báo"
                >
                  <Bell size={20} className="text-[#1a5f2a]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#1a5f2a] text-white text-[11px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center border border-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white rounded-xl shadow-lg border border-slate-100 z-30 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">
                        Thông báo của bạn
                      </p>
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAllAsRead || unreadCount === 0}
                        className="text-xs font-semibold text-[#1a5f2a] disabled:text-slate-400 hover:underline"
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    </div>

                    <div className="max-h-[380px] overflow-auto">
                      {!notificationData?.items?.length ? (
                        <p className="px-4 py-5 text-sm text-slate-500">
                          Chưa có thông báo nào.
                        </p>
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
                                  item.message,
                                )
                              }
                              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                                item.isRead ? "bg-white" : "bg-emerald-50/40"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-slate-800 leading-5">
                                  {item.message}
                                </p>
                                {!item.isRead && (
                                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
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

              <Link
                to={ROUTES.CUSTOMER_ORDERS_PAGE}
                className="hidden rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a5f2a] sm:inline-flex"
              >
                Đơn của tôi
              </Link>
              <Link
                to={ROUTES.CART}
                className="relative p-2 text-slate-600 hover:text-[#1a5f2a] rounded-lg hover:bg-slate-50"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart size={20} className="text-[#1a5f2a]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#1a5f2a] text-white text-[11px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {!isLoggedIn ? (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hidden sm:inline"
              >
                Đăng nhập
              </Link>

              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026]"
              >
                <UserPlus size={16} />
                Đăng ký
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>

              {/* Avatar button */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#1a5f2a]/40 hover:bg-slate-50"
              >
                <div className="h-8 w-8 rounded-full bg-[#1a5f2a] flex items-center justify-center text-white text-sm font-bold">
                  {avatarLetter}
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-800 max-w-[120px] truncate">
                    {user?.fullName ?? "Người dùng"}
                  </p>
                </div>

                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* DROPDOWN */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 z-30 overflow-hidden">

                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#1a5f2a] flex items-center justify-center text-white font-bold">
                        {avatarLetter}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {user?.fullName ?? "Người dùng"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email ?? ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="py-1">
                    {hasDashboard && (
                      <Link
                        to={dashboardPath!}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#1a5f2a]"
                      >
                        <LayoutDashboard size={16} />
                        Vào hệ thống
                      </Link>
                    )}

                    <Link
                      to={ROUTES.PROFILE ?? "#"}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#1a5f2a]"
                    >
                      <User size={16} />
                      Thông tin cá nhân
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}