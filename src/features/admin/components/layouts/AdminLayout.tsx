import { Outlet } from "react-router-dom";
import AdminSidebar from "../sidebars/AdminSidebar";
import AdminHeader from "../header/AdminHeader";
export default function AdminLayout() {
  return (
    <div className="bg-[#F4F4F5] flex h-screen">
      <AdminSidebar />
      <div className="w-[85%] overflow-auto flex flex-col">
        <AdminHeader/>
        <Outlet />
      </div>
    </div>
  );
}