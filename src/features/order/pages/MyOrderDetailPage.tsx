import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { useGetMyOrderByIdQuery } from "../api/order.api";
import {
    useCancelPaymentMutation,
    useCreatePaymentMutation,
    useGetLatestPaymentByOrderQuery,
} from "../../payment/api/payment.api";
import { paymentMethodEnum } from "../../payment/schemas/payment.schema";

function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

export default function MyOrderDetailPage() {
    const { id } = useParams();
    const orderId = Number(id);
    const valid = Number.isInteger(orderId) && orderId > 0;
    const { data: order, isLoading, isError, refetch } = useGetMyOrderByIdQuery(orderId, { skip: !valid });

    const { data: latestPayment, refetch: refetchPayment } = useGetLatestPaymentByOrderQuery(orderId, { skip: !valid });
    const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
    const [cancelPayment, { isLoading: isCancelling }] = useCancelPaymentMutation();

    const [paymentMethod, setPaymentMethod] = useState<number>(paymentMethodEnum.COD);
    const [msg, setMsg] = useState<string>("");

    const total = useMemo(() => order?.totalAmount ?? 0, [order?.totalAmount]);

    const onCreatePayment = async () => {
        if (!valid) return;
        setMsg("");
        try {
            const res = await createPayment({ orderId, paymentMethod }).unwrap();
            setMsg(`Đã tạo payment #${res.id} (${res.paymentStatus}).`);
            if (res.checkoutUrl) window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
            await refetchPayment();
            await refetch();
        } catch {
            setMsg("Không tạo được payment. Đơn cần ở trạng thái Confirmed và BE chỉ hỗ trợ COD/Banking.");
        }
    };

    const onCancelPayment = async () => {
        if (!latestPayment?.id) return;
        setMsg("");
        try {
            await cancelPayment(latestPayment.id).unwrap();
            setMsg("Đã hủy payment.");
            await refetchPayment();
            await refetch();
        } catch {
            setMsg("Không hủy được payment hiện tại.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <Link to={ROUTES.CUSTOMER_ORDERS_PAGE} className="text-sm text-slate-600 hover:text-[#1a5f2a]">← Quay lại đơn hàng của tôi</Link>
            {!valid ? (
                <div className="mt-4 text-red-600">OrderId không hợp lệ.</div>
            ) : isLoading ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Đang tải chi tiết đơn...</div>
            ) : isError || !order ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-6">
                    <p className="text-red-700">Không tải được chi tiết đơn hàng.</p>
                    <button onClick={() => refetch()} className="mt-2 text-sm text-red-700 hover:underline">Thử lại</button>
                </div>
            ) : (
                <div className="mt-4 grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <h1 className="text-xl font-bold text-slate-900">Đơn #{order.orderId}</h1>
                            <div className="mt-2 text-sm text-slate-700 flex flex-wrap gap-4">
                                <p>Trạng thái: <span className="font-semibold">{order.status}</span></p>
                                <p>Nguồn: <span className="font-semibold">{order.source}</span></p>
                                <p>Tạo lúc: <span className="font-semibold">{new Date(order.createdAt).toLocaleString("vi-VN")}</span></p>
                                <p>Latest payment: <span className="font-semibold">{order.latestPaymentStatus ?? "N/A"}</span></p>
                            </div>
                        </div>
                        {order.items.map((i, idx) => (
                            <div key={`${i.productVariantId}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="font-semibold text-slate-900">{i.productName}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    {i.isPartial ? "Hộp lẻ" : "Hộp đầy"} - {i.boxWeight}kg · {i.grade}
                                </p>
                                <p className="text-sm mt-2">SL: <span className="font-semibold">{i.quantity}</span> · Đơn giá: <span className="font-semibold">{vnd(i.unitPrice)} ₫</span></p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 h-fit">
                        <h2 className="text-lg font-bold text-slate-900">Thanh toán</h2>
                        <p className="mt-1 text-sm text-slate-600">Tổng đơn: <span className="font-semibold">{vnd(total)} ₫</span></p>
                        <div className="mt-3">
                            <label className="text-xs font-medium text-slate-700">Phương thức</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(Number(e.target.value))}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            >
                                <option value={paymentMethodEnum.COD}>COD (0)</option>
                                <option value={paymentMethodEnum.BANKING}>Banking/PayOS (3)</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={onCreatePayment}
                            disabled={isCreating}
                            className="mt-3 w-full rounded-lg bg-[#1a5f2a] text-white px-3 py-2 text-sm font-semibold hover:bg-[#145026] disabled:opacity-60"
                        >
                            {isCreating ? "Đang tạo payment..." : "Tạo payment"}
                        </button>
                        {latestPayment && (
                            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                                <p>Payment #{latestPayment.id}</p>
                                <p>Trạng thái: <span className="font-semibold">{latestPayment.paymentStatus}</span></p>
                                {latestPayment.checkoutUrl && (
                                    <a href={latestPayment.checkoutUrl} target="_blank" rel="noreferrer" className="text-[#1a5f2a] font-semibold hover:underline">
                                        Mở link thanh toán
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={onCancelPayment}
                                    disabled={isCancelling}
                                    className="mt-2 w-full rounded-lg border border-red-300 text-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
                                >
                                    {isCancelling ? "Đang hủy..." : "Hủy payment"}
                                </button>
                            </div>
                        )}
                        {!!msg && <p className="mt-3 text-xs text-slate-700">{msg}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

