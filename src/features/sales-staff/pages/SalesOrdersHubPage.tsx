import SalesOrdersPage from "./SalesOrdersPage";

/**
 * Hub theo dõi đơn: sale chỉ thấy các hàng đợi xử lý tại sale (xác nhận bán, COD, đã giao);
 * giữ hàng / kho xác nhận do warehouse xử lý và được ẩn khỏi giao diện sale-only.
 * Khác {@link SalesSaleConfirmPage} — trang đó chỉ ép một hàng đợi và ẩn tab.
 */
export default function SalesOrdersHubPage() {
  return <SalesOrdersPage />;
}
