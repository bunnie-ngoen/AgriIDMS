import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, LogOut, ShieldCheck, MessageCircleWarning, ChevronDown } from "lucide-react";
import { useAppDispatch } from "../../../app/hook";
import { logout } from "../../auth/slices/auth.slice";
import { persistor } from "../../../app/store";
import { api } from "../../../shared/api";

export default function SalesStaffLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isOrdersRouteActive = location.pathname.startsWith("/sales/orders");
  const isComplaintsRouteActive = location.pathname.startsWith("/sales/complaints");
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(isOrdersRouteActive);
  const [isComplaintsOpen, setIsComplaintsOpen] = useState<boolean>(isComplaintsRouteActive);

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
              Theo dõi trạng thái đơn và xác nhận COD.
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
                      to="/sales/orders/sale-confirm"
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-sky-900/30 text-sky-200 border border-sky-700/60"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
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
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                      Thanh toán COD chờ xử lý
                    </NavLink>
                  </li>
                </ul>
              </div>
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
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
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
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur flex items-center px-6 shrink-0">
          <div>
            <p className="text-sm text-slate-500">Không gian bán hàng</p>
            <span className="text-slate-800 font-semibold">Hệ thống xử lý đơn bán</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

