import { useNavigate } from "react-router-dom";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

export default function UnauthorizedPage() {
    const navigate = useNavigate();
    const { getDefaultRoute } = useRoleGuard();

    const goToMyDashboard = () => {
        const route = getDefaultRoute();
        navigate(route);
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
                <p className="text-xl mb-4">Unauthorized Access</p>
                <p className="text-gray-600 mb-6">
                    Bạn không có quyền truy cập trang này.
                </p>
                <button
                    onClick={goToMyDashboard}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                    Về trang của tôi
                </button>
            </div>
        </div>
    );
}