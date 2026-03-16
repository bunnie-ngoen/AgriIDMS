import { useEffect, useState } from "react";
import {
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "../../../features/admin/api/profile.api";

export default function ProfilePage() {
  const { data: user, isLoading } = useGetMyProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword] = useChangePasswordMutation();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [profileStatus, setProfileStatus] = useState<"idle" | "success" | "error">("idle");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle");

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap');
        .profile-root { font-family: 'Be Vietnam Pro', sans-serif; }
        .input-field {
          width: 100%;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: 'Be Vietnam Pro', sans-serif;
          color: #111827;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .input-field:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5,150,105,0.1);
        }
        .input-field:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }
        .tab-btn {
          position: relative;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .tab-btn.active { color: #059669; }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: #059669;
          border-radius: 2px 2px 0 0;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #059669;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Be Vietnam Pro', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(5,150,105,0.25);
        }
        .btn-primary:hover { background: #047857; box-shadow: 0 4px 14px rgba(5,150,105,0.35); }
        .btn-primary:active { transform: scale(0.98); }
        .btn-blue {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Be Vietnam Pro', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        }
        .btn-blue:hover { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
        .btn-blue:active { transform: scale(0.98); }
        .toast-success {
          display: flex; align-items: center; gap: 8px;
          background: #ecfdf5; color: #065f46;
          border: 1px solid #a7f3d0;
          border-radius: 10px; padding: 10px 16px;
          font-size: 13px; font-weight: 500;
          animation: fadeInUp 0.3s ease;
        }
        .toast-error {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 10px; padding: 10px 16px;
          font-size: 13px; font-weight: 500;
          animation: fadeInUp 0.3s ease;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card { background: #fff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04); }
        .avatar-ring {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #059669, #10b981);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 700; color: #fff;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(5,150,105,0.3);
        }
        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: #f0fdf4; color: #059669;
          border: 1px solid #bbf7d0;
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 12px; font-weight: 500;
        }
        .section-label {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #9ca3af; margin-bottom: 12px;
        }
        .strength-bar { height: 4px; border-radius: 2px; flex: 1; background: #e5e7eb; overflow: hidden; }
        .strength-fill { height: 100%; border-radius: 2px; transition: width 0.4s, background 0.4s; }
      `}</style>

      <div className="profile-root max-w-3xl mx-auto space-y-6">

        {/* ── HEADER CARD ── */}
        <div className="card p-6 flex items-center gap-5">
          <div className="avatar-ring">
            {user?.fullName ? getInitials(user.fullName) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {user?.fullName || "—"}
              </h1>
              <span className="badge">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <circle cx="5" cy="5" r="5" />
                </svg>
                Hoạt động
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-gray-100 px-2">
            <button className={`tab-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
              <span className="flex items-center gap-2">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                </svg>
                Thông tin cá nhân
              </span>
            </button>
            <button className={`tab-btn ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
              <span className="flex items-center gap-2">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Bảo mật
              </span>
            </button>
          </div>

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
              <p className="section-label">Thông tin tài khoản</p>

              {/* Email (readonly) */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <input value={user?.email || ""} disabled className="input-field pl-10" />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>
                  </svg>
                </div>
              </div>

              {/* Họ tên + Điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                  <input name="fullName" value={profileForm.fullName} onChange={handleProfileChange} className="input-field" placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input name="phoneNumber" value={profileForm.phoneNumber} onChange={handleProfileChange} className="input-field" placeholder="0901 234 567" />
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <input name="address" value={profileForm.address} onChange={handleProfileChange} className="input-field" placeholder="123 Đường ABC, Quận 1, TP.HCM" />
              </div>

              {/* Ngày sinh + Giới tính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                  <input type="date" name="dob" value={profileForm.dob} onChange={handleProfileChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                  <select
                    value={profileForm.gender ? "male" : "female"}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value === "male" }))}
                    className="input-field"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Status + Submit */}
              <div className="flex items-center justify-between pt-2 gap-4 flex-wrap">
                <div className="flex-1">
                  {profileStatus === "success" && (
                    <div className="toast-success">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                      Cập nhật thông tin thành công!
                    </div>
                  )}
                  {profileStatus === "error" && (
                    <div className="toast-error">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                      Cập nhật thất bại. Vui lòng thử lại.
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
              <p className="section-label">Đổi mật khẩu</p>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} className="input-field pl-10" placeholder="••••••••" />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                <div className="relative">
                  <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} className="input-field pl-10" placeholder="••••••••" />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                {/* Password strength */}
                {passwordForm.newPassword.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1.5">
                      {[1,2,3,4].map((level) => {
                        const strength = Math.min(4, Math.floor(passwordForm.newPassword.length / 3));
                        const colors = ["#ef4444","#f97316","#eab308","#22c55e"];
                        return (
                          <div key={level} className="strength-bar">
                            <div className="strength-fill" style={{ width: strength >= level ? "100%" : "0%", background: colors[strength - 1] || "#e5e7eb" }} />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400">
                      {passwordForm.newPassword.length < 6 ? "Yếu — thêm ký tự để tăng độ bảo mật" : passwordForm.newPassword.length < 9 ? "Trung bình" : passwordForm.newPassword.length < 12 ? "Mạnh" : "Rất mạnh"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} className="input-field pl-10" placeholder="••••••••" />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    Mật khẩu xác nhận không khớp
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 gap-4 flex-wrap">
                <div className="flex-1">
                  {passwordStatus === "success" && (
                    <div className="toast-success">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                      Đổi mật khẩu thành công!
                    </div>
                  )}
                  {passwordStatus === "error" && (
                    <div className="toast-error">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                      {passwordForm.newPassword !== passwordForm.confirmPassword ? "Mật khẩu xác nhận không khớp." : "Đổi mật khẩu thất bại."}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-blue">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
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