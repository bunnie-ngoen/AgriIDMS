import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import {
    useCancelOrderMutation,
    useCancelShortageMutation,
    useConfirmOrderMutation,
    useGetMyOrderByIdQuery,
    useWaitBackorderMutation,
} from "../api/order.api";
import {
    useCancelPaymentMutation,
    useCreatePaymentMutation,
    useGetLatestPaymentByOrderQuery,
} from "../../payment/api/payment.api";
import { paymentMethodEnum } from "../../payment/schemas/payment.schema";

function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

function orderStatusLabel(status: string) {
    if (status === "PendingSaleConfirmation") return "Chờ xác nhận bán";
    if (status === "AwaitingAllocation") return "Chờ giữ hàng";
    if (status === "PendingWarehouseConfirm") return "Chờ kho xác nhận";
    if (status === "PartiallyAllocated") return "Giữ hàng một phần";
    if (status === "BackorderWaiting") return "Chờ backorder";
    if (status === "Shipping") return "Đang giao";
    if (status === "Completed") return "Hoàn thành";
    if (status === "Cancelled") return "Đã hủy";
    return status;
}

function paymentStatusLabel(status?: string | null) {
    if (!status) return "Chưa có";
    if (status === "Pending") return "Chờ xử lý";
    if (status === "Processing") return "Đang xử lý";
    if (status === "Paid") return "Đã thanh toán";
    if (status === "Success") return "Đã thanh toán";
    if (status === "Cancelled") return "Đã hủy";
    if (status === "Failed") return "Thất bại";
    return status;
}

function getApiErrorMessage(err: unknown, fallback: string) {
    const e = err as {
        data?: { message?: string; error?: string; detail?: string };
        message?: string;
    };
    return e?.data?.message || e?.data?.error || e?.data?.detail || e?.message || fallback;
}

export default function MyOrderDetailPage() {
    const { id } = useParams();
    const orderId = Number(id);
    const valid = Number.isInteger(orderId) && orderId > 0;
    const { data: order, isLoading, isError, refetch } = useGetMyOrderByIdQuery(orderId, { skip: !valid });

    const { data: latestPayment, refetch: refetchPayment } = useGetLatestPaymentByOrderQuery(orderId, { skip: !valid });
    const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
    const [cancelPayment, { isLoading: isCancelling }] = useCancelPaymentMutation();
    const [confirmOrder, { isLoading: isConfirmingOrder }] = useConfirmOrderMutation();
    const [waitBackorder, { isLoading: isWaitingBackorder }] = useWaitBackorderMutation();
    const [cancelShortage, { isLoading: isCancellingShortage }] = useCancelShortageMutation();
    const [cancelOrder, { isLoading: isCancellingOrder }] = useCancelOrderMutation();

    const [paymentMethod, setPaymentMethod] = useState<number>(paymentMethodEnum.COD);
    const [msg, setMsg] = useState<string>("");

    const total = useMemo(() => order?.totalAmount ?? 0, [order?.totalAmount]);
    const latestPaymentStatus = latestPayment?.paymentStatus;
    const isLatestPaymentPaid = latestPaymentStatus === "Paid" || latestPaymentStatus === "Success";
    const isLatestPaymentActive =
        latestPaymentStatus === "Pending" || latestPaymentStatus === "Processing";
    const canCreatePayment =
        !!order &&
        order.status === "Confirmed" &&
        !isLatestPaymentPaid &&
        !isLatestPaymentActive;
    const canCancelPayment =
        !!latestPayment &&
        (latestPayment.paymentStatus === "Processing" || latestPayment.paymentStatus === "Pending");

    useEffect(() => {
        if (!valid || !order) return;
        const shouldPoll =
            order.status === "Confirmed" ||
            order.status === "Paid" ||
            latestPaymentStatus === "Pending" ||
            latestPaymentStatus === "Processing";
        if (!shouldPoll) return;

        const timer = window.setInterval(() => {
            refetchPayment();
            refetch();
        }, 8000);

        return () => window.clearInterval(timer);
    }, [valid, order, latestPaymentStatus, refetch, refetchPayment]);

    const onCreatePayment = async () => {
        if (!valid) return;
        setMsg("");
        try {
            const res = await createPayment({ orderId, paymentMethod }).unwrap();
            setMsg(`Đã tạo thanh toán #${res.id} (${paymentStatusLabel(res.paymentStatus)}).`);
            if (res.checkoutUrl) window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
            await refetchPayment();
            await refetch();
        } catch (err) {
            setMsg(getApiErrorMessage(err, "Không tạo được thanh toán. Đơn cần đúng trạng thái Confirmed và chỉ hỗ trợ COD/chuyển khoản."));
        }
    };

    const onCancelPayment = async () => {
        if (!latestPayment?.id) return;
        setMsg("");
        try {
            await cancelPayment(latestPayment.id).unwrap();
            setMsg("Đã hủy thanh toán.");
            await refetchPayment();
            await refetch();
        } catch (err) {
            setMsg(getApiErrorMessage(err, "Không hủy được thanh toán hiện tại."));
        }
    };

    const onConfirmOrder = async () => {
        if (!valid) return;
        setMsg("");
        try {
            await confirmOrder(orderId).unwrap();
            setMsg("Đã xác nhận đơn để giữ hàng.");
            await refetch();
        } catch {
            setMsg("Không thể xác nhận giữ hàng lúc này.");
        }
    };

    const onWaitBackorder = async () => {
        if (!valid) return;
        setMsg("");
        try {
            await waitBackorder(orderId).unwrap();
            setMsg("Đã chọn chờ backorder.");
            await refetch();
        } catch {
            setMsg("Không thể chuyển sang chờ backorder.");
        }
    };

    const onCancelShortage = async () => {
        if (!valid) return;
        setMsg("");
        try {
            await cancelShortage(orderId).unwrap();
            setMsg("Đã hủy phần thiếu của đơn.");
            await refetch();
        } catch {
            setMsg("Không thể hủy phần thiếu lúc này.");
        }
    };

    const onCancelOrder = async () => {
        if (!valid) return;
        setMsg("");
        try {
            await cancelOrder(orderId).unwrap();
            setMsg("Đã hủy đơn hàng.");
            await refetch();
        } catch {
            setMsg("Không thể hủy đơn hàng lúc này.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <Link to={ROUTES.CUSTOMER_ORDERS_PAGE} className="text-sm text-slate-600 hover:text-[#1a5f2a]">← Quay lại đơn hàng của tôi</Link>
            {!valid ? (
                <div className="mt-4 text-red-600">Mã đơn hàng không hợp lệ.</div>
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
                                <p>Trạng thái: <span className="font-semibold">{orderStatusLabel(order.status)}</span></p>
                                <p>Nguồn: <span className="font-semibold">{order.source}</span></p>
                                <p>Tạo lúc: <span className="font-semibold">{new Date(order.createdAt).toLocaleString("vi-VN")}</span></p>
                                <p>Thanh toán gần nhất: <span className="font-semibold">{paymentStatusLabel(order.latestPaymentStatus)}</span></p>
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
                        <h2 className="text-lg font-bold text-slate-900">Thanh toán & xử lý đơn</h2>
                        <p className="mt-1 text-sm text-slate-600">Tổng đơn: <span className="font-semibold">{vnd(total)} ₫</span></p>
                        {(order.status === "Shipping" || order.status === "Completed") && (
                            <Link
                                to={`${ROUTES.CUSTOMER_COMPLAINTS}?orderId=${order.orderId}`}
                                className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                            >
                                Gửi khiếu nại cho đơn/box đã giao →
                            </Link>
                        )}
                        {order.status === "PartiallyAllocated" && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                Đơn đang thiếu hàng. Vui lòng chọn 1 trong 3 phương án bên dưới.
                            </div>
                        )}
                        <div className="mt-3 space-y-3">
                            {order.status === "AwaitingAllocation" && (
                                <button
                                    type="button"
                                    onClick={onConfirmOrder}
                                    disabled={isConfirmingOrder}
                                    className="w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                                >
                                    {isConfirmingOrder ? "Đang xác nhận..." : "Xác nhận đơn để giữ hàng"}
                                </button>
                            )}
                            {order.status === "PartiallyAllocated" && (
                                <>
                                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                                        <p className="text-sm font-semibold text-sky-800">Chờ hàng về (Backorder)</p>
                                        <p className="mt-1 text-xs text-sky-700">Phần thiếu sẽ được giao sau khi kho có hàng.</p>
                                        <button
                                            type="button"
                                            onClick={onWaitBackorder}
                                            disabled={isWaitingBackorder}
                                            className="mt-2 w-full rounded-lg border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-60"
                                        >
                                            {isWaitingBackorder ? "Đang xử lý..." : "Chờ backorder"}
                                        </button>
                                    </div>
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                        <p className="text-sm font-semibold text-amber-800">Hủy phần thiếu</p>
                                        <p className="mt-1 text-xs text-amber-700">Chỉ nhận phần hàng đã có, không chờ phần thiếu.</p>
                                        <button
                                            type="button"
                                            onClick={onCancelShortage}
                                            disabled={isCancellingShortage}
                                            className="mt-2 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                                        >
                                            {isCancellingShortage ? "Đang xử lý..." : "Hủy phần thiếu"}
                                        </button>
                                    </div>
                                </>
                            )}
                            {order.status !== "Shipping" &&
                                order.status !== "Completed" &&
                                order.status !== "Cancelled" && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                                        <p className="text-sm font-semibold text-rose-800">Hủy toàn bộ đơn</p>
                                        <p className="mt-1 text-xs text-rose-700">Dừng toàn bộ đơn hàng hiện tại.</p>
                                        <button
                                            type="button"
                                            onClick={onCancelOrder}
                                            disabled={isCancellingOrder}
                                            className="mt-2 w-full rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                        >
                                            {isCancellingOrder ? "Đang hủy..." : "Hủy cả đơn"}
                                        </button>
                                    </div>
                                )}
                        </div>
                        <div className="mt-3">
                            <label className="text-xs font-medium text-slate-700">Phương thức</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(Number(e.target.value))}
                                disabled={!canCreatePayment || isCreating}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                            >
                                <option value={paymentMethodEnum.COD}>COD (0)</option>
                                <option value={paymentMethodEnum.BANKING}>Chuyển khoản/PayOS (3)</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={onCreatePayment}
                            disabled={isCreating || !canCreatePayment}
                            className="mt-3 w-full rounded-lg bg-[#1a5f2a] text-white px-3 py-2 text-sm font-semibold hover:bg-[#145026] disabled:opacity-60"
                        >
                            {isCreating ? "Đang tạo thanh toán..." : "Tạo thanh toán"}
                        </button>
                        {!canCreatePayment && (
                            <p className="mt-2 text-xs text-amber-700">
                                Chỉ tạo thanh toán khi đơn ở trạng thái Confirmed và không có payment đang chờ xử lý.
                            </p>
                        )}
                        {latestPayment && (
                            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                                <p>Thanh toán #{latestPayment.id}</p>
                                <p>Trạng thái: <span className="font-semibold">{paymentStatusLabel(latestPayment.paymentStatus)}</span></p>
                                {latestPayment.checkoutUrl && (
                                    <a href={latestPayment.checkoutUrl} target="_blank" rel="noreferrer" className="text-[#1a5f2a] font-semibold hover:underline">
                                        Mở link thanh toán
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={onCancelPayment}
                                    disabled={isCancelling || !canCancelPayment}
                                    className="mt-2 w-full rounded-lg border border-red-300 text-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
                                >
                                    {isCancelling ? "Đang hủy..." : "Hủy thanh toán"}
                                </button>
                            </div>
                        )}
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                            <p className="font-semibold text-slate-900">Tiến trình đơn hàng</p>
                            <p>
                                Bước 4 - Thanh toán:{" "}
                                <span className="font-semibold">
                                    {isLatestPaymentPaid ? "Hoàn tất" : "Chưa hoàn tất"}
                                </span>
                            </p>
                            <p>
                                Bước 5 - Giao hàng/hoàn thành:{" "}
                                <span className="font-semibold">
                                    {order.status === "Shipping"
                                        ? "Đang giao"
                                        : order.status === "Completed"
                                          ? "Hoàn thành"
                                          : order.status === "Paid"
                                            ? "Đã thanh toán, chờ xuất kho"
                                            : "Chưa bắt đầu"}
                                </span>
                            </p>
                            {(order.status === "Shipping" || order.status === "Completed") && (
                                <p className="text-emerald-700">
                                    Đơn đã đủ điều kiện để tạo khiếu nại theo rule backend.
                                </p>
                            )}
                        </div>
                        {!!msg && <p className="mt-3 text-xs text-slate-700">{msg}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

