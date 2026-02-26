// admin.routes.ts
import { lazy } from "react";

const DashboardPage = lazy(() => import("../admin/pages/AdminDashboard"));
const AdminLayout = lazy(() => import("../admin/components/layouts/AdminLayout"));
const CreateUserPage = lazy(() => import("../admin/pages/CreateUser"));

export const adminRoutes = [
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> }, // Thêm lại dòng này
      { path: "dashboard", element: <DashboardPage /> }, // Thêm lại dòng này
      { path: "create-user", element: <CreateUserPage/> },
    ],
  },
];