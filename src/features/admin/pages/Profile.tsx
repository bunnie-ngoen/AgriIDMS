import UserBanner from "../components/UserBanner";
import PersonalInfoCard from "../components/PersonalInfoCard";
import ChangePasswordCard from "../components/ChangePasswordCard";
import { profileApi } from "../api/profile.api";

const Profile = () => {
  const { data: user, isLoading, isError } = profileApi.useGetMyProfileQuery();
  console.log(user)

  if (isLoading) return <div>Đang tải...</div>;
  if (isError || !user) return <div>Không tải được thông tin hồ sơ.</div>;

  return (
    <div style={{
      width: "100%",
      padding: "1.25rem 2rem 2rem",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      boxSizing: "border-box",
    }}>
      <div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e293b", margin: 0, letterSpacing: "-0.02em" }}>
          Thông tin cá nhân
        </h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "3px 0 0" }}>
          Quản lý thông tin tài khoản và bảo mật
        </p>
      </div>

      <UserBanner user={user} />
      <PersonalInfoCard user={user} />
      <ChangePasswordCard />
    </div>
  );
};

export default Profile;