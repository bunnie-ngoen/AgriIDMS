import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, Home, ShoppingBag, Package, Truck, CreditCard } from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";
import { useAllocateOrderMutation } from "../../order/api/order.api";
import { useCreatePaymentMutation, useGetLatestPaymentQuery } from "../../payment/api/payment.api";
import toast from "react-hot-toast";

function formatPrice(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default function OrderSuccessPage() {
    const location = useLocation();
    const state = (location.state as { orderId?: number; totalAmount?: number } | null) ?? {};
    const { orderId, totalAmount } = state;

    const [allocated, setAllocated] = useState(false);
    const [allocateOrder, { isLoading: isAllocating }] = useAllocateOrderMutation();
    const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();
    const { data: latestPayment } = useGetLatestPaymentQuery(orderId ?? 0, {
        skip: !orderId || orderId <= 0,
    });

    const hasOrderId = orderId != null && orderId > 0;
    const isPaid = latestPayment?.paymentStatus === "Success";
    const paymentPending = latestPayment?.paymentStatus === "Pending";

    const handleAllocate = async () => {
        if (!orderId) return;
        const t = toast.loading("Đang kiểm tra và giữ hàng...");
        try {
            await allocateOrder(orderId).unwrap();
            setAllocated(true);
            toast.success("Đã giữ hàng. Bạn có thể chọn thanh toán.", { id: t });
        } catch (e: unknown) {
            const msg = (e as { data?: { error?: string } })?.data?.error ?? "Không thể giữ hàng. Vui lòng thử lại.";
            toast.error(msg, { id: t });
        }
    };

    const handlePaymentCOD = async () => {
        if (!orderId) return;
        const t = toast.loading("Đang tạo yêu cầu thanh toán COD...");
        try {
            await createPayment({ orderId, paymentMethod: 0 }).unwrap();
            toast.success("Đã ghi nhận thanh toán COD. Vui lòng thanh toán khi nhận hàng.", { id: t });
        } catch (e: unknown) {
            const msg = (e as { data?: { error?: string } })?.data?.error ?? "Tạo thanh toán thất bại.";
            toast.error(msg, { id: t });
        }
    };

    const handlePaymentBanking = async () => {
        if (!orderId) return;
        const t = toast.loading("Đang chuyển đến cổng thanh toán...");
        try {
            const res = await createPayment({ orderId, paymentMethod: 3 }).unwrap();
            if (res.checkoutUrl) {
                window.open(res.checkoutUrl, "_blank");
                toast.success("Đã mở trang thanh toán. Vui lòng hoàn tất trong cửa sổ mới.", { id: t });
            } else {
                toast.success("Yêu cầu thanh toán đã được ghi nhận.", { id: t });
            }
        } catch (e: unknown) {
            const msg = (e as { data?: { error?: string } })?.data?.error ?? "Tạo thanh toán thất bại.";
            toast.error(msg, { id: t });
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-[#1a5f2a] mb-6">
                <CheckCircle size={48} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Đặt hàng thành công</h1>
            <p className="text-slate-600 mb-2">
                Cảm ơn bạn đã đặt hàng. Đơn của bạn đã được ghi nhận.
            </p>
            <div className="mb-6">
                {hasOrderId && (
                    <p className="text-slate-700 font-medium">
                        Mã đơn hàng: <span className="text-[#1a5f2a]">#{orderId}</span>
                    </p>
                )}
                {totalAmount != null && totalAmount > 0 && (
                    <p className="text-slate-700 font-medium mt-1">
                        Tổng tiền: <span className="text-[#1a5f2a]">{formatPrice(totalAmount)}</span>
                    </p>
                )}
            </div>

            {/* Bước tiếp theo: Giữ hàng + Thanh toán */}
            {hasOrderId && !isPaid && (
                <div className="mb-8 text-left bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Truck size={18} className="text-[#1a5f2a]" />
                        Bước tiếp theo
                    </h2>
                    <div className="space-y-4">
                        {/* 1. Giữ hàng (ẩn nếu đã có payment) */}
                        {!allocated && !paymentPending && (
                            <div>
                                <p className="text-sm text-slate-600 mb-2">
                                    Kiểm tra kho và giữ hàng cho đơn của bạn.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleAllocate}
                                    disabled={isAllocating}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a5f2a] text-white font-medium hover:bg-[#145026] disabled:opacity-60"
                                >
                                    {isAllocating ? "Đang xử lý..." : "Giữ hàng (kiểm tra kho)"}
                                </button>
                            </div>
                        )}
                        {/* 2. Thanh toán (sau khi đã allocate hoặc đã có payment pending) */}
                        {(allocated || paymentPending) && (
                            <div>
                                <p className="text-sm text-slate-600 mb-2 flex items-center gap-1">
                                    <CreditCard size={14} />
                                    Chọn phương thức thanh toán
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePaymentCOD}
                                        disabled={isCreatingPayment || isPaid}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-60"
                                    >
                                        Thanh toán COD
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePaymentBanking}
                                        disabled={isCreatingPayment || isPaid}
                                        className="px-4 py-2.5 rounded-xl border border-[#1a5f2a] text-[#1a5f2a] font-medium hover:bg-[#1a5f2a]/5 disabled:opacity-60"
                                    >
                                        Chuyển khoản
                                    </button>
                                </div>
                                {paymentPending && !isPaid && (
                                    <p className="text-sm text-amber-700 mt-2">
                                        Đã tạo yêu cầu thanh toán. Vui lòng hoàn tất hoặc chờ xác nhận.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {hasOrderId && isPaid && (
                <p className="text-[#1a5f2a] font-medium mb-8">Đơn hàng đã thanh toán. Kho sẽ tạo phiếu xuất và giao hàng.</p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
                <Link
                    to={ROUTES.HOME}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                >
                    <Home size={18} />
                    Về trang chủ
                </Link>
                <Link
                    to={ROUTES.MY_ORDERS}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#1a5f2a] text-[#1a5f2a] font-medium hover:bg-[#1a5f2a]/5"
                >
                    <Package size={18} />
                    Đơn hàng của tôi
                </Link>
                <a
                    href="/#san-pham"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a5f2a] text-white font-medium hover:bg-[#145026]"
                >
                    <ShoppingBag size={18} />
                    Tiếp tục mua
                </a>
            </div>
        </div>
    );
}
