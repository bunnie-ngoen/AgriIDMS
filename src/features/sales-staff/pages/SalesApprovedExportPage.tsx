import SalesOrdersPage from "./SalesOrdersPage";

export default function SalesApprovedExportPage() {
  return <SalesOrdersPage forcedQueue="approvedExport" hideQueueTabs />;
}
