import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './features/home/pages/HomePage';
import GioiThieuPage from './features/home/pages/GioiThieuPage';
import LoginPage from './features/auth/pages/LoginPage';
// import AdminDashboard from './features/admin/pages/AdminDashboard';
// import CustomerDashboard from './features/customer/pages/CustomerDashboard';
import UnauthorizedPage from './features/error/pages/UnauthorizedPage';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ROUTES } from './shared/constants/routes';
import { AUTH_ROLE } from './features/auth/constants/auth.constants';
import { adminRoutes } from './features/admin/admin.routes';
import { purchaseStaffRoutes } from './features/purchase-staff/purchase-staff.routes';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500">Đang tải...</div>}>
            <Routes>
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route path={ROUTES.GIOI_THIEU} element={<GioiThieuPage />} />
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

                {purchaseStaffRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <ProtectedRoute allowedRoles={[AUTH_ROLE.PURCHASING_STAFF]}>
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

                <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
            </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;