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
    const handleClick =()=>{
        navigate('/register')
    }

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
                navigate('/login');
            }

        } catch (error: any) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="flex w-full h-screen items-center justify-center relative">
            <div className="w-[55%] flex justify-center h-screen items-center">
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-sm">
                    <div className="flex flex-col gap-3">
                        <h1 className="text-3xl font-bold pb-4 text-[#7FBB35]">AgriIDMS</h1>
                        <h5 className="text-md text-gray-400 font-medium">Vui lòng nhập tên đăng nhập hoặc email để đăng nhập</h5>

                        <div className="flex flex-col gap-2">
                            <label className="font-bold">Tên đăng nhập hoặc email</label>
                            <input
                                {...form.register("userNameOrEmail")}
                                placeholder="Username or Email"
                                className="p-2 pr-10 w-full bg-gray-100 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-100"
                                type="text"
                            />
                            {form.formState.errors.userNameOrEmail && (
                                <p className="text-red-500 text-sm">{form.formState.errors.userNameOrEmail.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-bold">Mật Khẩu</label>
                            <div className="relative">
                                <input
                                    {...form.register("password")}
                                    placeholder="Password"
                                    type={showPassword ? "text" : "password"}
                                    className="p-2 pr-10 w-full bg-gray-100 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm">
                                Login failed. Please check your credentials.
                            </p>
                        )}

                        <div>
                            <a href="#" className="float-right text-sm hover:underline">
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="bg-[#7FBB35] p-2 text-center font-medium text-white hover:bg-[#598325] w-full rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? "Loading..." : "Đăng Nhập"}
                        </button>
                    </div>
                </form>
            </div>
            <div className="w-[45%] flex flex-col h-screen items-center justify-center z-50 bg-[#7FBB35] px-10 text-center">
                <h1 className="text-white text-4xl font-semibold leading-snug mb-4">
                    Chào mừng đến với<br />
                    Hệ thống Quản lý Kho Hoa Quả
                </h1>

                <p className="text-white/90 text-lg max-w-md mb-16">
                    Đăng ký tài khoản để theo dõi tồn kho chính xác, tối ưu quy trình nhập – xuất
                    và nâng cao hiệu suất vận hành.
                </p>

                <button
                    type="submit"
                    className="w-[300px] py-3 text-lg font-medium text-white
                   bg-[#87c041] hover:bg-[#598325]
                   rounded-xl shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-white/70
                   disabled:opacity-50 transition-all"
                    disabled={isLoading}
                    onClick={()=>handleClick()}
                >
                    {isLoading ? "Đang xử lý..." : "Đăng ký tài khoản"}
                </button>
            </div>

        </div>
    );
}