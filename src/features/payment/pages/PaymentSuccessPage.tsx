import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";

export default function PaymentSuccessPage() {
    return (
        <section className="min-h-[70vh] bg-gradient-to-b from-emerald-50 to-white">
            <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                <h1 className="mt-6 text-2xl font-bold text-slate-900">Thanh toán thành công</h1>
                <p className="mt-3 text-sm text-slate-600">
                    Hệ thống đã nhận kết quả thanh toán. Nếu trạng thái đơn chưa cập nhật ngay, vui lòng chờ vài giây rồi tải lại.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        to={ROUTES.HOME}
                        className="rounded-lg bg-[#1a5f2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#145026]"
                    >
                        Về trang chủ
                    </Link>
                    <Link
                        to={ROUTES.SALES_ORDERS}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Mở danh sách đơn
                    </Link>
                </div>
            </div>
        </section>
    );
}
