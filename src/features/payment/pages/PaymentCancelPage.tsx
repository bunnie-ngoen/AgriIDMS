import { Link } from "react-router-dom";
import { CircleX } from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";

export default function PaymentCancelPage() {
    return (
        <section className="min-h-[70vh] bg-gradient-to-b from-rose-50 to-white">
            <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
                <CircleX className="h-16 w-16 text-rose-600" />
                <h1 className="mt-6 text-2xl font-bold text-slate-900">Bạn đã hủy thanh toán</h1>
                <p className="mt-3 text-sm text-slate-600">
                    Đơn hàng vẫn được giữ theo thời hạn hiện tại. Bạn có thể quay lại đơn để tạo lại thanh toán.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        to={ROUTES.HOME}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Về trang chủ
                    </Link>
                    <Link
                        to={ROUTES.SALES_ORDERS}
                        className="rounded-lg bg-[#1a5f2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#145026]"
                    >
                        Quay lại xử lý đơn
                    </Link>
                </div>
            </div>
        </section>
    );
}
