import { lazy } from "react";

const SalesStaffLayout = lazy(() => import("./components/SalesStaffLayout"));
const SalesSaleConfirmPage = lazy(() => import("./pages/SalesSaleConfirmPage"));
const SalesPendingCodPage = lazy(() => import("./pages/SalesPendingCodPage"));
const StaffComplaintsPage = lazy(() => import("../complaint/pages/StaffComplaintsPage"));

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
      { path: "complaints", element: <StaffComplaintsPage /> },
    ],
  },
];

