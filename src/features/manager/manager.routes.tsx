import { lazy } from "react";

const ManagerLayout = lazy(() => import("./components/ManagerLayout"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const ManagerExportsPage = lazy(() => import("./pages/ManagerExportsPage"));
const StaffComplaintsPage = lazy(() => import("../complaint/pages/StaffComplaintsPage"));

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
