import { useAuth } from "./useAuth";
import { AUTH_ROLE, ROLE_DASHBOARD_MAP } from "../constants/auth.constants";
import type { UserRole } from "../constants/auth.constants";

export const useRoleGuard = () => {
    const auth = useAuth();

    const hasRole = (roles: UserRole[]): boolean => {
        if (!auth.user) return false;
        return roles.includes(auth.user.roles[0] as UserRole);
    };

    const isAdmin = (): boolean => {
        return auth.user?.roles[0] === AUTH_ROLE.ADMIN;
    };

    const isManager = (): boolean => {
        return auth.user?.roles[0] === AUTH_ROLE.MANAGER;
    };

    const isWarehouseStaff = (): boolean => {
        return auth.user?.roles[0] === AUTH_ROLE.WAREHOUSE_STAFF;
    };

    const isSalesStaff = (): boolean => {
        return auth.user?.roles[0] === AUTH_ROLE.SALES_STAFF;
    };

    const isCustomer = (): boolean => {
        return auth.user?.roles[0] === AUTH_ROLE.CUSTOMER;
    };

    const getDefaultRoute = (): string => {
        if (!auth.user || !auth.user.roles || auth.user.roles.length === 0) {
            return '/login';
        }
        const role = auth.user.roles[0] as UserRole;
        return ROLE_DASHBOARD_MAP[role] || '/login';
    };

    return {
        hasRole,
        isAdmin,
        isManager,
        isWarehouseStaff,
        isSalesStaff,
        isCustomer,
        currentRole: auth.user?.roles[0] as UserRole,
        getDefaultRoute,
    };
};