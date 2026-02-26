import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../app/hook";
import { logout } from "../../../features/auth/slices/auth.slice";
import { storage } from "../../../shared/libs/storage";
import { ROUTES } from "../../../shared/constants/routes";

export default function CustomerDashboard() {
    const auth = useAuth();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        dispatch(logout());
        storage.clear();
        navigate(ROUTES.LOGIN);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-blue-600">Customer Dashboard</h1>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">User Information</h2>
                        <div className="space-y-2">
                            <p><strong>User ID:</strong> {auth.user?.id}</p>
                            <p><strong>Username:</strong> {auth.user?.username}</p>
                            <p><strong>Roles:</strong> {auth.user?.roles.join(', ')}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Customer Features</h2>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>View Orders</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Update Profile</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Track Shipments</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}