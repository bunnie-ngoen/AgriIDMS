import { Link } from "react-router-dom";
import { PackageCheck, ShieldCheck } from "lucide-react";

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Manager - Duyet xuat kho</h2>
            <p className="mt-1 text-sm text-slate-600">
              Trang rieng cho manager xu ly cac phieu ReadyToExport cho den khi duoc phe duyet.
            </p>
          </div>
        </div>
      </div>

      <Link
        to="/manager/exports"
        className="block rounded-xl border p-4 transition hover:shadow-sm text-indigo-700 bg-indigo-50 border-indigo-200"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Mo danh sach phieu cho duyet xuat</p>
          <PackageCheck size={17} />
        </div>
        <p className="mt-2 text-xs opacity-90">Chi bao gom flow manager, khong dung chung giao dien admin.</p>
      </Link>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Truck,
  Tags,
  Package,
  Layers,
  FileText,
  PackageSearch,
  ChevronRight,
  ShieldCheck,
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

// Giống AdminDashboard nhưng bỏ phần "Người dùng"
const QUICK_LINKS: QuickLink[] = [
  {
    title: "Kho",
    subtitle: "Danh sách kho, tạo kho mới",
    path: "/manager/warehouses",
    icon: Boxes,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    title: "Nhà cung cấp",
    subtitle: "Danh sách NCC, tạo NCC",
    path: "/manager/suppliers",
    icon: Truck,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Danh mục",
    subtitle: "Danh mục sản phẩm",
    path: "/manager/categories",
    icon: Tags,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Sản phẩm",
    subtitle: "Danh sách sản phẩm, tạo sản phẩm",
    path: "/manager/products",
    icon: Package,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    title: "Biến thể",
    subtitle: "Product variants",
    path: "/manager/product-variants",
    icon: Layers,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    title: "Duyệt đơn mua",
    subtitle: "Xem và duyệt đơn mua hàng",
    path: "/manager/purchase-orders",
    icon: FileText,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Nhập kho",
    subtitle: "Danh sách phiếu nhập",
    path: "/manager/goods-receipts",
    icon: PackageSearch,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    title: "Kiểm kê",
    subtitle: "Duyệt phiếu kiểm kê",
    path: "/manager/stock-checks",
    icon: ShieldCheck,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export default function ManagerDashboard() {
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
            Tổng quan và truy cập nhanh chức năng cho Manager.
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
                  <h2 className="font-semibold text-slate-800">
                    {item.title}
                  </h2>
                  <p className="text-sm text-slate-500 truncate">
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-400 shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

