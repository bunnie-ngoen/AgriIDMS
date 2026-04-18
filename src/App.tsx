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
import { managerRoutes } from './features/manager/manager.routes';
import { purchaseStaffRoutes } from './features/purchase-staff/purchase-staff.routes';
import { salesStaffRoutes } from './features/sales-staff/sales-staff.routes';
import { warehouseStaffRoutes } from './features/warehouse-staff/warehouse-staff.routes';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ProfilePage from './features/home/pages/ProfilePage';
import ProductDetailPage from './features/home/pages/ProductDetailPage';
import CartPage from './features/cart/pages/CartPage';
import CheckoutPage from './features/cart/pages/CheckoutPage';
import OrderReceivedPage from './features/cart/pages/OrderReceivedPage';
import MyOrdersPage from './features/order/pages/MyOrdersPage';
import MyOrderDetailPage from './features/order/pages/MyOrderDetailPage';
import CustomerComplaintsPage from './features/complaint/pages/CustomerComplaintsPage';
import ExportPrintSlipPage from './features/export/pages/ExportPrintSlipPage';
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
                        <Route
                            path={ROUTES.CART}
                            element={
                                <ProtectedRoute allowedRoles={[AUTH_ROLE.CUSTOMER]}>
                                    <CartPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.CHECKOUT}
                            element={
                                <ProtectedRoute allowedRoles={[AUTH_ROLE.CUSTOMER]}>
                                    <CheckoutPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.CHECKOUT_ORDER_RECEIVED}
                            element={
                                <ProtectedRoute allowedRoles={[AUTH_ROLE.CUSTOMER]}>
                                    <OrderReceivedPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.CUSTOMER_ORDERS_PAGE}
                            element={
                                <ProtectedRoute allowedRoles={[AUTH_ROLE.CUSTOMER]}>
                                    <MyOrdersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.CUSTOMER_ORDER_DETAIL}
                            element={
                                <ProtectedRoute allowedRoles={[AUTH_ROLE.CUSTOMER]}>
                                    <MyOrderDetailPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.CUSTOMER_COMPLAINTS}
                            element={
                                <ProtectedRoute allowedRoles={[AUTH_ROLE.CUSTOMER]}>
                                    <CustomerComplaintsPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Auth routes — không có layout public */}
                    <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                    <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                    <Route path={ROUTES.FORGET_PASSWORD} element={<ForgotPasswordPage />} />
                    <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

                    <Route
                        path={ROUTES.PRINT_EXPORT_SLIP}
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    AUTH_ROLE.WAREHOUSE_STAFF,
                                    AUTH_ROLE.ADMIN,
                                    AUTH_ROLE.MANAGER,
                                ]}
                            >
                                <ExportPrintSlipPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin routes */}
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

                    {/* Manager routes (riêng) */}
                    {managerRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <ProtectedRoute allowedRoles={[AUTH_ROLE.MANAGER]}>
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

                    {/* Warehouse staff routes (order + payment) */}
                    {warehouseStaffRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <ProtectedRoute allowedRoles={[
                                    AUTH_ROLE.WAREHOUSE_STAFF,
                                    AUTH_ROLE.ADMIN,
                                    AUTH_ROLE.MANAGER
                                ]}>
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

                    {/* Sales staff routes */}
                    {salesStaffRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <ProtectedRoute allowedRoles={[
                                    AUTH_ROLE.SALES_STAFF,
                                    AUTH_ROLE.ADMIN,
                                    AUTH_ROLE.MANAGER
                                ]}>
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