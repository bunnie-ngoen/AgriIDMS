import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ChevronRight,
} from "lucide-react";

const CARD_CLASS =
  "flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md transition-all text-left w-full";

type QuickLink = {
  title: string;
  subtitle: string;
  path: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
};

const QUICK_LINKS: QuickLink[] = [
  {
    title: "Người dùng",
    subtitle: "Quản lý tài khoản, phân quyền",
    path: "/admin/users",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Báo cáo",
    subtitle: "Doanh thu và lợi nhuận",
    path: "/admin/reports/revenue-profit-specific",
    icon: BarChart3,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-slate-600" />
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng quan và truy cập nhanh các chức năng quản trị.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={CARD_CLASS}
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-800">{item.title}</h2>
                  <p className="text-sm text-slate-500 truncate">{item.subtitle}</p>
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
