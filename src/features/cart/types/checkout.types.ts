/**
 * State truyền qua react-router khi chuyển từ giỏ sang màn PO.
 * - `lineKeys` không có hoặc null: thanh toán toàn bộ dòng trong giỏ (theo giỏ hiện tại).
 * - `lineKeys` có phần tử: chỉ các dòng khớp `cartItemKey`.
 */
export type CheckoutNavigateState = {
    lineKeys?: string[] | null;
};
