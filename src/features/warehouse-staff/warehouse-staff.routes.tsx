import { lazy } from "react";

const WarehouseStaffLayout = lazy(
  () => import("./components/WarehouseStaffLayout"),
);
const SalesOrdersPage = lazy(() => import("../sales-staff/pages/SalesOrdersPage"));
const WarehouseStockChecksDashboard = lazy(
  () => import("../stock-check/pages/WarehouseStockChecksDashboard")
);
const WarehouseStockCheckCreatePage = lazy(
  () => import("../stock-check/pages/WarehouseStockCheckCreatePage")
);
const StockCheckDetailsPage = lazy(
  () => import("../stock-check/pages/StockCheckDetailsPage"),
);
const WarehouseAllocationProposalPage = lazy(
  () => import("./pages/WarehouseAllocationProposalPage"),
);
const WarehouseExportsPage = lazy(
  () => import("./pages/WarehouseExportsPage"),
);
const GoodsReceiptListPage = lazy(
  () => import("../goods-receipt/pages/GoodsReceiptList"),
);
const CreateGoodsReceiptPage = lazy(
  () => import("../goods-receipt/pages/CreateGoodsReceipt"),
);
const GoodsReceiptDetailPage = lazy(
  () => import("../goods-receipt/pages/GoodsReceiptDetail"),
);
const GoodsReceiptQCPage = lazy(
  () => import("../goods-receipt/pages/GoodsReceiptQC"),
);
const LotListPage = lazy(
  () => import("../goods-receipt/pages/LotListPage"),
);
const LotDetailPage = lazy(
  () => import("../goods-receipt/pages/LotDetailPage"),
);

export const warehouseStaffRoutes = [
  {
    path: "/warehouse",
    element: <WarehouseStaffLayout />,
    children: [
      { index: true, element: <SalesOrdersPage /> },
      { path: "dashboard", element: <SalesOrdersPage /> },
      { path: "orders", element: <SalesOrdersPage /> },
      { path: "stock-checks", element: <WarehouseStockChecksDashboard /> },
      {
        path: "stock-checks/create",
        element: <WarehouseStockCheckCreatePage />,
      },
      { path: "stock-checks/:id", element: <StockCheckDetailsPage /> },
      { path: "orders/:orderId/proposals", element: <WarehouseAllocationProposalPage /> },
      { path: "exports", element: <WarehouseExportsPage /> },
      { path: "goods-receipts", element: <GoodsReceiptListPage /> },
      { path: "goods-receipts/create", element: <CreateGoodsReceiptPage /> },
      { path: "goods-receipts/:id", element: <GoodsReceiptDetailPage /> },
      { path: "goods-receipts/:id/qc", element: <GoodsReceiptQCPage /> },
      { path: "lots", element: <LotListPage /> },
      { path: "lots/:id", element: <LotDetailPage /> },
    ],
  },
];

