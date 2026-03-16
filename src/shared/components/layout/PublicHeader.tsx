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
} from "lucide-react";

import { ROUTES } from "../../constants/routes";
import { usePublicLayout } from "../../hooks/usePublicLayout";
import { useAppDispatch } from "../../../app/hook";
import { logout } from "../../../features/auth/slices/auth.slice";
import { useGetMyProfileQuery } from "../../../features/admin/api/profile.api";

export default function PublicHeader() {
  const { isLoggedIn, hasDashboard, dashboardPath } = usePublicLayout();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: user } = useGetMyProfileQuery(undefined, {
    skip: !isLoggedIn,
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  const avatarLetter = (user?.fullName || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">

        {/* LOGO */}
        <Link to={ROUTES.HOME} className="flex items-center gap-3 flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-[#1a5f2a] flex items-center justify-center">
            <Leaf size={26} className="text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-[#1a5f2a] uppercase tracking-tight">
              AgriIDMS
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              Quản lý kho & phân phối hoa quả
            </div>
          </div>
        </Link>

        {/* NAV */}
        <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center flex-1 min-w-0">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded"
          >
            <Home size={14} className="text-[#1a5f2a]" />
            Trang chủ
          </Link>

          <Link
            to={ROUTES.GIOI_THIEU}
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded"
          >
            Giới thiệu
          </Link>

          <a
            href="/#san-pham"
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded"
          >
            Sản phẩm
          </a>

          <a
            href="/#vi-sao-chon"
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded hidden sm:inline"
          >
            Tin tức
          </a>

          <Link
            to={hasDashboard ? dashboardPath! : ROUTES.LOGIN}
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded"
          >
            Hệ thống
          </Link>

          <a
            href="/#lien-he"
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded"
          >
            Liên hệ
          </a>
        </nav>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 flex-shrink-0">

          <a
            href="/#san-pham"
            className="p-2 text-slate-600 hover:text-[#1a5f2a] rounded-lg hover:bg-slate-50"
            aria-label="Tìm kiếm"
          >
            <Search size={20} className="text-[#1a5f2a]" />
          </a>

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