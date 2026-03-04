import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { PersonalInfoForm, ProfileUser } from "../types/profile.type";

const inputStyle: React.CSSProperties = {
  padding: "10px 13px", fontSize: "13.5px", color: "#111827",
  background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "9px",
  outline: "none", width: "100%", boxSizing: "border-box",
  transition: "all 0.15s", fontFamily: "inherit",
};

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed",
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#7FBB35";
    e.target.style.boxShadow = "0 0 0 3px rgba(127,187,53,0.1)";
    e.target.style.background = "#fff";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#e5e7eb";
    e.target.style.boxShadow = "none";
    e.target.style.background = "#f9fafb";
  },
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
    <label style={{
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em",
      textTransform: "uppercase" as const, color: "#6b7280",
    }}>
      {label}
    </label>
    {children}
  </div>
);

interface Props {
  user: ProfileUser;
}

const PersonalInfoCard = ({ user }: Props) => {
  const form = useForm<PersonalInfoForm>({
    defaultValues: { name: user.name, email: user.email },
  });

  const onSubmit = (_data: PersonalInfoForm) => {
    toast.success("Profile updated!");
  };

  return (
    <div style={{
      background: "#fff", borderRadius: "14px", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        padding: "1.1rem 1.5rem", borderBottom: "1px solid #f3f4f6",
        display: "flex", alignItems: "center", gap: "9px",
      }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: "rgba(127,187,53,0.12)", display: "flex",
          alignItems: "center", justifyContent: "center", color: "#5a9422",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
          Personal Information
        </h2>
      </div>

      {/* Body */}
      <div style={{ padding: "1.4rem 1.5rem" }}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Full Name">
              <input {...form.register("name")} style={inputStyle} {...focusHandlers} />
            </Field>
            <Field label="Role">
              <input value={user.role} disabled style={disabledInputStyle} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Email Address">
              <input {...form.register("email")} disabled style={disabledInputStyle} />
            </Field>
            <Field label="Department">
              <input value={user.department} disabled style={disabledInputStyle} />
            </Field>
          </div>

          <div>
            <button
              type="submit"
              style={{
                padding: "9px 20px",
                background: "linear-gradient(135deg, #7FBB35, #5c9020)",
                color: "#fff", fontWeight: 700, fontSize: "12.5px",
                border: "none", borderRadius: "8px", cursor: "pointer",
                boxShadow: "0 3px 10px rgba(127,187,53,0.3)",
                transition: "all 0.2s", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 5px 14px rgba(127,187,53,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 3px 10px rgba(127,187,53,0.3)";
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoCard;