import { lazy } from "react";

const SalesStaffLayout = lazy(() => import("./components/SalesStaffLayout"));
const SalesSaleConfirmPage = lazy(() => import("./pages/SalesSaleConfirmPage"));
const SalesPendingCodPage = lazy(() => import("./pages/SalesPendingCodPage"));
const SalesComplaintsPendingPage = lazy(() => import("./pages/SalesComplaintsPendingPage"));
const SalesComplaintsProcessedPage = lazy(() => import("./pages/SalesComplaintsProcessedPage"));

export const salesStaffRoutes = [
  {
    path: "/sales",
    element: <SalesStaffLayout />,
    children: [
      { index: true, element: <SalesSaleConfirmPage /> },
      { path: "dashboard", element: <SalesSaleConfirmPage /> },
      { path: "orders", element: <SalesSaleConfirmPage /> },
      { path: "orders/sale-confirm", element: <SalesSaleConfirmPage /> },
      { path: "orders/pending-cod", element: <SalesPendingCodPage /> },
      { path: "complaints", element: <SalesComplaintsPendingPage /> },
      { path: "complaints/pending", element: <SalesComplaintsPendingPage /> },
      { path: "complaints/processed", element: <SalesComplaintsProcessedPage /> },
    ],
  },
];

