import { lazy } from "react";

const WarehouseStaffLayout = lazy(
  () => import("./components/WarehouseStaffLayout"),
);
const WarehouseStaffDashboard = lazy(
  () => import("./pages/WarehouseStaffDashboard"),
);
const SalesOrdersPage = lazy(() => import("../sales-staff/pages/SalesOrdersPage"));
const WarehouseStockChecksDashboard = lazy(
  () => import("../stock-check/pages/WarehouseStockChecksDashboard")
);
const WarehouseStockCheckCreatePage = lazy(
  () => import("../stock-check/pages/WarehouseStockCheckCreatePage")
);
const StockCheckDetailsPage = lazy(
  () => import("../stock-check/pages/StockCheckDetailsPage")
const WarehouseAllocationProposalPage = lazy(
  () => import("./pages/WarehouseAllocationProposalPage"),
);

export const warehouseStaffRoutes = [
  {
    path: "/warehouse",
    element: <WarehouseStaffLayout />,
    children: [
      { index: true, element: <WarehouseStaffDashboard /> },
      { path: "dashboard", element: <WarehouseStaffDashboard /> },
      { path: "orders", element: <SalesOrdersPage /> },
      { path: "stock-checks", element: <WarehouseStockChecksDashboard /> },
      {
        path: "stock-checks/create",
        element: <WarehouseStockCheckCreatePage />,
      },
      { path: "stock-checks/:id", element: <StockCheckDetailsPage /> },
      { path: "orders/:orderId/proposals", element: <WarehouseAllocationProposalPage /> },
    ],
  },
];

