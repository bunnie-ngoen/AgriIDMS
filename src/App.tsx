import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './features/home/pages/HomePage';
import GioiThieuPage from './features/home/pages/GioiThieuPage';
import LoginPage from './features/auth/pages/LoginPage';
import UnauthorizedPage from './features/error/pages/UnauthorizedPage';
import ProtectedRoute from './shared/components/ProtectedRoute';
import PublicLayout from './shared/components/layout/PublicLayout';
import { ROUTES } from './shared/constants/routes';
import { AUTH_ROLE } from './features/auth/constants/auth.constants';
import { adminRoutes } from './features/admin/admin.routes';
import { purchaseStaffRoutes } from './features/purchase-staff/purchase-staff.routes';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ProfilePage from './features/home/pages/ProfilePage';
import ProductDetailPage from './features/home/pages/ProductDetailPage';
function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500">Đang tải...</div>}>
                <Routes>
                    {/* Public routes — có TopBar + Header + Footer */}
                    <Route element={<PublicLayout />}>
                        <Route path={ROUTES.HOME} element={<HomePage />} />
                        <Route path={ROUTES.GIOI_THIEU} element={<GioiThieuPage />} />
                        <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />
                        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                    </Route>

                    {/* Auth routes — không có layout public */}
                    <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                    <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                    <Route path={ROUTES.FORGET_PASSWORD} element={<ForgotPasswordPage />} />
                    <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

                    {/* Admin routes (tạm dùng chung cho Admin + Manager) */}
                    {adminRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <ProtectedRoute allowedRoles={[AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER]}>
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

                    {/* Purchase staff routes */}
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