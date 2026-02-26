import { NavLink, useNavigate } from "react-router-dom";
import { Archive, Users, Table, CirclePlus, List, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppDispatch } from "../../../../app/hook";
import { logout } from "../../../auth/slices/auth.slice";
import {persistor} from '../../../../app/store'

type MenuItem = {
  name: string;
  path: string;
  icon: LucideIcon;
};

const mainMenu: MenuItem[] = [
  { name: "Dashboard", path: "dashboard", icon: Archive },
  { name: "Create user", path: "create-user", icon: CirclePlus },
  { name: "User List", path: "users", icon: List },
  { name: "Table List", path: "tables", icon: Table },
];

const accountMenu: MenuItem[] = [
  { name: "Profile", path: "profile", icon: Users },
];

const renderItem = (item: MenuItem) => {
  const Icon = item.icon;

  return (
    <li key={item.path}>
      <NavLink to={item.path}>
        {({ isActive }) => (
          <div
            className={`flex items-center px-3 py-3 rounded-lg font-bold text-[13px]
            ${isActive ? "bg-white shadow-md ring-2 ring-gray-200" : ""}`}
          >
            <div
              className={`w-9 h-9 flex items-center justify-center rounded
              ${isActive ? "bg-[#7FBB35]" : "bg-gray-100"}`}
            >
              <Icon
                size={18}
                className={isActive ? "text-white" : "text-gray-700"}
              />
            </div>
            <span className="pl-4">{item.name}</span>
          </div>
        )}
      </NavLink>
    </li>
  );
};

export default function AdminSidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    persistor.purge();
    navigate("/login");
  };

  return (
    <div className="w-[17%] h-screen border-r border-gray-300 flex flex-col">
      {/* HEADER */}
      <div className="text-center p-8 font-bold border-b border-gray-300">
        Admin Dashboard
      </div>

      {/* MAIN MENU */}
      <ul className="flex flex-col gap-2 px-6 pr-4 mt-4">
        {mainMenu.map(renderItem)}
      </ul>

      {/* ACCOUNT SECTION */}
      <h1 className="px-6 mt-8 mb-2 text-xs font-bold text-gray-400 uppercase">
        Account Pages
      </h1>

      <ul className="flex flex-col gap-2 px-6 pr-4">
        {accountMenu.map(renderItem)}
      </ul>

      {/* LOGOUT BUTTON – DÍNH ĐÁY */}
      <div className="mt-auto px-6 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3
          rounded-lg font-bold text-[13px]
          text-white bg-[#7FBB35] hover:bg-amber-700 transition"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded">
            <LogOut size={18} />
          </div>
          Logout
        </button>
      </div>
    </div>
  );
}
