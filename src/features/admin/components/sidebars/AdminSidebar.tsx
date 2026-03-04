import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  Users,
  Table,
  CirclePlus,
  List,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  Boxes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "../../../../app/hook";
import { logout } from "../../../auth/slices/auth.slice";
import { persistor } from "../../../../app/store";

type SubMenuItem = {
  name: string;
  path: string;
  icon?: LucideIcon;
};

type MenuItem = {
  name: string;
  path?: string;
  icon: LucideIcon;
  children?: SubMenuItem[];
};

const mainMenu: MenuItem[] = [
  { name: "Dashboard", path: "dashboard", icon: Archive },
  {
    name: "User Management",
    icon: Users,
    children: [
      { name: "Create Employee", path: "create-user", icon: CirclePlus },
      { name: "User list", path: "users", icon: List },
    ],
  },
  {
    name: "Quản lý kho",
    icon: Boxes,
    children: [
      { name: "Danh sách kho", path: "warehouses", icon: List },
      { name: "Tạo kho", path: "warehouses/create", icon: CirclePlus },
      { name: "Danh sách kệ/bàn", path: "tables", icon: Table },
    ],
  },
];

const accountMenu: MenuItem[] = [
  { name: "Profile", path: "profile", icon: Users },
];

export default function AdminSidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const currentLastSegment =
    location.pathname.split("/").filter(Boolean).slice(-1)[0] ?? "";

  const handleLogout = () => {
    dispatch(logout());
    persistor.purge();
    navigate("/login");
  };

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isParentActive = (item: MenuItem) =>
    item.children?.some((child) => child.path === currentLastSegment) ?? false;

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
                ${
                  isActive
                    ? "bg-sky-500 text-white"
                    : "bg-[#1f2d3a] text-slate-200"
                }`}
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
            className={`ml-2 transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        </button>

        {isOpen && item.children && (
          <ul className="mt-1 pl-4 space-y-1">
            {item.children.map((child) => {
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
      {/* BRAND HEADER */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1a2226] bg-[#1a2226]">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-sky-500 text-white">
          <LayoutDashboard size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">
            AgriIDMS Admin
          </p>
          <p className="text-[11px] text-slate-300">Dashboard</p>
        </div>
      </div>

      {/* USER PANEL */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a2226] bg-[#222d32]">
        <div className="h-9 w-9 rounded-full bg-sky-500 flex items-center justify-center text-xs font-semibold">
          AD
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Admin User</p>
          <p className="text-[11px] text-emerald-400">Online</p>
        </div>
      </div>

      {/* SCROLLABLE MENU AREA */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Main navigation
          </p>
          <ul className="space-y-1">
            {mainMenu.map((item) =>
              item.children ? renderParentItem(item) : renderLeafItem(item)
            )}
          </ul>
        </div>

        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Account
          </p>
          <ul className="space-y-1">
            {accountMenu.map((item) => renderLeafItem(item))}
          </ul>
        </div>
      </div>

      {/* FOOTER / LOGOUT */}
      <div className="px-4 py-4 border-t border-[#1a2226] bg-[#222d32]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded bg-[#1f2d3a]
                     px-4 py-2.5 text-xs font-semibold text-slate-100 hover:bg-[#243447]
                     transition-colors"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
