import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { ROUTES } from "../../constants/routes";
import { usePublicLayout } from "../../hooks/usePublicLayout";

export default function PublicTopBar() {
    const { isLoggedIn, hasDashboard, dashboardPath } = usePublicLayout();

    return (
        <div className="bg-[#1a5f2a] text-white text-sm overflow-hidden">
            <style>{`
                @keyframes marquee-bam {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 overflow-hidden flex items-center h-6">
                    <div
                        className="inline-flex items-center font-medium whitespace-nowrap gap-16 leading-none"
                        style={{ animation: "marquee-bam 18s linear infinite" }}
                    >
                        <span className="align-middle">AgriIDMS — Hệ thống quản lý kho phân phối hoa quả</span>
                        <span className="align-middle">AgriIDMS — Hệ thống quản lý kho phân phối hoa quả</span>
                    </div>
                </div>
                {!isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        <Link to={ROUTES.LOGIN} className="hover:underline">Đăng nhập</Link>
                        <Link to={ROUTES.REGISTER} className="hover:underline">Đăng ký</Link>
                    </div>
                ) : hasDashboard ? (
                    <Link to={dashboardPath!} className="hover:underline flex items-center gap-1">
                        <LayoutDashboard size={14} /> Vào hệ thống
                    </Link>
                ) : null}
            </div>
        </div>
    );
}