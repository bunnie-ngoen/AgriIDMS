import { lazy } from "react";

const WarehouseStaffLayout = lazy(
  () => import("./components/WarehouseStaffLayout"),
);
const WarehouseStaffDashboard = lazy(
  () => import("./pages/WarehouseStaffDashboard"),
);
const SalesOrdersPage = lazy(() => import("../sales-staff/pages/SalesOrdersPage"));

export const warehouseStaffRoutes = [
  {
    path: "/warehouse",
    element: <WarehouseStaffLayout />,
    children: [
      { index: true, element: <WarehouseStaffDashboard /> },
      { path: "dashboard", element: <WarehouseStaffDashboard /> },
      { path: "orders", element: <SalesOrdersPage /> },
    ],
  },
];

