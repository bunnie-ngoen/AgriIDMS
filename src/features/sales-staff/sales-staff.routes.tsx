import { lazy } from "react";

const SalesStaffLayout = lazy(() => import("./components/SalesStaffLayout"));
const SalesSaleConfirmPage = lazy(() => import("./pages/SalesSaleConfirmPage"));
const SalesPendingCodPage = lazy(() => import("./pages/SalesPendingCodPage"));
const SalesPendingCustomerDecisionPage = lazy(() => import("./pages/SalesPendingCustomerDecisionPage"));
const SalesPosCreatePage = lazy(() => import("./pages/SalesPosCreatePage"));
const SalesPosNoProposalPage = lazy(() => import("./pages/SalesPosNoProposalPage"));
const SalesPosUnpaidOrdersPage = lazy(() => import("./pages/SalesPosUnpaidOrdersPage"));
const SalesOrderDetailPage = lazy(() => import("./pages/SalesOrderDetailPage"));
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
      { path: "orders/pos-create", element: <SalesPosCreatePage /> },
      { path: "orders/unpaid-pos", element: <SalesPosUnpaidOrdersPage /> },
      { path: "orders/pos-no-proposal", element: <SalesPosNoProposalPage /> },
      { path: "orders/:id", element: <SalesOrderDetailPage /> },
      { path: "orders/pending-cod", element: <SalesPendingCodPage /> },
      { path: "orders/pending-customer-decision", element: <SalesPendingCustomerDecisionPage /> },
      { path: "complaints", element: <SalesComplaintsPendingPage /> },
      { path: "complaints/pending", element: <SalesComplaintsPendingPage /> },
      { path: "complaints/processed", element: <SalesComplaintsProcessedPage /> },
    ],
  },
];

