import { Outlet } from "react-router-dom";
import AdminSidebar from "../sidebars/AdminSidebar";
import AdminHeader from "../header/AdminHeader";
import { useState } from "react";
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-[#F4F4F5] overflow-hidden">
      <AdminSidebar
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      ) : null}

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onToggleSidebar={() => setSidebarOpen((s) => !s)} />

        {/* Content scroll riêng */}
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-3 pt-3 pb-6 sm:px-4 sm:pt-4 sm:pb-8 lg:px-6 lg:pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}