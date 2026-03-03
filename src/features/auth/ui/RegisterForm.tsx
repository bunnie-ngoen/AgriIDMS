import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "../schemas/register.schema";
import { useRegisterCustomerMutation } from "../api/auth.api";
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [registerCustomer, { isLoading, isSuccess, error }] =
    useRegisterCustomerMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerCustomer(values).unwrap();
      navigate("/login");
    } catch (e) {
      console.error("Register failed:", e);
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/10">
      {/* Left: Info / brand panel */}
      <div className="relative hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-[#7FBB35] via-[#5f9f2a] to-[#3b6b1a] px-10 py-12 text-center">
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-900/20 blur-3xl" />

        <div className="relative z-10 max-w-md">
          <h2 className="text-white text-3xl lg:text-4xl font-semibold leading-snug mb-4">
            Tạo tài khoản khách hàng
          </h2>

          <p className="text-white/90 text-sm lg:text-base mb-10">
            Đăng ký tài khoản để theo dõi tồn kho, tra cứu đơn hàng và quản lý
            thông tin giao nhận nông sản của bạn.
          </p>

          <button
            type="button"
            className="w-[260px] lg:w-[280px] py-2.5 text-sm lg:text-base font-medium text-emerald-900
                       bg-white hover:bg-slate-50
                       rounded-xl shadow-lg shadow-emerald-900/30
                       focus:outline-none focus:ring-2 focus:ring-white/70
                       transition-all"
            onClick={() => navigate("/login")}
            disabled={isLoading}
          >
            Đã có tài khoản? Đăng nhập
          </button>
        </div>
      </div>

      {/* Right: Register form */}
      <div className="px-8 py-10 md:px-10 md:py-12 lg:px-12 lg:py-14 flex items-center">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-md mx-auto space-y-5"
        >
          <div className="space-y-2">
            <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 mb-1">
              Đăng ký khách hàng mới
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Tạo tài khoản AgriIDMS
            </h1>
            <p className="text-sm text-slate-500">
              Điền thông tin bên dưới để tạo tài khoản. Những trường có dấu * là
              bắt buộc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-xs md:text-sm text-slate-700">
                User name *
              </label>
              <input
                {...form.register("userName")}
                placeholder="username"
                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              />
              {form.formState.errors.userName && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.userName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-xs md:text-sm text-slate-700">
                Họ và tên *
              </label>
              <input
                {...form.register("fullName")}
                placeholder="Nguyễn Văn A"
                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              />
              {form.formState.errors.fullName && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-xs md:text-sm text-slate-700">
                Email
              </label>
              <input
                {...form.register("email")}
                type="email"
                placeholder="you@example.com"
                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-xs md:text-sm text-slate-700">
                Số điện thoại *
              </label>
              <input
                {...form.register("phoneNumber")}
                placeholder="0901234567"
                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-xs md:text-sm text-slate-700">
                Mật khẩu *
              </label>
              <input
                {...form.register("password")}
                type="password"
                placeholder="••••••••"
                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              />
              {form.formState.errors.password && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-xs md:text-sm text-slate-700">
                Xác nhận mật khẩu *
              </label>
              <input
                {...form.register("confirmPassword")}
                type="password"
                placeholder="Nhập lại mật khẩu"
                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-xs md:text-sm text-slate-700">
                Giới tính *
              </label>
              <select
                {...form.register("gender")}
                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
              {form.formState.errors.gender && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.gender.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-xs md:text-sm text-slate-700">
                Ngày sinh
              </label>
              <input
                {...form.register("dob")}
                type="date"
                className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
              />
              {form.formState.errors.dob && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.dob.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-xs md:text-sm text-slate-700">
              Địa chỉ
            </label>
            <textarea
              {...form.register("address")}
              rows={2}
              placeholder="Địa chỉ giao nhận"
              className="p-2.5 w-full bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 resize-none"
            />
            {form.formState.errors.address && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          {error && !isSuccess && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.
            </p>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7FBB35]
                       px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30
                       hover:bg-[#598325] focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-offset-2 focus-visible:ring-emerald-500
                       disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;