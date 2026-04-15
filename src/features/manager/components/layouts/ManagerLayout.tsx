import { Outlet } from "react-router-dom";
import AdminHeader from "../../../admin/components/header/AdminHeader";
import ManagerSidebar from "../sidebars/ManagerSidebar";

export default function ManagerLayout() {
  return (
    <div className="h-screen flex bg-[#F4F4F5] overflow-hidden">
      <ManagerSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-6 pt-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

