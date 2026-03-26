import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, PackageCheck, ShieldCheck, MessageCircleWarning } from "lucide-react";
import { useAppDispatch } from "../../../app/hook";
import { logout } from "../../auth/slices/auth.slice";
import { api } from "../../../shared/api";
import { persistor } from "../../../app/store";

export default function ManagerLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Manager</p>
            <p className="text-[11px] text-slate-400">Duyet xuat kho</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/manager/dashboard"
                end
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <LayoutDashboard size={15} />
                </span>
                Tong quan
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/manager/exports"
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
                Duyet xuat hang
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/manager/complaints"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <MessageCircleWarning size={15} />
                </span>
                Khieu nai
              </NavLink>
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
            <span>Dang xuat</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur flex items-center px-6 shrink-0">
          <div>
            <p className="text-sm text-slate-500">Khong gian manager</p>
            <span className="text-slate-800 font-semibold">Phe duyet phieu xuat</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
