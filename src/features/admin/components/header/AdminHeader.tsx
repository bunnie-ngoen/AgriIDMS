import { useLocation, Link } from "react-router-dom";
import AdminHeaderQrMiniScan from "./AdminHeaderQrMiniScan";
import AdminHeaderNotificationBell from "./AdminHeaderNotificationBell";
import { Menu } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  manager: "Quản lý",
  warehouse: "Nhân viên kho",
  "warehouse-staff": "Nhân viên kho",
  "sales-staff": "Nhân viên bán hàng",
  "purchase-staff": "Nhân viên mua hàng",
  dashboard: "Bảng điều khiển",
  profile: "Hồ sơ",
  "user-management": "Quản lý người dùng",
  "goods-receipts": "Phiếu nhập kho",
  "purchase-orders": "Đơn mua hàng",
  suppliers: "Nhà cung cấp",
  products: "Sản phẩm",
  "product-variants": "Biến thể sản phẩm",
  categories: "Danh mục",
  exports: "Xuất hàng",
  complaints: "Khiếu nại",
  warehouses: "Kho",
  lots: "Lô hàng",
  "stock-checks": "Kiểm kê",
  "disposal-requests": "Yêu cầu tiêu hủy",
  "damage-reports": "Phiếu hỏng",
  create: "Tạo mới",
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

const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
    const location = useLocation(); //lấy thông tin của url hiện tại 

  const pathnames = location.pathname
    .split("/")  //["", "admin", "user-management", "create"]
    .filter((x) => x); // bỏ chuỗi rỗng
    return (
        <div className="flex justify-between p-5">
            <div className="flex items-start gap-3">
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
            <div>
                <div>
                    <nav className="text-sm text-gray-500 mb-1">
                        {pathnames.map((value, index) => {
                            const to = "/" + pathnames.slice(0, index + 1).join("/");  //cắt mảng từ 0 - 1 thì là admin
                            const isLast = index === pathnames.length - 1;  //lấy phần từ cuốix

                            return (
                                <span key={to}>
                                    {!isLast ? (    
                                        <>
                                            <Link to={to} className="hover:text-emerald-700">
                                                {toVietnameseLabel(value)}
                                            </Link>
                                            <span className="mx-2">/</span>
                                        </>
                                    ) : (
                                        <span className="font-semibold text-gray-800">
                                            {toVietnameseLabel(value)}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </nav>

                    <h1 className="text-md font-bold text-gray-900">
                        {formatTitle(pathnames[pathnames.length - 1]) || "Bảng điều khiển"}
                    </h1>
                </div>
            </div>
            </div>
            <div className="flex items-center gap-2">
              <AdminHeaderNotificationBell />
              <AdminHeaderQrMiniScan />
            </div>
        </div>
    )
}

export default AdminHeader

export const formatTitle = (str = "") =>
  toVietnameseLabel(str);