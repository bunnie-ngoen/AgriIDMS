import { useLocation, Link } from "react-router-dom";
import AdminHeaderQrMiniScan from "./AdminHeaderQrMiniScan";
import AdminHeaderNotificationBell from "./AdminHeaderNotificationBell";
import { Menu } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  manager: "Quản lý",
  sales: "Bán hàng",
  warehouse: "Nhân viên kho",
  "warehouse-staff": "Nhân viên kho",
  "sales-staff": "Nhân viên bán hàng",
  "purchase-staff": "Nhân viên mua hàng",
  dashboard: "Bảng điều khiển",
  profile: "Hồ sơ",
  "user-management": "Quản lý người dùng",
  "create-user": "Tạo người dùng",
  users: "Người dùng",
  deleted: "Đã xóa",
  reports: "Báo cáo",
  "revenue-profit-specific": "Doanh thu - lợi nhuận",
  "goods-receipts": "Phiếu nhập kho",
  print: "In phiếu",
  qc: "Kiểm định",
  "purchase-orders": "Đơn mua hàng",
  orders: "Đơn hàng",
  suppliers: "Nhà cung cấp",
  products: "Sản phẩm",
  "product-variants": "Biến thể sản phẩm",
  categories: "Danh mục",
  exports: "Xuất hàng",
  shipping: "Giao hàng",
  complaints: "Khiếu nại",
  pending: "Chờ xử lý",
  processed: "Đã xử lý",
  "sale-confirm": "Chờ xác nhận bán",
  "pending-cod": "Chờ thanh toán COD",
  "approved-export": "Đã duyệt xuất hàng",
  "pos-create": "Tạo đơn tại quầy",
  "unpaid-pos": "Đơn quầy chưa thanh toán",
  warehouses: "Kho",
  map: "Sơ đồ kho",
  config: "Cấu hình",
  lots: "Lô hàng",
  "stock-checks": "Kiểm kê",
  putaway: "Xếp hàng vào vị trí",
  "unassigned-inventory": "Hàng chưa xếp vị trí",
  "inventory-issues": "Hàng hư hỏng / quá hạn",
  "near-expiry-discount-config": "Cấu hình giảm giá cận date",
  "variant-discount-config": "Cấu hình giảm giá biến thể",
  "damage-discount-approvals": "Duyệt giảm giá hàng hỏng",
  "box-type-config": "Cấu hình loại thùng",
  "disposal-requests": "Yêu cầu tiêu hủy",
  "damage-reports": "Phiếu hỏng",
  create: "Tạo mới",
  new: "Tạo mới",
  proposals: "Đề xuất",
  edit: "Chỉnh sửa",
  detail: "Chi tiết",
};

const toVietnameseLabel = (segment = "") => {
  if (!segment) return "";
  const normalized = segment.trim().toLowerCase();
  if (/^\d+$/.test(normalized)) return `#${normalized}`;
  const direct = ROUTE_LABELS[normalized];
  if (direct) return direct;
  return normalized
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type AdminHeaderProps = {
  onToggleSidebar?: () => void;
};

const HIDDEN_BREADCRUMB_SEGMENTS = new Set(["config"]);

const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
    const location = useLocation(); //lấy thông tin của url hiện tại 

  const pathnames = location.pathname
    .split("/")  //["", "admin", "user-management", "create"]
    .filter((x) => x); // bỏ chuỗi rỗng
  const displayPathnames = pathnames
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => !HIDDEN_BREADCRUMB_SEGMENTS.has(segment.trim().toLowerCase()));
    return (
        <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:items-start lg:justify-between lg:px-5">
            <div className="flex min-w-0 items-start gap-3">
                {onToggleSidebar ? (
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 lg:hidden"
                    aria-label="Mở menu"
                  >
                    <Menu size={18} />
                  </button>
                ) : null}
            <div className="min-w-0">
                <div className="min-w-0">
                    <nav className="mb-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs sm:text-sm text-gray-500">
                        {displayPathnames.map(({ segment, index: originalIndex }, index) => {
                            const to = "/" + pathnames.slice(0, originalIndex + 1).join("/");
                            const isLast = index === displayPathnames.length - 1;

                            return (
                                <span key={to} className="inline-flex items-center">
                                    {!isLast ? (    
                                        <>
                                            <Link to={to} className="hover:text-emerald-700">
                                                {toVietnameseLabel(segment)}
                                            </Link>
                                            <span className="mx-1.5">/</span>
                                        </>
                                    ) : (
                                        <span className="font-semibold text-gray-800">
                                            {toVietnameseLabel(segment)}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </nav>

                    <h1 className="text-lg font-bold text-gray-900 leading-6">
                        {formatTitle(displayPathnames[displayPathnames.length - 1]?.segment) || "Bảng điều khiển"}
                    </h1>
                </div>
            </div>
            </div>
            <div className="flex w-full items-center justify-end gap-2 lg:w-auto">
              <AdminHeaderNotificationBell />
              <AdminHeaderQrMiniScan />
            </div>
        </div>
    )
}

export default AdminHeader

export const formatTitle = (str = "") =>
  toVietnameseLabel(str);