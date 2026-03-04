import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ChangePasswordSchema, type ChangePasswordDto } from "../schemas/profile.schema";
import { useChangePasswordMutation } from "../api/profile.api";

const inputStyle: React.CSSProperties = {
  padding: "10px 13px", fontSize: "13.5px", color: "#111827",
  background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "9px",
  outline: "none", width: "100%", boxSizing: "border-box",
  transition: "all 0.15s", fontFamily: "inherit",
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

const EyeIcon = ({ show }: { show: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {show ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

const ChangePasswordCard = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const form = useForm<ChangePasswordDto>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordDto) => {
    try {
      const res = await changePassword(data).unwrap();
      toast.success(res.message || "Password changed successfully!");
      form.reset();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  const makePasswordField = (
    fieldName: "currentPassword" | "newPassword",
    show: boolean,
    toggle: () => void,
    error?: string
  ) => (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder="••••••••"
        {...form.register(fieldName)}
        style={{
          ...inputStyle,
          paddingRight: "38px",
          borderColor: error ? "#ef4444" : "#e5e7eb",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "#7FBB35";
          e.target.style.boxShadow = `0 0 0 3px ${error ? "rgba(239,68,68,0.1)" : "rgba(127,187,53,0.1)"}`;
          e.target.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "#e5e7eb";
          e.target.style.boxShadow = "none";
          e.target.style.background = "#f9fafb";
        }}
      />
      <button
        type="button"
        onClick={toggle}
        style={{
          position: "absolute", right: "11px", top: "50%",
          transform: "translateY(-50%)", background: "none",
          border: "none", cursor: "pointer", color: "#9ca3af",
          padding: 0, display: "flex",
        }}
      >
        <EyeIcon show={show} />
      </button>
      {error && (
        <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );

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
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
          Change Password
        </h2>
      </div>

      {/* Body */}
      <div style={{ padding: "1.4rem 1.5rem" }}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Current Password">
              {makePasswordField(
                "currentPassword",
                showCurrent,
                () => setShowCurrent((v) => !v),
                form.formState.errors.currentPassword?.message
              )}
            </Field>
            <Field label="New Password">
              {makePasswordField(
                "newPassword",
                showNew,
                () => setShowNew((v) => !v),
                form.formState.errors.newPassword?.message
              )}
            </Field>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "9px 20px",
                background: isLoading ? "#d1d5db" : "linear-gradient(135deg, #1e293b, #2d3f55)",
                color: "#fff", fontWeight: 700, fontSize: "12.5px",
                border: "none", borderRadius: "8px",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: isLoading ? "none" : "0 3px 10px rgba(30,41,59,0.25)",
                transition: "all 0.2s", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 5px 14px rgba(30,41,59,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isLoading ? "none" : "0 3px 10px rgba(30,41,59,0.25)";
              }}
            >
              {isLoading ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Updating...
                </>
              ) : "Update Password"}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ChangePasswordCard;