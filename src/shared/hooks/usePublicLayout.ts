import { useAppSelector } from "../../app/hook";
import { selectIsLoggedIn } from "../../features/auth/selectors/auth.selectors";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { ROLE_DASHBOARD_MAP, ROLES_WITH_DASHBOARD } from "../../features/auth/constants/auth.constants";
import type { UserRole } from "../../features/auth/constants/auth.constants";

export function usePublicLayout() {
    const isLoggedIn = useAppSelector(selectIsLoggedIn);
    const auth = useAuth();
    const role = auth.user?.roles?.[0] as UserRole | undefined;
    const hasDashboard = isLoggedIn && role != null && ROLES_WITH_DASHBOARD.includes(role);
    const dashboardPath = role ? ROLE_DASHBOARD_MAP[role] : null;

    return { isLoggedIn, hasDashboard, dashboardPath };
}