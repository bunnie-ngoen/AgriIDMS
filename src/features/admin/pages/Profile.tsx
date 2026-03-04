import React from "react";
import UserBanner from "../components/UserBanner";
import PersonalInfoCard from "../components/PersonalInfoCard";
import ChangePasswordCard from "../components/ChangePasswordCard";
import type { ProfileUser } from "../types/profile.type";

// ── Hardcoded user — thay bằng API call nếu cần sau ─────────────
const CURRENT_USER: ProfileUser = {
  name: "Admin User",
  email: "admin@agriidms.com",
  role: "Administrator",
  department: "Management",
  joined: "January 2024",
  avatar: "AU",
};
// ────────────────────────────────────────────────────────────────

const Profile = () => (
  <div style={{
    width: "100%",
    padding: "1.25rem 2rem 2rem",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    boxSizing: "border-box",
  }}>
    {/* Page title */}
    <div>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e293b", margin: 0, letterSpacing: "-0.02em" }}>
        My Profile
      </h1>
      <p style={{ fontSize: "13px", color: "#9ca3af", margin: "3px 0 0" }}>
        Manage your account information and security
      </p>
    </div>

    <UserBanner user={CURRENT_USER} />
    <PersonalInfoCard user={CURRENT_USER} />
    <ChangePasswordCard />
  </div>
);

export default Profile;