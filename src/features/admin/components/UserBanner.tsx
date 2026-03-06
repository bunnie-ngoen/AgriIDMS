import React from "react";
import type { ProfileUser } from "../types/profile.type";

interface Props {
  user: ProfileUser;
}

const UserBanner = ({ user }: Props) => (
  <div
    style={{
      background: "linear-gradient(135deg, #1e293b 0%, #2d3f55 100%)",
      borderRadius: "14px",
      padding: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "1.1rem",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div style={{
      position: "absolute", top: "-30px", right: "-30px",
      width: "110px", height: "110px", borderRadius: "50%",
      background: "rgba(255,255,255,0.04)",
    }} />
    <div style={{
      position: "absolute", bottom: "-20px", right: "60px",
      width: "70px", height: "70px", borderRadius: "50%",
      background: "rgba(255,255,255,0.04)",
    }} />

    {/* Avatar */}
    <div style={{
      width: "56px", height: "56px", borderRadius: "14px",
      background: "linear-gradient(135deg, #7FBB35, #5c9020)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "18px", fontWeight: 800, color: "#fff", flexShrink: 0,
      letterSpacing: "-0.02em", boxShadow: "0 4px 12px rgba(127,187,53,0.4)",
    }}>
      {user.email.charAt(0).toUpperCase()}
    </div>

    <div style={{ flex: 1, position: "relative" }}>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
        {user.fullName ?? "Unknown User"}
      </div>
      <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
        {user.email}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
        {[user.userType == "0" ? "Admin" : "User", user.status].map((tag) => (
          <span key={tag} style={{
            padding: "3px 9px", borderRadius: "20px", fontSize: "11px",
            fontWeight: 600, background: "rgba(127,187,53,0.2)", color: "#a8d96a",
            letterSpacing: "0.01em",
          }}>
            {tag}
          </span>
        ))}
        <span style={{
          padding: "3px 9px", borderRadius: "20px", fontSize: "11px",
          fontWeight: 600, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
        }}>
          Since {new Date(user.createdAt).getFullYear()}
        </span>
      </div>
    </div>
  </div>
);

export default UserBanner;