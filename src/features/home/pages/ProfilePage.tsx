import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  Check,
  AlertCircle,
  Save,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";
import {
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "../../admin/api/profile.api";

export default function ProfilePage() {
  const location = useLocation();
  const { data: user, isLoading } = useGetMyProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword] = useChangePasswordMutation();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [profileStatus, setProfileStatus] = useState<"idle" | "success" | "error">("idle");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    dob: "",
    gender: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        dob: user.dob ? user.dob.substring(0, 10) : "",
        gender: user.gender ?? true,
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await updateProfile({ id: user.id, ...profileForm }).unwrap();
      setProfileStatus("success");
      setTimeout(() => setProfileStatus("idle"), 3000);
    } catch {
      setProfileStatus("error");
      setTimeout(() => setProfileStatus("idle"), 3000);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus("error");
      setTimeout(() => setPasswordStatus("idle"), 3000);
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      setPasswordStatus("success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordStatus("idle"), 3000);
    } catch {
      setPasswordStatus("error");
      setTimeout(() => setPasswordStatus("idle"), 3000);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const isEmbeddedInDashboard =
    location.pathname.startsWith("/admin/") ||
    location.pathname.startsWith("/warehouse/") ||
    location.pathname.startsWith("/sales/") ||
    location.pathname.startsWith("/purchase-staff/");

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#1a5f2a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isEmbeddedInDashboard ? "" : "bg-gradient-to-b from-slate-50 to-white"}>
      <div
        className={
          isEmbeddedInDashboard
            ? "w-full"
            : "max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
        }
      >

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link to={ROUTES.HOME} className="hover:text-[#1a5f2a] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={16} className="text-slate-300" />
          <span className="text-slate-700 font-medium">Thông tin cá nhân</span>
        </nav>

        {/* Page title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-8">
          Tài khoản của tôi
        </h1>

        {/* Profile header card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#1a5f2a] to-[#145026] px-6 sm:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border-2 border-white/40">
                {user?.fullName ? getInitials(user.fullName) : "?"}
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">
                  {user?.fullName || "—"}
                </h2>
                <p className="text-white/90 text-sm mt-0.5 truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
              activeTab === "profile"
                ? "border-[#1a5f2a] text-[#1a5f2a] bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <User size={18} />
            Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
              activeTab === "security"
                ? "border-[#1a5f2a] text-[#1a5f2a] bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Lock size={18} />
            Bảo mật
          </button>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Tab: Profile */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="p-6 sm:p-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
                Thông tin tài khoản
              </p>

              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <Mail size={14} className="text-slate-400" />
                    Email
                  </label>
                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <User size={14} className="text-slate-400" />
                      Họ tên
                    </label>
                    <input
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/20 outline-none transition"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Phone size={14} className="text-slate-400" />
                      Số điện thoại
                    </label>
                    <input
                      name="phoneNumber"
                      value={profileForm.phoneNumber}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/20 outline-none transition"
                      placeholder="0901 234 567"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    Địa chỉ
                  </label>
                  <input
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/20 outline-none transition"
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={profileForm.dob}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/20 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Giới tính</label>
                    <select
                      value={profileForm.gender ? "male" : "female"}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, gender: e.target.value === "male" }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/20 outline-none transition"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                <div className="min-h-[40px] flex items-center">
                  {profileStatus === "success" && (
                    <p className="flex items-center gap-2 text-sm font-medium text-[#1a5f2a]">
                      <Check size={18} />
                      Cập nhật thông tin thành công!
                    </p>
                  )}
                  {profileStatus === "error" && (
                    <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                      <AlertCircle size={18} />
                      Cập nhật thất bại. Vui lòng thử lại.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] shadow-md hover:shadow-lg transition-all"
                >
                  <Save size={18} />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {/* Tab: Security */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordSubmit} className="p-6 sm:p-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Shield size={14} />
                Đổi mật khẩu
              </p>

              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <Lock size={14} className="text-slate-400" />
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/20 outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      aria-label={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/20 outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordForm.newPassword.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      {passwordForm.newPassword.length < 6
                        ? "Mật khẩu yếu — nên từ 8 ký tự trở lên"
                        : passwordForm.newPassword.length < 9
                          ? "Độ mạnh: trung bình"
                          : "Độ mạnh: tốt"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/20 outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword.length > 0 &&
                    passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Mật khẩu xác nhận không khớp
                      </p>
                    )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                <div className="min-h-[40px] flex items-center">
                  {passwordStatus === "success" && (
                    <p className="flex items-center gap-2 text-sm font-medium text-[#1a5f2a]">
                      <Check size={18} />
                      Đổi mật khẩu thành công!
                    </p>
                  )}
                  {passwordStatus === "error" && (
                    <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                      <AlertCircle size={18} />
                      {passwordForm.newPassword !== passwordForm.confirmPassword
                        ? "Mật khẩu xác nhận không khớp."
                        : "Đổi mật khẩu thất bại."}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
                >
                  <Lock size={18} />
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
