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
        <div className="h-screen bg-gray-100 px-4 flex items-center justify-center">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
                <p className="text-xl mb-4">Không có quyền truy cập</p>
                <p className="text-gray-600 mb-6">
                    Bạn không có quyền truy cập trang này.
                </p>
                <button
                    onClick={goToMyDashboard}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                    Về trang của tôi
                </button>
            </div>
        </div>
    );
}