import { lazy } from "react";

const SalesStaffLayout = lazy(() => import("./components/SalesStaffLayout"));
const SalesSaleConfirmPage = lazy(() => import("./pages/SalesSaleConfirmPage"));
const SalesOrdersHubPage = lazy(() => import("./pages/SalesOrdersHubPage"));
const SalesPendingCodPage = lazy(() => import("./pages/SalesPendingCodPage"));
const SalesApprovedExportPage = lazy(() => import("./pages/SalesApprovedExportPage"));
const SalesPosCreatePage = lazy(() => import("./pages/SalesPosCreatePage"));
const SalesPosUnpaidOrdersPage = lazy(() => import("./pages/SalesPosUnpaidOrdersPage"));
const SalesOrderDetailPage = lazy(() => import("./pages/SalesOrderDetailPage"));
const SalesComplaintsPendingPage = lazy(() => import("./pages/SalesComplaintsPendingPage"));
const SalesComplaintsProcessedPage = lazy(() => import("./pages/SalesComplaintsProcessedPage"));
const ProfilePage = lazy(() => import("../home/pages/ProfilePage"));

export const salesStaffRoutes = [
  {
    path: "/sales",
    element: <SalesStaffLayout />,
    children: [
      { index: true, element: <SalesSaleConfirmPage /> },
      { path: "dashboard", element: <SalesSaleConfirmPage /> },
      { path: "orders", element: <SalesOrdersHubPage /> },
      { path: "orders/sale-confirm", element: <SalesSaleConfirmPage /> },
      { path: "orders/pos-create", element: <SalesPosCreatePage /> },
      { path: "orders/unpaid-pos", element: <SalesPosUnpaidOrdersPage /> },
      { path: "orders/pending-cod", element: <SalesPendingCodPage /> },
      { path: "orders/approved-export", element: <SalesApprovedExportPage /> },
      { path: "orders/:id", element: <SalesOrderDetailPage /> },
      { path: "complaints", element: <SalesComplaintsPendingPage /> },
      { path: "complaints/pending", element: <SalesComplaintsPendingPage /> },
      { path: "complaints/processed", element: <SalesComplaintsProcessedPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
];

