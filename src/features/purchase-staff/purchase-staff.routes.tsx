import { lazy } from "react";

const PurchaseStaffLayout = lazy(() => import("./components/PurchaseStaffLayout"));
const PurchaseStaffDashboard = lazy(() => import("./pages/PurchaseStaffDashboard"));
const PurchaseOrderList = lazy(() => import("./pages/PurchaseOrderList"));
const CreatePurchaseOrder = lazy(() => import("./pages/CreatePurchaseOrder"));
const PurchaseOrderDetail = lazy(() => import("./pages/PurchaseOrderDetail"));
const EditPurchaseOrder = lazy(() => import("./pages/EditPurchaseOrder"));

export const purchaseStaffRoutes = [
  {
    path: "/purchase-staff",
    element: <PurchaseStaffLayout />,
    children: [
      { index: true, element: <PurchaseStaffDashboard /> },
      { path: "dashboard", element: <PurchaseStaffDashboard /> },
      { path: "orders", element: <PurchaseOrderList /> },
      { path: "orders/create", element: <CreatePurchaseOrder /> },
      { path: "orders/:id", element: <PurchaseOrderDetail /> },
      { path: "orders/:id/edit", element: <EditPurchaseOrder /> },
    ],
  },
];
