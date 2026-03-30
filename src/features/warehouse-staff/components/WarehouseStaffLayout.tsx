import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Warehouse,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import { useAppDispatch } from "../../../app/hook";
import { logout } from "../../auth/slices/auth.slice";
import { api } from "../../../shared/api";
import { persistor } from "../../../app/store";
import { useState } from "react";

export default function WarehouseStaffLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isStockCheckOpen, setIsStockCheckOpen] = useState(
    location.pathname.includes("/warehouse/stock-checks")
  );
  const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(
    location.pathname.includes("/warehouse/warehouses") ||
      location.pathname.includes("/warehouse/putaway") ||
      location.pathname.includes("/warehouse/inventory-issues"),
  );

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
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow">
            <Warehouse size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Vận hành kho</p>
            <p className="text-[11px] text-slate-400">Order & Payment</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/warehouse/orders"
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mr-3 shrink-0 bg-slate-800 text-slate-200">
                  <ClipboardList size={15} />
                </span>
                Đơn hàng & COD
              </NavLink>
            </li>
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
                      Tạo phiếu
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur flex items-center px-6 shrink-0">
          <div>
            <p className="text-sm text-slate-500">Không gian kho</p>
            <span className="text-slate-800 font-semibold">
              Xử lý allocate, COD và xuất hàng
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

