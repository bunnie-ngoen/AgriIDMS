import { lazy } from "react";

const WarehouseStaffLayout = lazy(
  () => import("./components/WarehouseStaffLayout"),
);
const SalesOrdersPage = lazy(() => import("../sales-staff/pages/SalesOrdersPage"));
const WarehouseAllocationProposalPage = lazy(
  () => import("./pages/WarehouseAllocationProposalPage"),
);
const WarehouseExportsPage = lazy(
  () => import("./pages/WarehouseExportsPage"),
);

export const warehouseStaffRoutes = [
  {
    path: "/warehouse",
    element: <WarehouseStaffLayout />,
    children: [
      { index: true, element: <SalesOrdersPage /> },
      { path: "dashboard", element: <SalesOrdersPage /> },
      { path: "orders", element: <SalesOrdersPage /> },
      { path: "orders/:orderId/proposals", element: <WarehouseAllocationProposalPage /> },
      { path: "exports", element: <WarehouseExportsPage /> },
    ],
  },
];

