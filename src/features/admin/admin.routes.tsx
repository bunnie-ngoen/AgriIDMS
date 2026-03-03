// admin.routes.ts
import { lazy } from "react";

const DashboardPage = lazy(() => import("../admin/pages/AdminDashboard"));
const AdminLayout = lazy(
  () => import("../admin/components/layouts/AdminLayout")
);
const CreateUserPage = lazy(
  () => import("../admin/pages/CreateUser")
);
const UserListPage = lazy(
  () => import("../admin/pages/UserList")
);

export const adminRoutes = [
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "create-user", element: <CreateUserPage /> },
      { path: "users", element: <UserListPage /> },
    ],
  },
];