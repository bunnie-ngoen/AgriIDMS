import { Outlet } from "react-router-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus, List, LogOut, User, Menu } from "lucide-react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hook";
import { logout } from "../../auth/slices/auth.slice";
import { persistor } from "../../../app/store";
import { api } from "../../../shared/api";

export default function PurchaseStaffLayout() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.user?.username?.trim() ?? "");
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState());
    persistor.purge();
    navigate("/login");
  };

  return (
    <div className="h-screen flex bg-[#F4F4F5] overflow-hidden">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      ) : null}
      {/* Sidebar — cùng style Admin: tối, border, icon box */}
      <aside
        onClickCapture={(e) => {
          if (!sidebarOpen) return;
          const target = e.target as HTMLElement;
          if (target.closest("a")) setSidebarOpen(false);
        }}
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#222d32] text-slate-100 flex flex-col h-screen border-r border-[#1a2226] shadow-xl shrink-0 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1a2226] bg-[#1a2226]">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-sky-500 text-white">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Nhân viên mua hàng</p>
            <p className="text-[11px] text-slate-300 truncate max-w-[180px]">
              {username ? `Tài khoản: ${username}` : "Tài khoản đăng nhập"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Danh mục
          </p>
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/purchase-staff/dashboard"
                end
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#1e282c] text-white border-l-4 border-sky-400"
                      : "text-slate-200 hover:bg-[#1b2225]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded mr-3 shrink-0 ${
                        isActive ? "bg-sky-500 text-white" : "bg-[#1f2d3a] text-slate-200"
                      }`}
                    >
                      <LayoutDashboard size={15} />
                    </span>
                    <span className="truncate">Bảng điều khiển</span>
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/purchase-staff/orders"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#1e282c] text-white border-l-4 border-sky-400"
                      : "text-slate-200 hover:bg-[#1b2225]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded mr-3 shrink-0 ${
                        isActive ? "bg-sky-500 text-white" : "bg-[#1f2d3a] text-slate-200"
                      }`}
                    >
                      <List size={15} />
                    </span>
                    <span className="truncate">Danh sách đơn mua</span>
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/purchase-staff/orders/create-multi-supplier"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#1e282c] text-white border-l-4 border-sky-400"
                      : "text-slate-200 hover:bg-[#1b2225]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded mr-3 shrink-0 ${
                        isActive ? "bg-sky-500 text-white" : "bg-[#1f2d3a] text-slate-200"
                      }`}
                    >
                      <FilePlus size={15} />
                    </span>
                    <span className="truncate">Tạo đơn mua hàng</span>
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/purchase-staff/profile"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#1e282c] text-white border-l-4 border-sky-400"
                      : "text-slate-200 hover:bg-[#1b2225]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded mr-3 shrink-0 ${
                        isActive ? "bg-sky-500 text-white" : "bg-[#1f2d3a] text-slate-200"
                      }`}
                    >
                      <User size={15} />
                    </span>
                    <span className="truncate">Hồ sơ cá nhân</span>
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Footer / Logout */}
        <div className="px-4 py-4 border-t border-[#1a2226] bg-[#222d32]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded bg-[#1f2d3a] px-4 py-2.5 text-xs font-semibold text-slate-100 hover:bg-[#243447] transition-colors"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-3 shrink-0 sm:px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen((s) => !s)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Mở menu"
          >
            <Menu size={18} />
          </button>
          <span className="text-slate-600 font-medium">Hệ thống đơn mua hàng</span>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
            {username ? `Xin chào, ${username}` : "Chưa có tên đăng nhập"}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto px-3 pt-3 pb-6 sm:px-4 sm:pt-4 sm:pb-8 lg:px-6 lg:pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
