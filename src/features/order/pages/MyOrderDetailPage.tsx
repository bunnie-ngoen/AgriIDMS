import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { formatVietnamDateTime } from "../../../shared/lib/vietnamTime";
import {
    isPaymentActive,
    isPaymentSettled,
    paymentStatusLabelVietnam,
} from "../../../shared/lib/paymentStatus";
import {
    useCancelOrderMutation,
    useGetMyOrderByIdQuery,
    useSetOnlineOrderPaymentTimingMutation,
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
    if (status === "ApprovedExport") return "Đã duyệt xuất";
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
    if (status === "ApprovedExport") return "bg-cyan-100 text-cyan-700 border-cyan-200";
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
    onReviewSubmitted,
}: {
    orderDetailId: number;
    orderStatus: string;
    onReviewSubmitted?: () => Promise<unknown> | void;
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

    const canReview = data?.status === "Reviewable" && !!data?.isReviewable;
    const hasReviewed = !!data?.hasReviewed || data?.status === "AlreadyReviewed";
    const canShow = orderStatus === "Delivered";

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
            await Promise.all([refetch(), Promise.resolve(onReviewSubmitted?.())]);
        } catch (err) {
            setFeedback(getApiErrorMessage(err, "Chưa đủ điều kiện đánh giá hoặc đã đánh giá trước đó."));
        }
    };

    const ineligibleMessage = data?.message || "Chưa đủ điều kiện đánh giá.";
    const actionLabel = hasReviewed
        ? "Đã đánh giá"
        : canReview
            ? "Đánh giá sản phẩm"
            : "Chưa đủ điều kiện đánh giá";

    return (
        <div className="mt-3">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={!canReview || isFetching}
                className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {actionLabel}
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
            {!canReview && !feedback && <p className="mt-1 text-xs text-slate-600">{ineligibleMessage}</p>}
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
    const [setOnlineOrderPaymentTiming, { isLoading: isSettingPaymentTiming }] = useSetOnlineOrderPaymentTimingMutation();
    const [cancelOrder, { isLoading: isCancellingOrder }] = useCancelOrderMutation();

    const [paymentMethod, setPaymentMethod] = useState<number>(paymentMethodEnum.COD);
    const [msg, setMsg] = useState<string>("");

    const total = useMemo(() => order?.totalAmount ?? 0, [order?.totalAmount]);
    const latestPaymentStatus = latestPayment?.paymentStatus;
    const isLatestPaymentPaid = isPaymentSettled(latestPaymentStatus);
    const isLatestPaymentActive = isPaymentActive(latestPaymentStatus);
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
            order.status === "ApprovedExport" ||
            order.shippingStatus === "ShippingInProgress" ||
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
            if (res.checkoutUrl) window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
            await refetchPayment();
            await refetch();
        } catch (err) {
            setMsg(getApiErrorMessage(err, "Không tạo được thanh toán. Đơn cần đúng trạng thái Confirmed và chỉ hỗ trợ tiền mặt/chuyển khoản."));
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

    const onChoosePaymentTiming = async (paymentTiming: 0 | 1) => {
        if (!valid) return;
        setMsg("");
        try {
            await setOnlineOrderPaymentTiming({ id: orderId, paymentTiming }).unwrap();
            setMsg(
                paymentTiming === 0
                    ? "Đã chọn trả trước (PayBefore)."
                    : "Đã chọn trả sau (PayAfter).",
            );
            await refetch();
        } catch (err) {
            setMsg(
                getApiErrorMessage(
                    err,
                    "Không thể cập nhật hình thức thanh toán lúc này.",
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
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Chi tiết đơn hàng</p>
                                    <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Đơn #{order.orderId}</h1>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${orderStatusTone(order.status)}`}>
                                        {orderStatusLabel(order.status)}
                                    </span>
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusTone(order.latestPaymentStatus)}`}>
                                        {paymentStatusLabel(order.latestPaymentStatus)}
                                    </span>
                                </div>
                            </div>

                            <dl className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-slate-500">Hình thức mua</dt>
                                    <dd className="font-semibold text-slate-900">{sourceLabel(order.source)}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500">Hình thức nhận hàng</dt>
                                    <dd className="font-semibold text-slate-900">{fulfillmentTypeLabel(order.fulfillmentType)}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500">Ngày và giờ</dt>
                                    <dd className="font-semibold tabular-nums text-slate-900">{formatVietnamDateTime(order.createdAt)}</dd>
                                </div>
                            </dl>
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
                            <article
                                key={`${i.productVariantId}-${idx}`}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-bold text-slate-900">{i.productName}</p>
                                        <p className="mt-1 text-xs text-slate-500">Mã biến thể: #{i.productVariantId}</p>
                                    </div>
                                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                        {i.grade}
                                    </span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                        {i.isPartial ? "Hộp lẻ" : "Hộp đầy"}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        {i.boxWeight} kg
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <div>
                                        <p className="text-xs text-slate-500">Số lượng</p>
                                        <p className="text-sm font-semibold text-slate-900">{i.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Đơn giá</p>
                                        <p className="text-sm font-semibold text-slate-900">{vnd(i.unitPrice)} ₫</p>
                                    </div>
                                </div>

                                <ReviewAction
                                    orderDetailId={i.orderDetailId}
                                    orderStatus={order.status}
                                    onReviewSubmitted={() => refetch()}
                                />
                            </article>
                        ))}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 h-fit">
                        <h2 className="text-lg font-bold text-slate-900">Thanh toán & xử lý đơn</h2>
                        <p className="mt-1 text-sm text-slate-600">Thành tiền (VNĐ): <span className="font-semibold">{vnd(total)} ₫</span></p>
                        {(order.status === "ApprovedExport" || order.status === "Delivered" || order.status === "Completed") && (
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
                            {order.source === "Online" &&
                                order.status === "Confirmed" &&
                                !order.paymentTiming && (
                                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                                    <p className="text-sm font-semibold text-sky-800">Chọn hình thức thanh toán</p>
                                    <p className="mt-1 text-xs text-sky-700">
                                        Đơn online sau khi sale xác nhận cần chọn trả trước hoặc trả sau.
                                    </p>
                                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => onChoosePaymentTiming(0)}
                                            disabled={isSettingPaymentTiming}
                                            className="rounded-lg border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-60"
                                        >
                                            Chọn trả trước
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onChoosePaymentTiming(1)}
                                            disabled={isSettingPaymentTiming}
                                            className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"
                                        >
                                            Chọn trả sau
                                        </button>
                                    </div>
                                </div>
                            )}
                            {order.status !== "ApprovedExport" &&
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
                                <option value={paymentMethodEnum.COD}>Tiền mặt</option>
                                <option value={paymentMethodEnum.BANKING}>Chuyển khoản</option>
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
                        {!!msg && <p className="mt-3 text-xs text-slate-700">{msg}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

