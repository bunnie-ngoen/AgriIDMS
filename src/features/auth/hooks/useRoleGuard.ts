import { useAuth } from "./useAuth";
import { AUTH_ROLE, ROLE_DASHBOARD_MAP } from "../constants/auth.constants";
import type { UserRole } from "../constants/auth.constants";

export const useRoleGuard = () => {
    const auth = useAuth();
    const rawRoles = (auth.user as { roles?: unknown } | null)?.roles;
    const roles = Array.isArray(rawRoles)
        ? rawRoles.filter((r): r is string => typeof r === "string")
        : typeof rawRoles === "string"
            ? [rawRoles]
            : [];
    const roleSet = new Set(roles as UserRole[]);
    const currentRole = roles[0] as UserRole | undefined;

    const hasRole = (roles: UserRole[]): boolean => {
        return roles.some((role) => roleSet.has(role));
    };

    const isAdmin = (): boolean => {
        return roleSet.has(AUTH_ROLE.ADMIN);
    };

    const isManager = (): boolean => {
        return roleSet.has(AUTH_ROLE.MANAGER);
    };

    const isWarehouseStaff = (): boolean => {
        return roleSet.has(AUTH_ROLE.WAREHOUSE_STAFF);
    };

    const isSalesStaff = (): boolean => {
        return roleSet.has(AUTH_ROLE.SALES_STAFF);
    };

    const isCustomer = (): boolean => {
        return roleSet.has(AUTH_ROLE.CUSTOMER);
    };

    const isPurchasingStaff = (): boolean => {
        return roleSet.has(AUTH_ROLE.PURCHASING_STAFF);
    };

    const getDefaultRoute = (): string => {
        if (!currentRole) {
            return '/login';
        }
        return ROLE_DASHBOARD_MAP[currentRole] || '/login';
    };

    return {
        hasRole,
        isAdmin,
        isManager,
        isWarehouseStaff,
        isSalesStaff,
        isPurchasingStaff,
        isCustomer,
        currentRole: currentRole as UserRole,
        getDefaultRoute,
    };
};