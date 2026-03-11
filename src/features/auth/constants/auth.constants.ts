export const AUTH_ROLE = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    WAREHOUSE_STAFF: 'WarehouseStaff',
    SALES_STAFF: 'SalesStaff',
    PURCHASING_STAFF: 'PurchasingStaff',
    CUSTOMER: 'Customer'
} as const;

export type UserRole = typeof AUTH_ROLE[keyof typeof AUTH_ROLE];

// auth.constants.ts
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
    [AUTH_ROLE.ADMIN]: '/admin/dashboard',
    [AUTH_ROLE.MANAGER]: '/manager/dashboard',
    [AUTH_ROLE.WAREHOUSE_STAFF]: '/warehouse/dashboard',
    [AUTH_ROLE.SALES_STAFF]: '/sales/dashboard',
    [AUTH_ROLE.PURCHASING_STAFF]: '/purchase-staff/dashboard',
    [AUTH_ROLE.CUSTOMER]: '/customer/dashboard',
};