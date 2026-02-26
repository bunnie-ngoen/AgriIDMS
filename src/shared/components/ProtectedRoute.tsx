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

    // Chưa đăng nhập
    if (!auth.accessToken || !auth.user) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // Kiểm tra quyền nếu có allowedRoles
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = auth.user.roles[0];
        const hasPermission = allowedRoles.includes(userRole as UserRole);
        
        if (!hasPermission) {
            return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
        }
    }

    return <>{children}</>;
}