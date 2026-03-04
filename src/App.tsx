import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import CustomerDashboard from './features/customer/pages/CustomerDashboard';
import UnauthorizedPage from './features/error/pages/UnauthorizedPage';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ROUTES } from './shared/constants/routes';
import { AUTH_ROLE } from './features/auth/constants/auth.constants';
import { adminRoutes } from './features/admin/admin.routes';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                <Route path={ROUTES.FORGET_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

                {adminRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <ProtectedRoute allowedRoles={[AUTH_ROLE.ADMIN]}>
                                {route.element}
                            </ProtectedRoute>
                        }
                    >
                        {route.children?.map((child, idx) => (
                            <Route
                                key={idx}
                                {...(child.index ? { index: true } : { path: child.path })}
                                element={child.element}
                            />
                        ))}
                    </Route>
                ))}

                <Route path="/" element={<Navigate to={ROUTES.LOGIN} />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;