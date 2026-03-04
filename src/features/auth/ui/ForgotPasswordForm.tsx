import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    forgotPasswordSchema,
    type ForgotPasswordFormValues,
} from "../schemas/forgot-password.schema";
import { useForgotPasswordMutation } from "../api/auth.api";
import { toast } from "react-hot-toast";
import "../styles/ForgotPasswordForm.css";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordForm() {
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
    const [isFocused, setIsFocused] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();


    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const emailValue = watch("email");

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        try {
            const res = await forgotPassword(data).unwrap();
            setSubmitted(true);
            toast.success(res.message || "Email đặt lại mật khẩu đã được gửi!", {
                duration: 4000,
                style: {
                    background: "#f0fdf4",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    fontWeight: "500",
                    fontSize: "14px",
                },
                iconTheme: { primary: "#74B230", secondary: "#fff" },
            });
        } catch (error: any) {
            toast.error(error?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.", {
                duration: 4000,
                style: {
                    background: "#fff5f5",
                    color: "#c53030",
                    border: "1px solid #fed7d7",
                    fontWeight: "500",
                    fontSize: "14px",
                },
            });
        }
    };
    const handleForgotPassword = () => {
        navigate("/login");
    };
    const { ref, onBlur: onBlurRegister, ...rest } = register("email");

    return (
        <>

            <div className="fp-wrapper">
                <div className="fp-container">

                    <div className="fp-badge">

                    </div>

                    <div className="fp-card">
                        {submitted ? (
                            <div className="fp-success-wrap">
                                <div className="fp-success-icon">
                                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                                        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="fp-success-title">Email đã được gửi!</div>
                                <p className="fp-success-text">
                                    Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{" "}
                                    <span className="fp-success-email">{emailValue}</span>.<br />
                                    Vui lòng kiểm tra hộp thư của bạn.
                                    <button className="fp-back-link" onClick={handleForgotPassword}>
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                                        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Quay lại đăng nhập
                                </button>
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="fp-icon-wrap">
                                    <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>

                                <h2 className="fp-title">Forgot Password?</h2>
                                <p className="fp-subtitle">
                                    Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn để đặt lại mật khẩu.
                                </p>

                                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                                    <label className="fp-label">Địa chỉ Email</label>
                                    <div
                                        className={[
                                            "fp-input-wrap",
                                            isFocused ? "focused" : "",
                                            emailValue ? "has-value" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    >
                                        <span className="fp-input-icon">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" />
                                                <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        </span>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            className={`fp-input${errors.email ? " error" : ""}`}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={(e) => {
                                                setIsFocused(false);
                                                onBlurRegister(e);
                                            }}
                                            ref={ref}
                                            {...rest}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="fp-error">
                                            <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.email.message}
                                        </p>
                                    )}

                                    <button type="submit" disabled={isLoading} className="fp-btn">
                                        {isLoading ? (
                                            <>
                                                <span className="fp-spinner" />
                                                Đang gửi...
                                            </>
                                        ) : (
                                            <>
                                                Gửi hướng dẫn đặt lại
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                                    <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="fp-divider">
                                    <div className="fp-divider-line" />
                                    <span className="fp-divider-text">hoặc</span>
                                    <div className="fp-divider-line" />
                                </div>

                                <button className="fp-back-link" onClick={handleForgotPassword}>
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                                        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>


                                    Quay lại đăng nhập
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}