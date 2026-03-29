import SalesOrdersPage from "./SalesOrdersPage";

export default function SalesPendingCustomerDecisionPage() {
  return <SalesOrdersPage forcedQueue="pendingCustomerDecision" hideQueueTabs />;
}
