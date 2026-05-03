import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { ROUTES } from "../constants/routes";
import type { UserRole } from "../../features/auth/constants/auth.constants";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ 
    children, 
    allowedRoles 
}: ProtectedRouteProps) {
    const auth = useAuth();
    const location = useLocation();
    const rawRoles = (auth.user as { roles?: unknown } | null)?.roles;
    const userRoles = Array.isArray(rawRoles)
        ? rawRoles.filter((r): r is string => typeof r === "string")
        : typeof rawRoles === "string"
            ? [rawRoles]
            : [];

    // Chưa đăng nhập
    if (!auth.accessToken || !auth.user) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // Kiểm tra quyền nếu có allowedRoles (bất kỳ vai trò nào khớp — không chỉ roles[0])
    if (allowedRoles && allowedRoles.length > 0) {
        if (userRoles.length === 0) {
            return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
        }
        const hasPermission = userRoles.some((r) =>
            allowedRoles.includes(r as UserRole),
        );

        if (!hasPermission) {
            return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
        }
    }

    return <>{children}</>;
}