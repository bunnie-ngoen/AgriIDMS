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
const CreateWarehousePage = lazy(
  () => import("../admin/pages/CreateWarehouse")
);
const WarehouseListPage = lazy(
  () => import("../admin/pages/WarehouseList")
);
const EditWarehousePage = lazy(
  () => import("../admin/pages/EditWarehouse")
);
const WarehouseConfigPage = lazy(
  () => import("../admin/pages/WarehouseConfig")
);
const WarehouseMapPage = lazy(
  () => import("../admin/pages/WarehouseMap")
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
      { path: "warehouses", element: <WarehouseListPage /> },
      { path: "warehouses/create", element: <CreateWarehousePage /> },
      { path: "warehouses/:id/edit", element: <EditWarehousePage /> },
      { path: "warehouses/:id/config", element: <WarehouseConfigPage /> },
      { path: "warehouses/:id/map", element: <WarehouseMapPage /> },
    ],
  },
];