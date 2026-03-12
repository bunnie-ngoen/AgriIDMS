import { Link } from "react-router-dom";
import { useAppSelector } from "../../../app/hook";
import { ROUTES } from "../../../shared/constants/routes";
import {
  Leaf,
  LogIn,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  LayoutDashboard,
  Search,
  Home,
} from "lucide-react";
import { selectIsLoggedIn } from "../../auth/selectors/auth.selectors";
import { useAuth } from "../../auth/hooks/useAuth";
import { AUTH_ROLE, ROLE_DASHBOARD_MAP } from "../../auth/constants/auth.constants";
import type { UserRole } from "../../auth/constants/auth.constants";

const ROLES_WITH_DASHBOARD: UserRole[] = [
  AUTH_ROLE.ADMIN,
  AUTH_ROLE.MANAGER,
  AUTH_ROLE.WAREHOUSE_STAFF,
  AUTH_ROLE.SALES_STAFF,
  AUTH_ROLE.PURCHASING_STAFF,
];

export default function GioiThieuPage() {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const auth = useAuth();
  const role = auth.user?.roles?.[0] as UserRole | undefined;
  const hasDashboard = isLoggedIn && role != null && ROLES_WITH_DASHBOARD.includes(role);
  const dashboardPath = role ? ROLE_DASHBOARD_MAP[role] : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="bg-[#1a5f2a] text-white text-sm overflow-hidden">
        <style>{`
          @keyframes marquee-bam {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div
              className="inline-flex font-medium whitespace-nowrap gap-16"
              style={{ animation: "marquee-bam 18s linear infinite" }}
            >
              <span>AgriIDMS — Hệ thống quản lý kho phân phối hoa quả</span>
              <span>AgriIDMS — Hệ thống quản lý kho phân phối hoa quả</span>
            </div>
          </div>
          {!isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link to={ROUTES.LOGIN} className="hover:underline">Đăng nhập</Link>
              <Link to={ROUTES.REGISTER} className="hover:underline">Đăng ký</Link>
            </div>
          ) : hasDashboard ? (
            <Link to={dashboardPath!} className="hover:underline flex items-center gap-1">
              <LayoutDashboard size={14} /> Vào hệ thống
            </Link>
          ) : null}
        </div>
      </div>

      {/* Header — Giới thiệu là trang hiện tại nên highlight */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-[#1a5f2a] flex items-center justify-center flex-shrink-0">
              <Leaf size={26} className="text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-[#1a5f2a] uppercase tracking-tight leading-tight">
                AgriIDMS
              </div>
              <div className="text-xs text-slate-500 leading-tight hidden sm:block">
                Quản lý kho & phân phối hoa quả
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center flex-1 min-w-0">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
              title="Trang chủ"
            >
              <Home size={14} className="text-[#1a5f2a]" />
              Trang chủ
            </Link>
            <span className="px-3 py-2 text-sm font-medium text-[#1a5f2a] border-b-2 border-[#1a5f2a] rounded">
              Giới thiệu
            </span>
            <Link
              to={`${ROUTES.HOME}#san-pham`}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
            >
              Sản phẩm
            </Link>
            <Link
              to={`${ROUTES.HOME}#vi-sao-chon`}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors hidden sm:inline-block"
            >
              Tin tức
            </Link>
            {hasDashboard ? (
              <Link to={dashboardPath!} className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors">
                Hệ thống
              </Link>
            ) : (
              <Link to={ROUTES.LOGIN} className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors">
                Hệ thống
              </Link>
            )}
            <a
              href="#lien-he"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
            >
              Liên hệ
            </a>
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to={`${ROUTES.HOME}#san-pham`}
              className="p-2 text-slate-600 hover:text-[#1a5f2a] rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Tìm kiếm"
            >
              <Search size={20} className="text-[#1a5f2a]" />
            </Link>
            {!isLoggedIn ? (
              <>
                <Link to={ROUTES.LOGIN} className="text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hidden sm:inline">
                  Đăng nhập
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors"
                >
                  <UserPlus size={16} />
                  Đăng ký
                </Link>
              </>
            ) : hasDashboard ? (
              <Link
                to={dashboardPath!}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors"
              >
                <LayoutDashboard size={16} />
                Vào hệ thống
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Nội dung Giới thiệu */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-[#1a5f2a] text-center uppercase tracking-wide mb-8">
            Giới thiệu
          </h1>
          <div className="space-y-4 text-slate-700 text-base leading-relaxed">
            <p className="font-medium text-slate-800">Bạn đang gặp các vấn đề sau?</p>
            <ol className="list-decimal list-inside space-y-2 pl-1">
              <li>Doanh nghiệp cần quản lý tồn kho tập trung cho nhiều mặt hàng hoa quả?</li>
              <li>Theo dõi đơn mua hàng, phiếu nhập xuất kho từ nhiều nhà cung cấp?</li>
              <li>Cần truy xuất nguồn gốc sản phẩm từ nông trại đến điểm bán?</li>
              <li>Phân quyền rõ ràng cho Admin, Purchasing Staff, Warehouse Staff, Sales Staff?</li>
              <li>Báo cáo tồn kho, cảnh báo hết hạn, tồn thấp kịp thời?</li>
            </ol>
            <p className="pt-4 text-lg font-semibold text-[#1a5f2a]">
              ⇒ Hãy để <strong>AgriIDMS</strong> giải quyết tất cả các vấn đề này cho bạn.
            </p>
            <p className="text-slate-600 text-sm">
              Hệ thống quản lý kho và phân phối hoa quả — một nền tảng duy nhất từ mua hàng, nhập kho, quản lý sản phẩm đến phân phối.
            </p>
            <div className="pt-6 flex justify-center">
              {!isLoggedIn ? (
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors"
                >
                  <LogIn size={18} />
                  Đăng nhập / Đăng ký
                </Link>
              ) : hasDashboard ? (
                <Link
                  to={dashboardPath!}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors"
                >
                  <LayoutDashboard size={18} />
                  Vào hệ thống
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="lien-he" className="bg-slate-900 text-slate-300 mt-auto scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf size={24} className="text-[#4ade80]" />
                <span className="font-bold text-white text-lg">AgriIDMS</span>
              </div>
              <p className="text-sm text-slate-400">
                Hệ thống quản lý kho và phân phối hoa quả — từ nông trại đến điểm bán.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Liên kết</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={ROUTES.HOME} className="hover:text-white">Trang chủ</Link></li>
                <li><Link to={ROUTES.GIOI_THIEU} className="hover:text-white">Giới thiệu</Link></li>
                <li><Link to={ROUTES.LOGIN} className="hover:text-white">Đăng nhập</Link></li>
                <li><Link to={ROUTES.REGISTER} className="hover:text-white">Đăng ký</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Liên hệ</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone size={14} /> 0834 70 11 55</li>
                <li className="flex items-center gap-2"><Mail size={14} /> agriidms@example.com</li>
                <li className="flex items-center gap-2"><MapPin size={14} /> TP. Hồ Chí Minh</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Hệ thống</h4>
              <p className="text-sm text-slate-400">
                Quản lý kho • Đơn mua hàng • Phiếu nhập xuất • Truy xuất nguồn gốc
              </p>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-700 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} AgriIDMS — Quản lý kho phân phối hoa quả.
          </div>
        </div>
      </footer>
    </div>
  );
}
