import SalesOrdersPage from "./SalesOrdersPage";

/**
 * Hub theo dõi đơn: đủ các hàng đợi (xác nhận bán, giữ hàng, kho, COD, đã giao).
 * Khác {@link SalesSaleConfirmPage} — trang đó chỉ ép một hàng đợi và ẩn tab.
 */
export default function SalesOrdersHubPage() {
  return <SalesOrdersPage />;
}
