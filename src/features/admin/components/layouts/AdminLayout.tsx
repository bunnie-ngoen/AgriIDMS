import { Outlet } from "react-router-dom";
import AdminSidebar from "../sidebars/AdminSidebar";
import AdminHeader from "../header/AdminHeader";
export default function AdminLayout() {
  return (
    <div className="h-screen flex bg-[#F4F4F5] overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <AdminHeader />

        {/* Content scroll riêng */}
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}