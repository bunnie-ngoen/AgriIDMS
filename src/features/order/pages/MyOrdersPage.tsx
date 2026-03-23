import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";
import { useGetMyOrdersQuery } from "../api/order.api";

function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

export default function MyOrdersPage() {
    const { data, isLoading, isError, refetch } = useGetMyOrdersQuery();
    const orders = data ?? [];

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList size={22} />
                Đơn hàng của tôi
            </h1>

            {isLoading ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Đang tải đơn hàng...</div>
            ) : isError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-6">
                    <p className="text-red-700">Không tải được danh sách đơn hàng.</p>
                    <button onClick={() => refetch()} className="mt-2 text-sm text-red-700 hover:underline">Thử lại</button>
                </div>
            ) : orders.length === 0 ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Bạn chưa có đơn hàng nào.</div>
            ) : (
                <div className="mt-4 space-y-3">
                    {orders.map((o) => (
                        <Link
                            key={o.orderId}
                            to={ROUTES.CUSTOMER_ORDER_DETAIL.replace(":id", String(o.orderId))}
                            className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[#1a5f2a]/40"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="font-semibold text-slate-900">Đơn #{o.orderId}</p>
                                <p className="text-sm text-slate-600">{new Date(o.createdAt).toLocaleString("vi-VN")}</p>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                <p>Trạng thái: <span className="font-semibold">{o.status}</span></p>
                                <p>Số dòng: <span className="font-semibold">{o.itemCount}</span></p>
                                <p>Tổng tiền: <span className="font-semibold">{vnd(o.totalAmount)} ₫</span></p>
                                <p>Payment: <span className="font-semibold">{o.latestPaymentStatus ?? "N/A"}</span></p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

