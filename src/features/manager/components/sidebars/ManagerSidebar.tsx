import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  CirclePlus,
  List,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  Boxes,
  Truck,
  Tags,
  Layers,
  FileText,
  PackageSearch,
  ShieldCheck,
  AlertTriangle,
  BadgePercent,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "../../../../app/hook";
import { logout } from "../../../auth/slices/auth.slice";
import { persistor } from "../../../../app/store";
import { api } from "../../../../shared/api";

type SubMenuItem = {
  name: string;
  path: string;
  icon?: LucideIcon;
};

type NestedMenuItem = {
  name: string;
  icon: LucideIcon;
  children: SubMenuItem[];
};

type MenuItem = {
  name: string;
  path?: string;
  icon: LucideIcon;
  children?: (SubMenuItem | NestedMenuItem)[];
};

function isNestedMenuItem(
  item: SubMenuItem | NestedMenuItem,
): item is NestedMenuItem {
  return "children" in item && !("path" in item);
}

// Giống AdminSidebar nhưng bỏ "User Management"
const mainMenu: MenuItem[] = [
  { name: "Bảng điều khiển", path: "dashboard", icon: Archive },
  {
    name: "Quản lý kho",
    icon: Boxes,
    children: [
      { name: "Danh sách kho", path: "warehouses", icon: List },
      { name: "Tạo kho", path: "warehouses/create", icon: CirclePlus },
      { name: "Xếp hàng vào vị trí", path: "putaway", icon: Boxes },
      { name: "Hàng hư hỏng / quá hạn", path: "inventory-issues", icon: AlertTriangle },
      { name: "Duyệt yêu cầu tiêu hủy", path: "disposal-requests", icon: Trash2 },
      {
        name: "Cấu hình giảm giá",
        icon: BadgePercent,
        children: [
          {
            name: "Giảm giá theo ngày gần hết hạn",
            path: "near-expiry-discount-config",
            icon: BadgePercent,
          },
          {
            name: "Giảm giá theo mặt hàng",
            path: "variant-discount-config",
            icon: BadgePercent,
          },
        ],
      },
    ],
  },
  {
    name: "Nhà cung cấp",
    icon: Truck,
    children: [
      { name: "Danh sách NCC", path: "suppliers", icon: List },
      { name: "Tạo NCC", path: "suppliers/create", icon: CirclePlus },
    ],
  },
  {
    name: "Đơn mua hàng",
    icon: FileText,
    children: [{ name: "Duyệt đơn mua", path: "purchase-orders", icon: List }],
  },
  {
    name: "Khiếu nại",
    icon: FileText,
    children: [{ name: "Xử lý khiếu nại", path: "complaints", icon: List }],
  },
  {
    name: "Xuất hàng",
    icon: PackageSearch,
    children: [{ name: "Duyệt xuất hàng", path: "exports", icon: List }],
  },
  {
    name: "Nhập kho",
    icon: PackageSearch,
    children: [
      { name: "Danh sách phiếu nhập", path: "goods-receipts", icon: List },
      { name: "Tạo phiếu nhập", path: "goods-receipts/create", icon: CirclePlus },
      { name: "Danh sách lot", path: "lots", icon: List },
    ],
  },
  {
    name: "Kiểm kê",
    icon: ShieldCheck,
    children: [{ name: "Bảng điều khiển", path: "stock-checks", icon: ShieldCheck }],
  },
  {
    name: "Danh mục sản phẩm",
    icon: Tags,
    children: [
      { name: "Danh sách danh mục", path: "categories", icon: List },
      { name: "Tạo danh mục", path: "categories/create", icon: CirclePlus },
    ],
  },
  {
    name: "Sản phẩm",
    icon: Archive,
    children: [
      { name: "Danh sách sản phẩm", path: "products", icon: List },
      { name: "Tạo sản phẩm", path: "products/create", icon: CirclePlus },
      {
        name: "Biến thể sản phẩm",
        icon: Layers,
        children: [
          { name: "Danh sách biến thể", path: "product-variants", icon: List },
          {
            name: "Tạo biến thể",
            path: "product-variants/create",
            icon: CirclePlus,
          },
        ],
      },
    ],
  },
];

const accountMenu: MenuItem[] = [{ name: "Hồ sơ", path: "profile", icon: Archive }];

export default function ManagerSidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const currentLastSegment =
    location.pathname.split("/").filter(Boolean).slice(-1)[0] ?? "";

  const handleLogout = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState());
    persistor.purge();
    navigate("/login");
  };

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isParentActive = (item: MenuItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => {
      if (isNestedMenuItem(child)) {
        return child.children.some((gc) => gc.path === currentLastSegment);
      }
      return child.path === currentLastSegment;
    });
  };

  const isNestedParentActive = (nested: NestedMenuItem): boolean =>
    nested.children.some((c) => c.path === currentLastSegment);

  const renderLeafItem = (item: MenuItem) => {
    const Icon = item.icon;
    if (!item.path) return null;

    return (
      <li key={item.name}>
        <NavLink to={item.path}>
          {({ isActive }) => (
            <button
              className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors
              ${
                isActive
                  ? "bg-[#1e282c] text-white border-l-4 border-sky-400"
                  : "text-slate-200 hover:bg-[#1b2225]"
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded mr-3
                ${isActive ? "bg-sky-500 text-white" : "bg-[#1f2d3a] text-slate-200"}`}
              >
                <Icon size={15} />
              </span>
              <span className="truncate">{item.name}</span>
            </button>
          )}
        </NavLink>
      </li>
    );
  };

  const renderNestedItem = (nested: NestedMenuItem, parentKey: string) => {
    const Icon = nested.icon;
    const active = isNestedParentActive(nested);
    const key = `${parentKey}__${nested.name}`;
    const isOpen = openMenus[key] ?? active;

    return (
      <li key={nested.name}>
        <button
          type="button"
          onClick={() => toggleMenu(key)}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors
          ${
            active || isOpen
              ? "bg-[#1a2530] text-sky-300"
              : "text-slate-300 hover:bg-[#1b2225]"
          }`}
        >
          <span className="flex items-center min-w-0">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded mr-2 bg-[#1f2d3a] text-slate-200">
              <Icon size={13} />
            </span>
            <span className="truncate">{nested.name}</span>
          </span>
          <ChevronRight
            size={12}
            className={`ml-2 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
        </button>

        {isOpen && (
          <ul className="mt-1 pl-4 space-y-1">
            {nested.children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <li key={child.path}>
                  <NavLink to={child.path}>
                    {({ isActive }) => (
                      <button
                        className={`w-full flex items-center px-2 py-1.5 rounded-lg text-[10px] transition-colors
                        ${
                          isActive
                            ? "bg-[#1e282c] text-sky-300"
                            : "text-slate-400 hover:bg-[#1b2225] hover:text-slate-200"
                        }`}
                      >
                        {ChildIcon && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded mr-2 bg-[#1f2d3a] text-slate-300">
                            <ChildIcon size={11} />
                          </span>
                        )}
                        <span className="truncate">{child.name}</span>
                      </button>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  const renderParentItem = (item: MenuItem) => {
    const Icon = item.icon;
    const active = isParentActive(item);
    const isOpen = openMenus[item.name] ?? active;

    return (
      <li key={item.name}>
        <button
          type="button"
          onClick={() => toggleMenu(item.name)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors
          ${
            active || isOpen
              ? "bg-[#1e282c] text-white border-l-4 border-sky-400"
              : "text-slate-200 hover:bg-[#1b2225]"
          }`}
        >
          <span className="flex items-center min-w-0">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded mr-3
              ${
                active || isOpen
                  ? "bg-sky-500 text-white"
                  : "bg-[#1f2d3a] text-slate-200"
              }`}
            >
              <Icon size={15} />
            </span>
            <span className="truncate">{item.name}</span>
          </span>
          <ChevronRight
            size={13}
            className={`ml-2 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
        </button>

        {isOpen && item.children && (
          <ul className="mt-1 pl-4 space-y-1">
            {item.children.map((child) => {
              if (isNestedMenuItem(child)) {
                return renderNestedItem(child, item.name);
              }
              const ChildIcon = child.icon;
              return (
                <li key={child.path}>
                  <NavLink to={child.path}>
                    {({ isActive }) => (
                      <button
                        className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-[11px] transition-colors
                        ${
                          isActive
                            ? "bg-[#1e282c] text-sky-300"
                            : "text-slate-300 hover:bg-[#1b2225]"
                        }`}
                      >
                        {ChildIcon && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded mr-2 bg-[#1f2d3a] text-slate-200">
                            <ChildIcon size={13} />
                          </span>
                        )}
                        <span className="truncate">{child.name}</span>
                      </button>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside className="w-64 bg-[#222d32] text-slate-100 flex flex-col h-screen border-r border-[#1a2226] shadow-xl">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1a2226] bg-[#1a2226]">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-sky-500 text-white">
          <LayoutDashboard size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">AgriIDMS Quản lí kho</p>
          <p className="text-[11px] text-slate-300">Bảng điều khiển</p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a2226] bg-[#222d32]">
        <div className="h-9 w-9 rounded-full bg-sky-500 flex items-center justify-center text-xs font-semibold">
          QL
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Quản lí kho</p>
          <p className="text-[11px] text-emerald-400">Đang hoạt động</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Điều hướng chính
          </p>
          <ul className="space-y-1">
            {mainMenu.map((item) =>
              item.children ? renderParentItem(item) : renderLeafItem(item),
            )}
          </ul>
        </div>

        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tài khoản
          </p>
          <ul className="space-y-1">
            {accountMenu.map((item) =>
              item.children ? renderParentItem(item) : renderLeafItem(item),
            )}
          </ul>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-[#1a2226] bg-[#1a2226]">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#222d32] px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-[#1b2225] transition-colors"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

