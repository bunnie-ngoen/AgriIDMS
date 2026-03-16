import { Link } from "react-router-dom";
import { Leaf, Phone, Mail, MapPin } from "lucide-react";
import { ROUTES } from "../../constants/routes";

export default function PublicFooter() {
    return (
        <footer id="lien-he" className="bg-slate-900 text-slate-300 scroll-mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Leaf size={24} className="text-[#4ade80]" />
                            <span className="font-bold text-white text-lg">AgriIDMS</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            Hệ thống quản lý kho và phân phối hoa quả — từ nông trại đến điểm bán.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-3">Liên kết</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to={ROUTES.HOME} className="hover:text-white">Trang chủ</Link></li>
                            <li><Link to={ROUTES.GIOI_THIEU} className="hover:text-white">Giới thiệu</Link></li>
                            <li><Link to={ROUTES.LOGIN} className="hover:text-white">Đăng nhập</Link></li>
                            <li><Link to={ROUTES.REGISTER} className="hover:text-white">Đăng ký</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-3">Liên hệ</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><Phone size={14} /> 0834 70 11 55</li>
                            <li className="flex items-center gap-2"><Mail size={14} /> agriidms@example.com</li>
                            <li className="flex items-center gap-2"><MapPin size={14} /> TP. Hồ Chí Minh</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-3">Hệ thống</h4>
                        <p className="text-sm text-slate-400">
                            Quản lý kho • Đơn mua hàng • Phiếu nhập xuất • Truy xuất nguồn gốc
                        </p>
                    </div>
                </div>
                <div className="mt-10 pt-8 border-t border-slate-700 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} AgriIDMS — Quản lý kho phân phối hoa quả. Toàn bộ bản quyền thuộc AgriIDMS.
                </div>
            </div>
        </footer>
    );
}