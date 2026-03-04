import { useForm } from "react-hook-form";
import { useAppDispatch } from "../../../app/hook";
import { useLoginMutation } from "../api/auth.api";
import { loginSchema } from "../schemas/login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginFormValues } from "../schemas/login.schema";
import { mapLoginResponseToAuth } from "../domain/auth.mapper";
import { setAuth } from "../slices/auth.slice";
import { useNavigate } from "react-router-dom";
import { ROLE_DASHBOARD_MAP } from "../constants/auth.constants";
import type { UserRole } from "../constants/auth.constants";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LoginForm() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [login, { isLoading, error }] = useLoginMutation();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onChange"
    });

    const handleClick = () => {
        navigate("/register");
    };
    const handleForgotPassword = () => {
        navigate("/forget-password");
    };

    const onSubmit = async (values: LoginFormValues) => {
        try {
            const res = await login(values).unwrap();
            const authEntity = mapLoginResponseToAuth(res);

            dispatch(setAuth(authEntity));
            const userRole = authEntity.user.roles[0] as UserRole;
            const dashboardRoute = ROLE_DASHBOARD_MAP[userRole];

            if (dashboardRoute) {
                navigate(dashboardRoute);
            } else {
                navigate("/login");
            }
        } catch (error: any) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/10">
            {/* Left: Login form */}
            <div className="px-8 py-10 md:px-10 md:py-12 lg:px-12 lg:py-14 flex items-center">
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md mx-auto space-y-6">
                    <div className="space-y-2">
                        <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 mb-1">
                            Hệ thống quản lý kho nông sản
                        </p>
                        <h1 className="text-3xl md:text-3xl font-bold tracking-tight text-slate-900">
                            Đăng nhập AgriIDMS
                        </h1>
                        <p className="text-sm text-slate-500">
                            Vui lòng nhập tên đăng nhập hoặc email và mật khẩu để tiếp tục.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-sm text-slate-700">
                                Tên đăng nhập hoặc email
                            </label>
                            <input
                                {...form.register("userNameOrEmail")}
                                placeholder="username@example.com"
                                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-sm
                                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
                                type="text"
                            />
                            {form.formState.errors.userNameOrEmail && (
                                <p className="text-red-500 text-xs">
                                    {form.formState.errors.userNameOrEmail.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-sm text-slate-700">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    {...form.register("password")}
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    className="p-2.5 pr-10 w-full bg-slate-50 rounded-xl border border-slate-200 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-red-500 text-xs">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.
                        </p>
                    )}

                    <div className="flex items-center justify-between text-xs md:text-sm">
                        <button
                            onClick={handleForgotPassword}
                            type="button"
                            className="text-slate-500 hover:text-emerald-600 hover:underline"
                        >
                            Quên mật khẩu?
                        </button>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500">
                                Chưa có tài khoản?
                            </span>
                            <button
                                type="button"
                                onClick={handleClick}
                                className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                                Đăng ký ngay
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7FBB35]
                                   px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30
                                   hover:bg-[#598325] focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-offset-2 focus-visible:ring-emerald-500
                                   disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>
            </div>

            {/* Right: Brand / marketing panel (hidden on mobile) */}
            <div className="relative hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-[#7FBB35] via-[#5f9f2a] to-[#3b6b1a] px-10 py-12 text-center">
                <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-900/20 blur-3xl" />

                <div className="relative z-10 max-w-md">
                    <h2 className="text-white text-3xl lg:text-4xl font-semibold leading-snug mb-4">
                        Chào mừng đến với
                        <br />
                        Hệ thống Quản lý Kho Nông Sản
                    </h2>

                    <p className="text-white/90 text-sm lg:text-base mb-10">
                        Theo dõi tồn kho chính xác, tối ưu quy trình nhập – xuất
                        và nâng cao hiệu suất vận hành cho doanh nghiệp nông sản của bạn.
                    </p>

                    <button
                        type="button"
                        className="w-[260px] lg:w-[280px] py-2.5 text-sm lg:text-base font-medium text-emerald-900
                                   bg-white hover:bg-slate-50
                                   rounded-xl shadow-lg shadow-emerald-900/30
                                   focus:outline-none focus:ring-2 focus:ring-white/70
                                   transition-all"
                        onClick={handleClick}
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : "Tạo tài khoản mới"}
                    </button>
                </div>
            </div>
        </div>
    );
}