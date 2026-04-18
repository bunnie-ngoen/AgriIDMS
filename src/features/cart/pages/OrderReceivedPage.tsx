import { Link, Navigate, useParams, generatePath } from "react-router-dom";

import { ROUTES } from "../../../shared/constants/routes";
import { formatVietnamDate, formatVietnamTime } from "../../../shared/lib/vietnamTime";
import { orderStatusLabel } from "../../../shared/lib/orderStatusUi";
import { useGetMyOrderByIdQuery } from "../../order/api/order.api";
import type { OrderDetail } from "../../order/schemas/order.schema";

function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

function formatLineItem(item: OrderDetail["items"][number]) {
    const box = item.isPartial ? "hộp lẻ" : "hộp đầy";
    return `${item.productName} · ${item.grade} · ${item.quantity} ${box} · ${item.boxWeight} kg`;
}

export default function OrderReceivedPage() {
    const { orderId: idParam } = useParams();
    const orderId = Number(idParam);
    const valid = Number.isInteger(orderId) && orderId > 0;
    const { data: order, isLoading, isError, refetch } = useGetMyOrderByIdQuery(orderId, { skip: !valid });

    if (!valid) {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    const detailPath = generatePath(ROUTES.CUSTOMER_ORDER_DETAIL, { id: String(orderId) });

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Đang tải đơn hàng...</div>
            </div>
        );
    }

    if (isError || !order) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <p className="text-red-700 font-medium">Không tải được đơn hàng.</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 text-sm font-medium text-red-700 hover:underline"
                    >
                        Thử lại
                    </button>
                    <div className="mt-4">
                        <Link to={ROUTES.CUSTOMER_ORDERS_PAGE} className="text-sm font-medium text-[#1a5f2a] hover:underline">
                            ← Đơn hàng của tôi
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const lead =
        order.status === "PendingSaleConfirmation"
            ? "Đơn của bạn đang chờ bộ phận sale staff xác nhận."
            : `Trạng thái đơn: ${orderStatusLabel(order.status)}.`;

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-16">
            <Link
                to={ROUTES.CUSTOMER_ORDERS_PAGE}
                className="text-sm font-medium text-slate-600 hover:text-[#1a5f2a]"
            >
                ← Đơn hàng của tôi
            </Link>

            <h1 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900 text-center">Đơn hàng đã được ghi nhận</h1>
            <p className="mt-3 text-sm text-slate-600 text-center leading-relaxed">{lead}</p>

            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-4">Thông tin đơn hàng</h2>

                <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-slate-600">Mã đơn</dt>
                        <dd className="font-semibold text-slate-900">#{order.orderId}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-slate-600">Ngày tạo</dt>
                        <dd className="font-semibold text-slate-900 tabular-nums">{formatVietnamDate(order.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-slate-600">Giờ tạo</dt>
                        <dd className="font-semibold text-slate-900 tabular-nums">{formatVietnamTime(order.createdAt)}</dd>
                    </div>

                    {order.recipient && (
                        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                            <span className="shrink-0 text-slate-500">Người nhận (theo đơn)</span>
                            <span className="shrink-0 text-slate-300" aria-hidden>
                                |
                            </span>
                            <span
                                className="min-w-0 flex-1 truncate font-medium text-slate-900"
                                title={`${order.recipient.fullName} · ${order.recipient.phone} · ${order.recipient.address}`}
                            >
                                {order.recipient.fullName} · {order.recipient.phone} · {order.recipient.address}
                            </span>
                        </div>
                    )}

                    <div>
                        <dt className="text-slate-600 mb-2">Sản phẩm</dt>
                        <dd>
                            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                                {order.items.map((item, idx) => (
                                    <li key={`${item.productVariantId}-${item.boxWeight}-${item.isPartial}-${idx}`} className="px-3 py-2.5 text-sm font-medium text-slate-900">
                                        {formatLineItem(item)}
                                    </li>
                                ))}
                            </ul>
                        </dd>
                    </div>

                    <div className="flex justify-between gap-4 pt-2 border-t border-slate-100">
                        <dt className="text-slate-600 font-medium">Tổng tiền</dt>
                        <dd className="font-bold text-slate-900">{vnd(Number(order.totalAmount))} ₫</dd>
                    </div>
                </dl>
            </div>

            <div className="mt-8 space-y-3">
                <Link
                    to={detailPath}
                    className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                    Xem chi tiết đơn hàng
                </Link>
                <Link
                    to={ROUTES.HOME}
                    className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                    Về trang chủ
                </Link>
            </div>
        </div>
    );
}
