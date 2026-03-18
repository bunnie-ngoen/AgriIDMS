import { Link } from "react-router-dom";
import { Package, ShoppingCart, Home } from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";

/**
 * Trang "Đơn hàng của tôi" – dành cho khách hàng xem lại đơn đã đặt.
 * Hiện tại BE chưa có API GET my-orders nên chỉ hiển thị placeholder.
 * Khi BE thêm endpoint (vd: GET api/Orders/me), gắn useGetMyOrdersQuery và hiển thị danh sách.
 */
export default function MyOrdersPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Package className="text-[#1a5f2a]" size={28} />
                Đơn hàng của tôi
            </h1>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                    <Package size={32} />
                </div>
                <p className="text-slate-600 mb-2">
                    Bạn có thể xem lại các đơn hàng đã đặt tại đây.
                </p>
                <p className="text-slate-500 text-sm mb-6">
                    Danh sách đơn hàng sẽ hiển thị khi bạn có đơn. Sau khi đặt hàng thành công, đơn của bạn đã được ghi nhận và sẽ được xử lý.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link
                        to={ROUTES.HOME}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                    >
                        <Home size={18} />
                        Về trang chủ
                    </Link>
                    <Link
                        to={ROUTES.CART}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a5f2a] text-white font-medium hover:bg-[#145026]"
                    >
                        <ShoppingCart size={18} />
                        Giỏ hàng
                    </Link>
                </div>
            </div>
        </div>
    );
}
