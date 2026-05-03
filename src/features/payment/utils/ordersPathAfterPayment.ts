import { ROUTES } from "../../../shared/constants/routes";
import { AUTH_ROLE, type UserRole } from "../../auth/constants/auth.constants";

/** Sau thanh toán PayOS: khách → đơn của tôi; sale/admin/manager → hub đơn; kho → dashboard kho; chưa đăng nhập → login. */
export function ordersPathAfterPayment(roles: string[]): string {
    if (roles.includes(AUTH_ROLE.CUSTOMER)) return ROUTES.CUSTOMER_ORDERS_PAGE;
    const staffSales: UserRole[] = [AUTH_ROLE.SALES_STAFF, AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER];
    if (roles.some((r) => staffSales.includes(r as UserRole))) return ROUTES.SALES_ORDERS;
    if (roles.includes(AUTH_ROLE.WAREHOUSE_STAFF)) return ROUTES.WAREHOUSE_DASHBOARD;
    return ROUTES.LOGIN;
}

export function rolesFromAuthUser(user: unknown): string[] {
    const raw = (user as { roles?: unknown } | null)?.roles;
    if (Array.isArray(raw)) return raw.filter((r): r is string => typeof r === "string");
    if (typeof raw === "string") return [raw];
    return [];
}
