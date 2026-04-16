import { lazy } from "react";

const ManagerLayout = lazy(
  () => import("./components/layouts/ManagerLayout"),
);
const ManagerDashboardPage = lazy(() => import("./pages/ManagerDashboard"));
const ManagerExportsPage = lazy(() => import("./pages/ManagerExportsPage"));
const StaffComplaintsPage = lazy(
  () => import("../complaint/pages/StaffComplaintsPage"),
);

// Kiem ke
const ManagerStockChecksDashboardPage = lazy(
  () => import("../stock-check/pages/ManagerStockChecksDashboard"),
);
const StockCheckDetailsPage = lazy(
  () => import("../stock-check/pages/StockCheckDetailsPage"),
);

// Reuse page cua Admin (Manager bo phan User Management)
const CreateWarehousePage = lazy(() => import("../admin/pages/CreateWarehouse"));
const WarehouseListPage = lazy(() => import("../admin/pages/WarehouseList"));
const EditWarehousePage = lazy(() => import("../admin/pages/EditWarehouse"));
const WarehouseConfigPage = lazy(() => import("../admin/pages/WarehouseConfig"));
const WarehouseMapPage = lazy(() => import("../admin/pages/WarehouseMap"));
const ProfilePage = lazy(() => import("../admin/pages/Profile"));

const SupplierListPage = lazy(() => import("../supplier/pages/SupplierList"));
const CreateSupplierPage = lazy(() => import("../supplier/pages/CreateSupplier"));
const EditSupplierPage = lazy(() => import("../supplier/pages/EditSupplier"));

const CategoryListPage = lazy(() => import("../category/pages/CategoryList"));
const CreateCategoryPage = lazy(() => import("../category/pages/CreateCategory"));
const EditCategoryPage = lazy(() => import("../category/pages/EditCategory"));

const ProductListPage = lazy(() => import("../product/pages/ProductList"));
const CreateProductPage = lazy(() => import("../product/pages/CreateProduct"));
const EditProductPage = lazy(() => import("../product/pages/EditProduct"));

const ProductVariantListPage = lazy(
  () => import("../product/pages/ProductVariantList"),
);
const CreateProductVariantPage = lazy(
  () => import("../product/pages/CreateProductVariant"),
);
const EditProductVariantPage = lazy(
  () => import("../product/pages/EditProductVariant"),
);
const ProductVariantDetailPage = lazy(
  () => import("../product/pages/ProductVariantDetail"),
);

const PurchaseOrderListPage = lazy(
  () => import("../purchase-staff/pages/PurchaseOrderList"),
);
const CreatePurchaseOrderPage = lazy(
  () => import("../purchase-staff/pages/CreatePurchaseOrder"),
);
const PurchaseOrderDetailPage = lazy(
  () => import("../purchase-staff/pages/PurchaseOrderDetail"),
);
const EditPurchaseOrderPage = lazy(
  () => import("../purchase-staff/pages/EditPurchaseOrder"),
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

const PutBoxIntoSlotPage = lazy(() => import("../warehouse/pages/PutBoxIntoSlot"));
const InventoryIssueManagementPage = lazy(
  () => import("./pages/InventoryIssueManagementPage"),
);
const NearExpiryDiscountConfigPage = lazy(
  () => import("./pages/NearExpiryDiscountConfigPage"),
);
const VariantDiscountOverrideConfigPage = lazy(
  () => import("./pages/VariantDiscountOverrideConfigPage"),
);
const BoxTypeConfigPage = lazy(() => import("./pages/BoxTypeConfigPage"));
const DisposalRequestsPage = lazy(
  () => import("../admin/pages/DisposalRequestsPage"),
);

export const managerRoutes = [
  {
    path: "/manager",
    element: <ManagerLayout />,
    children: [
      { index: true, element: <ManagerDashboardPage /> },
      { path: "dashboard", element: <ManagerDashboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "exports", element: <ManagerExportsPage /> },
      { path: "complaints", element: <StaffComplaintsPage /> },

      // Kiem ke (Manager duyet)
      { path: "stock-checks", element: <ManagerStockChecksDashboardPage /> },
      { path: "stock-checks/:id", element: <StockCheckDetailsPage /> },

      // Quan ly kho
      { path: "warehouses", element: <WarehouseListPage /> },
      { path: "warehouses/create", element: <CreateWarehousePage /> },
      { path: "warehouses/:id/edit", element: <EditWarehousePage /> },
      { path: "warehouses/:id/config", element: <WarehouseConfigPage /> },
      { path: "warehouses/:id/map", element: <WarehouseMapPage /> },

      // Xep box vao slot
      { path: "putaway", element: <PutBoxIntoSlotPage /> },
      { path: "inventory-issues", element: <InventoryIssueManagementPage /> },
      { path: "near-expiry-discount-config", element: <NearExpiryDiscountConfigPage /> },
      { path: "variant-discount-config", element: <VariantDiscountOverrideConfigPage /> },
      { path: "box-type-config", element: <BoxTypeConfigPage /> },
      { path: "disposal-requests", element: <DisposalRequestsPage /> },

      // Nha cung cap
      { path: "suppliers", element: <SupplierListPage /> },
      { path: "suppliers/create", element: <CreateSupplierPage /> },
      { path: "suppliers/:id/edit", element: <EditSupplierPage /> },

      // Don mua hang
      { path: "purchase-orders", element: <PurchaseOrderListPage /> },
      { path: "purchase-orders/create", element: <CreatePurchaseOrderPage /> },
      { path: "purchase-orders/:id", element: <PurchaseOrderDetailPage /> },
      { path: "purchase-orders/:id/edit", element: <EditPurchaseOrderPage /> },

      // Nhap kho (Goods Receipt)
      { path: "goods-receipts", element: <GoodsReceiptListPage /> },
      { path: "goods-receipts/create", element: <CreateGoodsReceiptPage /> },
      { path: "goods-receipts/print", element: <GoodsReceiptPrintSlipPage /> },
      { path: "goods-receipts/:id", element: <GoodsReceiptDetailPage /> },
      { path: "goods-receipts/:id/qc", element: <GoodsReceiptQCPage /> },
      { path: "lots", element: <LotListPage /> },
      { path: "lots/:id", element: <LotDetailPage /> },

      // Danh muc san pham
      { path: "categories", element: <CategoryListPage /> },
      { path: "categories/create", element: <CreateCategoryPage /> },
      { path: "categories/:id/edit", element: <EditCategoryPage /> },

      // San pham
      { path: "products", element: <ProductListPage /> },
      { path: "products/create", element: <CreateProductPage /> },
      { path: "products/:id/edit", element: <EditProductPage /> },

      // Product Variant
      { path: "product-variants", element: <ProductVariantListPage /> },
      { path: "product-variants/create", element: <CreateProductVariantPage /> },
      { path: "product-variants/:id/edit", element: <EditProductVariantPage /> },
      {
        path: "product-variants/:id/detail",
        element: <ProductVariantDetailPage />,
      },
    ],
  },
];

