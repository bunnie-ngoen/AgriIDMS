import { lazy } from "react";

const SalesStaffLayout = lazy(() => import("./components/SalesStaffLayout"));
const SalesStaffDashboard = lazy(() => import("./pages/SalesStaffDashboard"));
const SalesOrdersPage = lazy(() => import("./pages/SalesOrdersPage"));

export const salesStaffRoutes = [
  {
    path: "/sales",
    element: <SalesStaffLayout />,
    children: [
      { index: true, element: <SalesStaffDashboard /> },
      { path: "dashboard", element: <SalesStaffDashboard /> },
      { path: "orders", element: <SalesOrdersPage /> },
    ],
  },
];

