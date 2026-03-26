import { lazy } from "react";

const ManagerLayout = lazy(() => import("./components/ManagerLayout"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const ManagerExportsPage = lazy(() => import("./pages/ManagerExportsPage"));
const StaffComplaintsPage = lazy(() => import("../complaint/pages/StaffComplaintsPage"));
// Manager layout/sidebar
const ManagerLayout = lazy(
  () => import("./components/layouts/ManagerLayout")
);

// Dashboard riêng cho Manager
const ManagerDashboardPage = lazy(
  () => import("./pages/ManagerDashboard")
);

// Kiểm kê
const ManagerStockChecksDashboardPage = lazy(
  () => import("../stock-check/pages/ManagerStockChecksDashboard")
);
const StockCheckDetailsPage = lazy(
  () => import("../stock-check/pages/StockCheckDetailsPage")
);

// Reuse các page hiện có của Admin (Manager chỉ bỏ phần User Management)
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
const ProfilePage = lazy(() => import("../admin/pages/Profile"));

const SupplierListPage = lazy(
  () => import("../supplier/pages/SupplierList")
);
const CreateSupplierPage = lazy(
  () => import("../supplier/pages/CreateSupplier")
);
const EditSupplierPage = lazy(
  () => import("../supplier/pages/EditSupplier")
);

const CategoryListPage = lazy(
  () => import("../category/pages/CategoryList")
);
const CreateCategoryPage = lazy(
  () => import("../category/pages/CreateCategory")
);
const EditCategoryPage = lazy(
  () => import("../category/pages/EditCategory")
);

const ProductListPage = lazy(() => import("../product/pages/ProductList"));
const CreateProductPage = lazy(
  () => import("../product/pages/CreateProduct")
);
const EditProductPage = lazy(() => import("../product/pages/EditProduct"));

const ProductVariantListPage = lazy(
  () => import("../product/pages/ProductVariantList")
);
const CreateProductVariantPage = lazy(
  () => import("../product/pages/CreateProductVariant")
);
const EditProductVariantPage = lazy(
  () => import("../product/pages/EditProductVariant")
);
const ProductVariantDetailPage = lazy(
  () => import("../product/pages/ProductVariantDetail")
);

const PurchaseOrderListPage = lazy(
  () => import("../purchase-staff/pages/PurchaseOrderList")
);
const CreatePurchaseOrderPage = lazy(
  () => import("../purchase-staff/pages/CreatePurchaseOrder")
);
const PurchaseOrderDetailPage = lazy(
  () => import("../purchase-staff/pages/PurchaseOrderDetail")
);
const EditPurchaseOrderPage = lazy(
  () => import("../purchase-staff/pages/EditPurchaseOrder")
);

const GoodsReceiptListPage = lazy(
  () => import("../goods-receipt/pages/GoodsReceiptList")
);
const CreateGoodsReceiptPage = lazy(
  () => import("../goods-receipt/pages/CreateGoodsReceipt")
);
const GoodsReceiptDetailPage = lazy(
  () => import("../goods-receipt/pages/GoodsReceiptDetail")
);
const GoodsReceiptQCPage = lazy(
  () => import("../goods-receipt/pages/GoodsReceiptQC")
);

const PutBoxIntoSlotPage = lazy(
  () => import("../warehouse/pages/PutBoxIntoSlot")
);

export const managerRoutes = [
  {
    path: "/manager",
    element: <ManagerLayout />,
    children: [
      { index: true, element: <ManagerDashboard /> },
      { path: "dashboard", element: <ManagerDashboard /> },
      { path: "exports", element: <ManagerExportsPage /> },
      { path: "complaints", element: <StaffComplaintsPage /> },
    ],
  },
];
      { index: true, element: <ManagerDashboardPage /> },
      { path: "dashboard", element: <ManagerDashboardPage /> },
      { path: "profile", element: <ProfilePage /> },

      // Kiểm kê (Manager duyệt)
      { path: "stock-checks", element: <ManagerStockChecksDashboardPage /> },
      { path: "stock-checks/:id", element: <StockCheckDetailsPage /> },

      // Quản lý kho
      { path: "warehouses", element: <WarehouseListPage /> },
      { path: "warehouses/create", element: <CreateWarehousePage /> },
      { path: "warehouses/:id/edit", element: <EditWarehousePage /> },
      { path: "warehouses/:id/config", element: <WarehouseConfigPage /> },
      { path: "warehouses/:id/map", element: <WarehouseMapPage /> },

      // Xếp box vào slot
      { path: "putaway", element: <PutBoxIntoSlotPage /> },

      // Nhà cung cấp
      { path: "suppliers", element: <SupplierListPage /> },
      { path: "suppliers/create", element: <CreateSupplierPage /> },
      { path: "suppliers/:id/edit", element: <EditSupplierPage /> },

      // Đơn mua hàng
      { path: "purchase-orders", element: <PurchaseOrderListPage /> },
      { path: "purchase-orders/create", element: <CreatePurchaseOrderPage /> },
      { path: "purchase-orders/:id", element: <PurchaseOrderDetailPage /> },
      { path: "purchase-orders/:id/edit", element: <EditPurchaseOrderPage /> },

      // Nhập kho (Goods Receipt)
      { path: "goods-receipts", element: <GoodsReceiptListPage /> },
      { path: "goods-receipts/create", element: <CreateGoodsReceiptPage /> },
      { path: "goods-receipts/:id", element: <GoodsReceiptDetailPage /> },
      { path: "goods-receipts/:id/qc", element: <GoodsReceiptQCPage /> },

      // Danh mục sản phẩm
      { path: "categories", element: <CategoryListPage /> },
      { path: "categories/create", element: <CreateCategoryPage /> },
      { path: "categories/:id/edit", element: <EditCategoryPage /> },

      // Sản phẩm
      { path: "products", element: <ProductListPage /> },
      { path: "products/create", element: <CreateProductPage /> },
      { path: "products/:id/edit", element: <EditProductPage /> },

      // Product Variant
      { path: "product-variants", element: <ProductVariantListPage /> },
      { path: "product-variants/create", element: <CreateProductVariantPage /> },
      { path: "product-variants/:id/edit", element: <EditProductVariantPage /> },
      { path: "product-variants/:id/detail", element: <ProductVariantDetailPage /> },
    ],
  },
];

