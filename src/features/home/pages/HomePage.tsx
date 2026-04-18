import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, ShieldCheck, Leaf, LogIn, UserPlus, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppSelector } from "../../../app/hook";
import { selectIsLoggedIn } from "../../auth/selectors/auth.selectors";
import { useAuth } from "../../auth/hooks/useAuth";
import { ROLE_DASHBOARD_MAP, ROLES_WITH_DASHBOARD } from "../../auth/constants/auth.constants";
import type { UserRole } from "../../auth/constants/auth.constants";
import { ROUTES } from "../../../shared/constants/routes";
import ProductsSection from "../components/ProductsSection";

const trustReasons = [
    { icon: ShieldCheck, title: "Uy tín chất lượng", desc: "Hệ thống quản lý chuyên nghiệp, phù hợp doanh nghiệp phân phối hoa quả." },
    { icon: Package, title: "Quản lý tập trung", desc: "Tồn kho, đơn hàng, nhập xuất — một nền tảng thống nhất." },
    { icon: Leaf, title: "Truy xuất nguồn gốc", desc: "QR code, lô hàng, từ nông trại đến điểm bán." },
    { icon: Truck, title: "Nhanh chóng chính xác", desc: "Theo dõi đơn mua, phiếu nhập xuất, giao hàng theo vai trò." },
];

const BANNER_BASE = "https://minhphuongfruit.com";
const BANNER_IMAGES = [
    `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/happy-women-day_banner-5497.jpg`,
    `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/valentine_banner-9715.jpg`,
    `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/tet-binh-ngo_banner-01-1455.jpg`,
    `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/banner-hop-qua-1041.jpg`,
    `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/nho-xanh-uc_banner-7495.jpg`,
    `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/cherry-01-5316.jpg`,
];
const BANNER_INTERVAL_MS = 5000;

export default function HomePage() {
    const isLoggedIn = useAppSelector(selectIsLoggedIn);
    const auth = useAuth();
    const role = auth.user?.roles?.[0] as UserRole | undefined;
    const hasDashboard = isLoggedIn && role != null && ROLES_WITH_DASHBOARD.includes(role);
    const dashboardPath = role ? ROLE_DASHBOARD_MAP[role] : null;

    const [bannerIndex, setBannerIndex] = useState(0);
    useEffect(() => {
        if (isLoggedIn) return;
        const timer = setInterval(() => {
            setBannerIndex((i) => (i + 1) % BANNER_IMAGES.length);
        }, BANNER_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [isLoggedIn]);

    return (
        <>
            {/* Banner carousel — chỉ khách chưa đăng nhập */}
            {!isLoggedIn && (
                <section className="relative w-full overflow-hidden bg-slate-100">
                    <div className="relative w-full aspect-[1920/500] min-h-[280px] max-h-[420px] sm:min-h-[320px]">
                        {BANNER_IMAGES.map((src, i) => (
                            <div
                                key={src}
                                className="absolute inset-0 w-full transition-opacity duration-600 ease-in-out"
                                style={{ opacity: i === bannerIndex ? 1 : 0, zIndex: i === bannerIndex ? 1 : 0 }}
                            >
                                <img src={src} alt="" className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" />
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        aria-label="Banner trước"
                        onClick={() => setBannerIndex((i) => (i - 1 + BANNER_IMAGES.length) % BANNER_IMAGES.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        type="button"
                        aria-label="Banner sau"
                        onClick={() => setBannerIndex((i) => (i + 1) % BANNER_IMAGES.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {BANNER_IMAGES.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Banner ${i + 1}`}
                                onClick={() => setBannerIndex(i)}
                                className={`h-2 rounded-full transition-all ${i === bannerIndex ? "w-6 bg-white shadow" : "w-2 bg-white/60 hover:bg-white/80"}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Hero */}
            <section className="bg-gradient-to-b from-[#e8f5e9] to-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                        QUẢN LÝ KHO PHÂN PHỐI <span className="text-[#1a5f2a]">HOA QUẢ</span> TẬP TRUNG
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                        Tất cả quy trình từ mua hàng, nhập kho, quản lý sản phẩm đến phân phối — một hệ thống duy nhất.
                    </p>
                    {!isLoggedIn ? (
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                to={ROUTES.LOGIN}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors shadow-md hover:shadow-lg"
                            >
                                <LogIn size={20} />
                                Đăng nhập
                            </Link>
                            <Link
                                to={ROUTES.REGISTER}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-[#1a5f2a] bg-white border-2 border-[#1a5f2a] hover:bg-[#e8f5e9] transition-colors"
                            >
                                <UserPlus size={20} />
                                Tạo tài khoản
                            </Link>
                        </div>
                    ) : hasDashboard ? (
                        <div className="mt-10">
                            <Link
                                to={dashboardPath!}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors shadow-md hover:shadow-lg"
                            >
                                <LayoutDashboard size={20} />
                                Vào hệ thống
                            </Link>
                        </div>
                    ) : null}
                </div>
            </section>

            <ProductsSection />

            {/* Vì sao chọn */}
            <section id="vi-sao-chon" className="py-16 bg-slate-50 border-t border-slate-200 scroll-mt-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center uppercase tracking-wide">
                        Vì sao chọn AgriIDMS
                    </h2>
                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {trustReasons.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="text-center">
                                    <div className="inline-flex h-16 w-16 rounded-full bg-white border-2 border-[#1a5f2a]/20 items-center justify-center text-[#1a5f2a] mb-4">
                                        <Icon size={28} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-600">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}