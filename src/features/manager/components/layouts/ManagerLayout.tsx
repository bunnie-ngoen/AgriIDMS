import { Outlet } from "react-router-dom";
import AdminHeader from "../../../admin/components/header/AdminHeader";
import ManagerSidebar from "../sidebars/ManagerSidebar";

export default function ManagerLayout() {
  return (
    <div className="h-screen flex bg-[#F4F4F5] overflow-hidden">
      <ManagerSidebar />

      <div className="flex-1 flex flex-col">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

