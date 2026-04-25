import { Link } from "react-router-dom";
import { useAppSelector } from "../../../app/hook";
import { ROUTES } from "../../../shared/constants/routes";
import { LogIn, LayoutDashboard } from "lucide-react";
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
  );
}
