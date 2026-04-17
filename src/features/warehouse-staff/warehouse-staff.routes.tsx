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
const WarehouseStartShippingPage = lazy(
  () => import("./pages/WarehouseStartShippingPage"),
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
const GoodsReceiptPrintSlipPage = lazy(
  () => import("../goods-receipt/pages/GoodsReceiptPrintSlipPage"),
);
const LotListPage = lazy(
  () => import("../goods-receipt/pages/LotListPage"),
);
const LotDetailPage = lazy(
  () => import("../goods-receipt/pages/LotDetailPage"),
);
const WarehouseListPage = lazy(
  () => import("../admin/pages/WarehouseList"),
);
const WarehouseMapPage = lazy(
  () => import("../admin/pages/WarehouseMap"),
);
const PutBoxIntoSlotPage = lazy(
  () => import("../warehouse/pages/PutBoxIntoSlot"),
);
const InventoryIssueManagementPage = lazy(
  () => import("../manager/pages/InventoryIssueManagementPage"),
);
const WarehouseDamageReportsPage = lazy(
  () => import("./pages/WarehouseDamageReportsPage"),
);
const ProfilePage = lazy(() => import("../home/pages/ProfilePage"));

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
      { path: "shipping", element: <WarehouseStartShippingPage /> },
      { path: "goods-receipts", element: <GoodsReceiptListPage /> },
      { path: "goods-receipts/create", element: <CreateGoodsReceiptPage /> },
      { path: "goods-receipts/print", element: <GoodsReceiptPrintSlipPage /> },
      { path: "goods-receipts/:id", element: <GoodsReceiptDetailPage /> },
      { path: "goods-receipts/:id/qc", element: <GoodsReceiptQCPage /> },
      { path: "lots", element: <LotListPage /> },
      { path: "lots/:id", element: <LotDetailPage /> },
      { path: "warehouses", element: <WarehouseListPage /> },
      { path: "warehouses/:id/map", element: <WarehouseMapPage /> },
      { path: "putaway", element: <PutBoxIntoSlotPage /> },
      { path: "inventory-issues", element: <InventoryIssueManagementPage /> },
      { path: "damage-reports", element: <WarehouseDamageReportsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
];

