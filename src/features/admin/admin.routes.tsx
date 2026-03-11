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
const ProfilePage = lazy(
  () => import("../admin/pages/Profile")
);

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

const ProductListPage = lazy(
  () => import("../product/pages/ProductList")
);
const CreateProductPage = lazy(
  () => import("../product/pages/CreateProduct")
);
const EditProductPage = lazy(
  () => import("../product/pages/EditProduct")
);

// Product Variant
const ProductVariantListPage = lazy(
  () => import("../product/pages/ProductVariantList")
);
const CreateProductVariantPage = lazy(
  () => import("../product/pages/CreateProductVariant")
);
const EditProductVariantPage = lazy(
  () => import("../product/pages/EditProductVariant")
);

// Purchase Order (Admin: duyệt đơn — danh sách + chi tiết)
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

      { path: "warehouses", element: <WarehouseListPage /> },
      { path: "warehouses/create", element: <CreateWarehousePage /> },
      { path: "warehouses/:id/edit", element: <EditWarehousePage /> },
      { path: "warehouses/:id/config", element: <WarehouseConfigPage /> },
      { path: "warehouses/:id/map", element: <WarehouseMapPage /> },

      { path: "suppliers", element: <SupplierListPage /> },
      { path: "suppliers/create", element: <CreateSupplierPage /> },
      { path: "suppliers/:id/edit", element: <EditSupplierPage /> },

      { path: "categories", element: <CategoryListPage /> },
      { path: "categories/create", element: <CreateCategoryPage /> },
      { path: "categories/:id/edit", element: <EditCategoryPage /> },

      { path: "products", element: <ProductListPage /> },
      { path: "products/create", element: <CreateProductPage /> },
      { path: "products/:id/edit", element: <EditProductPage /> },

      // Product Variant
      { path: "product-variants", element: <ProductVariantListPage /> },
      { path: "product-variants/create", element: <CreateProductVariantPage /> },
      { path: "product-variants/:id/edit", element: <EditProductVariantPage /> },

      // Đơn mua hàng (Admin: danh sách + duyệt)
      { path: "purchase-orders", element: <PurchaseOrderListPage /> },
      { path: "purchase-orders/create", element: <CreatePurchaseOrderPage /> },
      { path: "purchase-orders/:id", element: <PurchaseOrderDetailPage /> },
      { path: "purchase-orders/:id/edit", element: <EditPurchaseOrderPage /> },
    ],
  },
];