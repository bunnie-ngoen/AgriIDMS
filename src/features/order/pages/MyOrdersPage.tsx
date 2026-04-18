import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";
import { formatVietnamDateTime, parseApiDateInput } from "../../../shared/lib/vietnamTime";
import { paymentStatusLabelVietnam } from "../../../shared/lib/paymentStatus";
import { useGetMyOrdersQuery } from "../api/order.api";
import type { OrderListItem } from "../schemas/order.schema";

/** Tab theo nghiệp vụ (map sang OrderStatus + ShippingStatus + FulfillmentType). */
type OrderTabId =
    | "ALL"
    | "PENDING_CONFIRM"
    | "PROCESSING"
    | "WAIT_PICKUP"
    | "SHIPPING"
    | "DONE"
    | "ISSUE";

const TAB_DEFS: { id: OrderTabId; label: string }[] = [
    { id: "ALL", label: "Tất cả" },
    { id: "PENDING_CONFIRM", label: "Chờ xác nhận" },
    { id: "PROCESSING", label: "Đang xử lý" },
    { id: "WAIT_PICKUP", label: "Chờ lấy hàng" },
    { id: "SHIPPING", label: "Đang giao" },
    { id: "DONE", label: "Đã giao / Hoàn thành" },
    { id: "ISSUE", label: "Có vấn đề" },
];

function matchesOrderTab(o: OrderListItem, tab: OrderTabId): boolean {
    if (tab === "ALL") return true;

    if (tab === "PENDING_CONFIRM") {
        return o.status === "PendingSaleConfirmation";
    }

    if (tab === "PROCESSING") {
        const preparing = new Set([
            "Confirmed",
            "AwaitingAllocation",
            "PendingWarehouseConfirm",
            "PartiallyAllocated",
            "BackorderWaiting",
        ]);
        if (preparing.has(o.status)) return true;
        // TakeAway: đã duyệt xuất, chờ nhận tại quầy (không dùng ShippingStatus như Delivery)
        if (o.status === "ApprovedExport" && o.fulfillmentType === "TakeAway") return true;
        return false;
    }

    if (tab === "WAIT_PICKUP") {
        return o.status === "ApprovedExport" && o.shippingStatus === "ShippingPendingPickup";
    }

    if (tab === "SHIPPING") {
        return o.status === "ApprovedExport" && o.shippingStatus === "ShippingInProgress";
    }

    if (tab === "DONE") {
        return o.status === "Delivered" || o.status === "Completed";
    }

    if (tab === "ISSUE") {
        return o.status === "FailedDelivery" || o.status === "Returned" || o.status === "Cancelled";
    }

    return true;
}

function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

function getOrderStatusTone(status: string) {
    if (status === "PendingSaleConfirmation") return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "PendingWarehouseConfirm") return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (status === "AwaitingAllocation") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "PartiallyAllocated") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "BackorderWaiting") return "bg-violet-100 text-violet-700 border-violet-200";
    if (status === "Confirmed") return "bg-teal-100 text-teal-700 border-teal-200";
    if (status === "AwaitingPayment") return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (status === "ApprovedExport") return "bg-cyan-100 text-cyan-700 border-cyan-200";
    if (status === "Delivered") return "bg-green-100 text-green-700 border-green-200";
    if (status === "FailedDelivery") return "bg-orange-100 text-orange-700 border-orange-200";
    if (status === "Returned") return "bg-slate-200 text-slate-700 border-slate-300";
    if (status === "Completed") return "bg-green-100 text-green-700 border-green-200";
    if (status === "Cancelled") return "bg-rose-100 text-rose-700 border-rose-200";
    if (status === "InventoryFailed") return "bg-red-100 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
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
    if (status === "InventoryFailed") return "Thiếu tồn kho";
    return status;
}

function paymentStatusLabel(status?: string | null) {
    return paymentStatusLabelVietnam(status);
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

/** Giao hàng (Delivery) — ẩn khi None hoặc không có. */
function shippingStatusLabel(status?: string | null) {
    if (!status || status === "None") return null;
    if (status === "ShippingPendingPickup") return "Chờ lấy hàng";
    if (status === "ShippingInProgress") return "Đang giao hàng";
    if (status === "DeliveredShip") return "Đã giao";
    if (status === "ShippingFailed") return "Giao thất bại";
    return status;
}

export default function MyOrdersPage() {
    const { data, isLoading, isError, refetch } = useGetMyOrdersQuery();
    const orders = data ?? [];
    const [orderTab, setOrderTab] = useState<OrderTabId>("ALL");
    const [searchOrderId, setSearchOrderId] = useState<string>("");
    const [sortBy, setSortBy] = useState<"createdDesc" | "createdAsc" | "totalDesc" | "totalAsc">("createdDesc");
    const [pageSize, setPageSize] = useState<10 | 20>(20);
    const [page, setPage] = useState(1);

    const tabCounts = useMemo(() => {
        const counts: Record<OrderTabId, number> = {
            ALL: orders.length,
            PENDING_CONFIRM: 0,
            PROCESSING: 0,
            WAIT_PICKUP: 0,
            SHIPPING: 0,
            DONE: 0,
            ISSUE: 0,
        };
        for (const o of orders) {
            for (const def of TAB_DEFS) {
                if (def.id === "ALL") continue;
                if (matchesOrderTab(o, def.id)) counts[def.id] += 1;
            }
        }
        return counts;
    }, [orders]);

    const filteredAndSorted = useMemo(() => {
        const q = searchOrderId.trim();
        const filtered = orders.filter((o) => {
            const tabOk = matchesOrderTab(o, orderTab);
            const idOk = q === "" || String(o.orderId).includes(q);
            return tabOk && idOk;
        });
        const sorted = [...filtered];
        if (sortBy === "createdAsc") {
            sorted.sort(
                (a, b) => parseApiDateInput(a.createdAt).getTime() - parseApiDateInput(b.createdAt).getTime(),
            );
        } else if (sortBy === "createdDesc") {
            sorted.sort(
                (a, b) => parseApiDateInput(b.createdAt).getTime() - parseApiDateInput(a.createdAt).getTime(),
            );
        } else if (sortBy === "totalAsc") {
            sorted.sort((a, b) => a.totalAmount - b.totalAmount);
        } else {
            sorted.sort((a, b) => b.totalAmount - a.totalAmount);
        }
        return sorted;
    }, [orders, searchOrderId, sortBy, orderTab]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pageRows = filteredAndSorted.slice(start, start + pageSize);

    const resetFilters = () => {
        setOrderTab("ALL");
        setSearchOrderId("");
        setSortBy("createdDesc");
        setPageSize(20);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
                <header className="mb-8 border-b border-slate-200/80 pb-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            <ClipboardList size={22} />
                            Đơn hàng của tôi
                        </h1>
                        <span className="text-sm text-slate-600">
                            Tổng đơn: <span className="font-semibold text-slate-900">{orders.length}</span>
                        </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-500">
                        Chọn nhanh theo giai đoạn (giống Shopee), bám theo trạng thái đơn và vận chuyển trên hệ thống.
                    </p>
                </header>

                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 text-slate-600 shadow-sm">Đang tải đơn hàng...</div>
                ) : isError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                        <p className="text-red-700">Không tải được danh sách đơn hàng.</p>
                        <button onClick={() => refetch()} className="mt-2 text-sm font-medium text-red-700 hover:underline">Thử lại</button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 text-slate-600 shadow-sm">Bạn chưa có đơn hàng nào.</div>
                ) : (
                    <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-500">Trạng thái đơn</p>
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {TAB_DEFS.map((def) => {
                                const active = orderTab === def.id;
                                const count = tabCounts[def.id];
                                return (
                                    <button
                                        key={def.id}
                                        type="button"
                                        onClick={() => {
                                            setOrderTab(def.id);
                                            setPage(1);
                                        }}
                                        className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                                            active
                                                ? "border-[#1a5f2a] bg-[#1a5f2a] text-white shadow-sm"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        {def.label}
                                        <span
                                            className={`ml-1.5 tabular-nums ${
                                                active ? "text-emerald-100" : "text-slate-500"
                                            }`}
                                        >
                                            ({count})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                            <span className="font-semibold text-slate-600">Đang xử lý:</span> đã xác nhận / chờ giữ hàng / chờ kho;
                            TakeAway đã duyệt xuất chờ nhận tại quầy.
                            <span className="font-semibold text-slate-600"> Chờ lấy / Đang giao:</span> chỉ đơn giao tận nơi (
                            <span className="font-mono">Delivery</span>) sau khi duyệt xuất, theo{" "}
                            <span className="font-mono">ShippingStatus</span>.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Tìm theo mã đơn</label>
                                <input
                                    value={searchOrderId}
                                    onChange={(e) => {
                                        setSearchOrderId(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="VD: 1024"
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                                <label className="text-xs font-medium text-slate-600">Sắp xếp danh sách</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value as typeof sortBy);
                                        setPage(1);
                                    }}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value="createdDesc">Mới nhất</option>
                                    <option value="createdAsc">Cũ nhất</option>
                                    <option value="totalDesc">Thành tiền giảm dần</option>
                                    <option value="totalAsc">Thành tiền tăng dần</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                                <label className="text-xs font-medium text-slate-600">Số đơn mỗi trang</label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value) as 10 | 20);
                                        setPage(1);
                                    }}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                            <div className="flex items-end sm:col-span-2 lg:col-span-1">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Đặt lại bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>

                    {pageRows.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
                            Không có đơn phù hợp — thử đổi mục trạng thái hoặc xóa ô mã đơn.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid gap-3 lg:hidden">
                                {pageRows.map((o) => (
                                    <article key={o.orderId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm text-slate-500">Mã đơn</p>
                                                <p className="text-base font-bold text-slate-900">#{o.orderId}</p>
                                            </div>
                                            <Link
                                                to={ROUTES.CUSTOMER_ORDER_DETAIL.replace(":id", String(o.orderId))}
                                                className="inline-flex rounded-lg bg-[#1a5f2a] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#145026]"
                                            >
                                                Xem đơn
                                            </Link>
                                        </div>

                                        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                            <div className="col-span-2">
                                                <dt className="text-slate-500">Ngày và giờ</dt>
                                                <dd className="font-medium tabular-nums text-slate-800">{formatVietnamDateTime(o.createdAt)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500">Số sản phẩm</dt>
                                                <dd className="font-medium text-slate-800">{o.itemCount}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500">Thành tiền</dt>
                                                <dd className="font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</dd>
                                            </div>
                                        </dl>

                                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Trạng thái đơn</p>
                                                <span
                                                    className={`mt-1 inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(o.status)}`}
                                                >
                                                    {orderStatusLabel(o.status)}
                                                </span>
                                                {shippingStatusLabel(o.shippingStatus) && (
                                                    <p className="mt-1 text-[11px] text-slate-600">
                                                        Giao hàng: <span className="font-medium text-slate-800">{shippingStatusLabel(o.shippingStatus)}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Trình trạng thanh toán</p>
                                                <span
                                                    className={`mt-1 inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusTone(o.latestPaymentStatus)}`}
                                                >
                                                    {paymentStatusLabel(o.latestPaymentStatus)}
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                                            <th className="px-4 py-3">Mã đơn</th>
                                            <th className="px-4 py-3">Ngày và giờ</th>
                                            <th className="px-4 py-3">Trạng thái đơn</th>
                                            <th className="px-4 py-3">Trình trạng thanh toán</th>
                                            <th className="px-4 py-3">Số sản phẩm</th>
                                            <th className="px-4 py-3">Thành tiền (VNĐ)</th>
                                            <th className="px-4 py-3">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageRows.map((o) => (
                                            <tr key={o.orderId} className="border-b border-slate-100 text-sm last:border-b-0">
                                                <td className="px-4 py-3 font-semibold text-slate-900">#{o.orderId}</td>
                                                <td className="px-4 py-3 tabular-nums text-slate-700">{formatVietnamDateTime(o.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span
                                                            className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(o.status)}`}
                                                        >
                                                            {orderStatusLabel(o.status)}
                                                        </span>
                                                        {shippingStatusLabel(o.shippingStatus) && (
                                                            <p className="text-[11px] text-slate-600">
                                                                Giao hàng: <span className="font-medium text-slate-800">{shippingStatusLabel(o.shippingStatus)}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusTone(o.latestPaymentStatus)}`}
                                                    >
                                                        {paymentStatusLabel(o.latestPaymentStatus)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">{o.itemCount}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        to={ROUTES.CUSTOMER_ORDER_DETAIL.replace(":id", String(o.orderId))}
                                                        className="inline-flex rounded-lg bg-[#1a5f2a] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#145026]"
                                                    >
                                                        Xem đơn
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Trước
                        </button>
                        <span className="text-sm text-slate-600 min-w-[90px] text-center">
                            Trang {safePage}/{totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage >= totalPages}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Sau
                        </button>
                    </div>
                    </div>
                )}
            </div>
        </div>
    );
}

