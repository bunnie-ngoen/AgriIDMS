export const ROUTES = {
    HOME: "/",
    GIOI_THIEU: "/gioi-thieu",
    PRODUCT_DETAIL: "/product/:id",
    LOGIN: "/login",
    REGISTER: "/register",
    UNAUTHORIZED: "/unauthorized",
    FORGET_PASSWORD : "/forget-password",
    PROFILE: "/profile",
    // Admin routes
    ADMIN_DASHBOARD: "/admin/dashboard",
    ADMIN_USERS: "/admin/users",
    ADMIN_SETTINGS: "/admin/settings",
    
    // Manager routes
    MANAGER_DASHBOARD: "/manager/dashboard",
    MANAGER_REPORTS: "/manager/reports",
    
    // Warehouse routes
    WAREHOUSE_DASHBOARD: "/warehouse/dashboard",
    WAREHOUSE_INVENTORY: "/warehouse/inventory",
    
    // Sales routes
    SALES_DASHBOARD: "/sales/dashboard",
    SALES_ORDERS: "/sales/orders",
    
    // Customer routes
    CUSTOMER_DASHBOARD: "/customer/dashboard",
    CUSTOMER_PROFILE: "/customer/profile",
    CUSTOMER_ORDERS: "/customer/orders",
    CUSTOMER_ORDERS_PAGE: "/my-orders",
    CUSTOMER_ORDER_DETAIL: "/my-orders/:id",
    CUSTOMER_COMPLAINTS: "/my-complaints",
    CART: "/cart",
    /** Màn PO / xác nhận đơn — map với POST Orders/from-cart/variants */
    CHECKOUT: "/checkout/purchase-order",
    /** Sau khi đặt hàng thành công — `orderId` khớp GET Orders/:id */
    CHECKOUT_ORDER_RECEIVED: "/checkout/purchase-order/received/:orderId",

    /** Tab in phiếu xuất (cùng origin, tránh URL blob ở chân trang in). */
    PRINT_EXPORT_SLIP: "/print/export-slip",
};