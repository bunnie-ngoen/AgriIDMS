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
const ProfilePage = lazy(
  () => import("../home/pages/ProfilePage")
);
const DeletedUserListPage = lazy(() => import("../admin/pages/DeletedUserList"));
const RevenueProfitReportPage = lazy(
  () => import("../admin/pages/RevenueProfitReportPage"),
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

      { path: "profile", element: <ProfilePage /> },
      { path: "users/deleted", element: <DeletedUserListPage /> },
      { path: "reports/revenue-profit-specific", element: <RevenueProfitReportPage /> },
    ],
  },
];