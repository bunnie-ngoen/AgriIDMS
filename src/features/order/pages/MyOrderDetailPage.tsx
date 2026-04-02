import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { formatVietnamDate, formatVietnamTime } from "../../../shared/lib/vietnamTime";
import {
    isPaymentActive,
    isPaymentSettled,
    paymentStatusLabelVietnam,
} from "../../../shared/lib/paymentStatus";
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
import {
    useCreateReviewMutation,
    useIsReviewableByOrderDetailQuery,
} from "../../review/api/review.api";

function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

function orderStatusLabel(status: string) {
    if (status === "PendingSaleConfirmation") return "Chờ xác nhận bán";
    if (status === "AwaitingAllocation") return "Chờ giữ hàng";
    if (status === "PendingWarehouseConfirm") return "Chờ kho xác nhận";
    if (status === "PartiallyAllocated") return "Giữ hàng một phần";
    if (status === "BackorderWaiting") return "Chờ backorder";
    if (status === "Confirmed") return "Đã xác nhận";
    if (status === "Shipping") return "Đang giao";
    if (status === "Delivered") return "Đã giao hàng";
    if (status === "FailedDelivery") return "Giao thất bại";
    if (status === "Returned") return "Hoàn hàng";
    if (status === "Completed") return "Hoàn thành";
    if (status === "Cancelled") return "Đã hủy";
    return status;
}

function paymentStatusLabel(status?: string | null) {
    return paymentStatusLabelVietnam(status);
}

function orderStatusTone(status: string) {
    if (status === "PendingSaleConfirmation") return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "AwaitingAllocation") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "PendingWarehouseConfirm") return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (status === "PartiallyAllocated") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "BackorderWaiting") return "bg-violet-100 text-violet-700 border-violet-200";
    if (status === "Confirmed") return "bg-teal-100 text-teal-700 border-teal-200";
    if (status === "Shipping") return "bg-cyan-100 text-cyan-700 border-cyan-200";
    if (status === "Delivered") return "bg-green-100 text-green-700 border-green-200";
    if (status === "FailedDelivery") return "bg-orange-100 text-orange-700 border-orange-200";
    if (status === "Returned") return "bg-slate-200 text-slate-700 border-slate-300";
    if (status === "Completed") return "bg-green-100 text-green-700 border-green-200";
    if (status === "Cancelled") return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
}

function paymentStatusTone(status?: string | null) {
    if (!status) return "bg-slate-100 text-slate-600 border-slate-200";
    if (status === "Pending") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "Processing") return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "Paid" || status === "Success") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "Cancelled") return "bg-slate-200 text-slate-700 border-slate-300";
    if (status === "Failed") return "bg-rose-100 text-rose-700 border-rose-200";
    if (status === "Refunded") return "bg-violet-100 text-violet-700 border-violet-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
}

function ReviewAction({
    orderDetailId,
    orderStatus,
}: {
    orderDetailId: number;
    orderStatus: string;
}) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [freshness, setFreshness] = useState(5);
    const [packaging, setPackaging] = useState(5);
    const [comment, setComment] = useState("");
    const [feedback, setFeedback] = useState("");
    const { data, isFetching, refetch } = useIsReviewableByOrderDetailQuery(orderDetailId, {
        skip: orderDetailId <= 0,
    });
    const [createReview, { isLoading }] = useCreateReviewMutation();

    const canReview = !!data?.isReviewable;
    const canShow = orderStatus === "Delivered" || orderStatus === "Completed";

    if (!canShow || orderDetailId <= 0) return null;

    const submit = async () => {
        setFeedback("");
        try {
            await createReview({
                orderDetailId,
                rating,
                freshness,
                packaging,
                comment: comment.trim() || undefined,
            }).unwrap();
            setFeedback("Đã gửi đánh giá thành công.");
            setOpen(false);
            await refetch();
        } catch (err) {
            setFeedback(getApiErrorMessage(err, "Chưa đủ điều kiện đánh giá hoặc đã đánh giá trước đó."));
        }
    };

    return (
        <div className="mt-3">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={!canReview || isFetching}
                className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {canReview ? "Đánh giá sản phẩm" : "Chưa đủ điều kiện đánh giá"}
            </button>
            {open && canReview && (
                <div className="mt-2 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                        <label className="text-slate-700">
                            Tổng quan
                            <select
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                            >
                                {[1, 2, 3, 4, 5].map((x) => (
                                    <option key={x} value={x}>{x}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-slate-700">
                            Độ tươi
                            <select
                                value={freshness}
                                onChange={(e) => setFreshness(Number(e.target.value))}
                                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                            >
                                {[1, 2, 3, 4, 5].map((x) => (
                                    <option key={x} value={x}>{x}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-slate-700">
                            Đóng gói
                            <select
                                value={packaging}
                                onChange={(e) => setPackaging(Number(e.target.value))}
                                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                            >
                                {[1, 2, 3, 4, 5].map((x) => (
                                    <option key={x} value={x}>{x}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)"
                        className="w-full rounded border border-slate-300 px-2 py-1.5"
                    />
                    <button
                        type="button"
                        onClick={submit}
                        disabled={isLoading}
                        className="rounded bg-[#1a5f2a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#145026] disabled:opacity-60"
                    >
                        {isLoading ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                </div>
            )}
            {!!feedback && <p className="mt-1 text-xs text-slate-700">{feedback}</p>}
        </div>
    );
}

function fulfillmentTypeLabel(type?: string | null) {
    if (!type) return "—";
    if (type === "TakeAway") return "Lấy ngay tại quầy";
    if (type === "Delivery") return "Giao hàng";
    return type;
}

function sourceLabel(source?: string | null) {
    if (!source) return "—";
    if (source === "Online") return "Mua online";
    if (source === "POS") return "Mua tại quầy";
    return source;
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
    const fulfilledQty = useMemo(
        () => (order?.items ?? []).reduce((sum, item) => sum + Number(item.fulfilledQuantity ?? 0), 0),
        [order?.items],
    );
    const hasAnyFulfilled = fulfilledQty > 0;
    const latestPaymentStatus = latestPayment?.paymentStatus;
    const isLatestPaymentPaid = isPaymentSettled(latestPaymentStatus);
    const isLatestPaymentActive = isPaymentActive(latestPaymentStatus);
    const isTakeAway = order?.fulfillmentType === "TakeAway";
    const isDelivery = order?.fulfillmentType === "Delivery";
    const canCreatePayment =
        !!order &&
        order.status === "Confirmed" &&
        !isLatestPaymentPaid &&
        !isLatestPaymentActive;
    const canCancelPayment =
        !!latestPayment &&
        isPaymentActive(latestPayment.paymentStatus);

    useEffect(() => {
        if (!valid || !order) return;
        const shouldPoll =
            order.status === "Confirmed" ||
            order.status === "Shipping" ||
            isPaymentActive(latestPaymentStatus);
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
        } catch (err) {
            setMsg(
                getApiErrorMessage(
                    err,
                    "Không thể hủy phần thiếu lúc này.",
                ),
            );
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
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-slate-600">Delivery:</span>
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${orderStatusTone(order.status)}`}>
                                        {orderStatusLabel(order.status)}
                                    </span>
                                    <span className="text-slate-600">Payment:</span>
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusTone(order.latestPaymentStatus)}`}>
                                        {paymentStatusLabel(order.latestPaymentStatus)}
                                    </span>
                                </div>
                                <p>Hình thức mua: <span className="font-semibold">{sourceLabel(order.source)}</span></p>
                                <p>Hình thức nhận hàng: <span className="font-semibold">{fulfillmentTypeLabel(order.fulfillmentType)}</span></p>
                                <p className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span>Ngày tạo: <span className="font-semibold">{formatVietnamDate(order.createdAt)}</span></span>
                                    <span>Giờ: <span className="font-semibold tabular-nums">{formatVietnamTime(order.createdAt)}</span></span>
                                </p>
                            </div>
                        </div>
                        {order.recipient &&
                            (order.recipient.fullName ||
                                order.recipient.phone ||
                                order.recipient.address) && (
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <h2 className="text-sm font-bold text-slate-900">Thông tin nhận hàng</h2>
                                    <dl className="mt-2 space-y-1 text-sm text-slate-700">
                                        <div>
                                            <dt className="text-slate-500">Họ tên</dt>
                                            <dd className="font-medium">{order.recipient.fullName || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Số điện thoại</dt>
                                            <dd className="font-medium">{order.recipient.phone || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Địa chỉ</dt>
                                            <dd className="font-medium whitespace-pre-wrap">
                                                {order.recipient.address || "—"}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            )}
                        {order.items.map((i, idx) => (
                            <div key={`${i.productVariantId}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="font-semibold text-slate-900">{i.productName}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    {i.isPartial ? "Hộp lẻ" : "Hộp đầy"} - {i.boxWeight}kg · {i.grade}
                                </p>
                                <p className="text-sm mt-2">SL: <span className="font-semibold">{i.quantity}</span> · Đơn giá: <span className="font-semibold">{vnd(i.unitPrice)} ₫</span></p>
                                <ReviewAction orderDetailId={i.orderDetailId} orderStatus={order.status} />
                            </div>
                        ))}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 h-fit">
                        <h2 className="text-lg font-bold text-slate-900">Thanh toán & xử lý đơn</h2>
                        <p className="mt-1 text-sm text-slate-600">Thành tiền (VNĐ): <span className="font-semibold">{vnd(total)} ₫</span></p>
                        {(order.status === "Shipping" || order.status === "Delivered" || order.status === "Completed") && (
                            <Link
                                to={`${ROUTES.CUSTOMER_COMPLAINTS}?orderId=${order.orderId}`}
                                className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                            >
                                Gửi khiếu nại cho đơn/box đã giao →
                            </Link>
                        )}
                        {isDelivery && order.status === "PartiallyAllocated" && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                Đơn đang thiếu hàng. Vui lòng chọn hướng xử lý phù hợp bên dưới.
                            </div>
                        )}
                        <div className="mt-3 space-y-3">
                            {isDelivery && order.status === "AwaitingAllocation" && (
                                <button
                                    type="button"
                                    onClick={onConfirmOrder}
                                    disabled={isConfirmingOrder}
                                    className="w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                                >
                                    {isConfirmingOrder ? "Đang xác nhận..." : "Xác nhận đơn để giữ hàng"}
                                </button>
                            )}
                            {isDelivery && order.status === "PartiallyAllocated" && (
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
                                    {hasAnyFulfilled ? (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                            <p className="text-sm font-semibold text-amber-800">Hủy phần thiếu</p>
                                            <p className="mt-1 text-xs text-amber-700">Chỉ nhận phần hàng đã giữ được, không chờ phần thiếu.</p>
                                            <button
                                                type="button"
                                                onClick={onCancelShortage}
                                                disabled={isCancellingShortage}
                                                className="mt-2 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                                            >
                                                {isCancellingShortage ? "Đang xử lý..." : "Hủy phần thiếu"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                                            <p className="text-sm font-semibold text-rose-800">Hủy toàn bộ đơn</p>
                                            <p className="mt-1 text-xs text-rose-700">Đơn chưa giữ được phần hàng nào, bạn có thể hủy toàn bộ đơn.</p>
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
                                </>
                            )}
                            {order.status !== "Shipping" &&
                                order.status !== "Delivered" &&
                                order.status !== "FailedDelivery" &&
                                order.status !== "Returned" &&
                                order.status !== "Completed" &&
                                order.status !== "Cancelled" &&
                                order.status !== "PartiallyAllocated" && (
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
                                        : order.status === "Delivered"
                                          ? "Đã giao hàng"
                                          : order.status === "FailedDelivery"
                                            ? "Giao thất bại"
                                            : order.status === "Returned"
                                              ? "Hoàn hàng"
                                              : order.status === "Completed"
                                                ? "Hoàn thành"
                                                : isTakeAway && order.status === "Confirmed"
                                                  ? "Đã giữ hàng tại quầy"
                                                  : "Chưa bắt đầu"}
                                </span>
                            </p>
                            {(order.status === "Shipping" || order.status === "Delivered" || order.status === "Completed") && (
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

