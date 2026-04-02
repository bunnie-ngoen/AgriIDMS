import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";
import { formatVietnamDate, formatVietnamTime, parseApiDateInput } from "../../../shared/lib/vietnamTime";
import { paymentStatusLabelVietnam } from "../../../shared/lib/paymentStatus";
import { useGetMyOrdersQuery } from "../api/order.api";

function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

function getOrderStatusTone(status: string) {
    if (status === "PendingSaleConfirmation") return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "AwaitingAllocation") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "PartiallyAllocated") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "BackorderWaiting") return "bg-violet-100 text-violet-700 border-violet-200";
    if (status === "Confirmed") return "bg-teal-100 text-teal-700 border-teal-200";
    if (status === "AwaitingPayment") return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (status === "Shipping") return "bg-cyan-100 text-cyan-700 border-cyan-200";
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
    if (status === "Shipping") return "Đang giao";
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

export default function MyOrdersPage() {
    const { data, isLoading, isError, refetch } = useGetMyOrdersQuery();
    const orders = data ?? [];
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [searchOrderId, setSearchOrderId] = useState<string>("");
    const [sortBy, setSortBy] = useState<"createdDesc" | "createdAsc" | "totalDesc" | "totalAsc">("createdDesc");
    const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
    const [page, setPage] = useState(1);

    const statusOptions = useMemo(() => {
        return Array.from(new Set(orders.map((o) => o.status))).sort();
    }, [orders]);

    const filteredAndSorted = useMemo(() => {
        const q = searchOrderId.trim();
        const filtered = orders.filter((o) => {
            const statusOk = statusFilter === "ALL" || o.status === statusFilter;
            const idOk = q === "" || String(o.orderId).includes(q);
            return statusOk && idOk;
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
    }, [orders, searchOrderId, sortBy, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pageRows = filteredAndSorted.slice(start, start + pageSize);

    const resetFilters = () => {
        setStatusFilter("ALL");
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
                    <p className="mt-1.5 text-sm text-slate-500">Theo dõi giao hàng và thanh toán cho từng đơn.</p>
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
                        <div className="grid md:grid-cols-5 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Lọc theo trạng thái đơn</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value="ALL">Tất cả</option>
                                    {statusOptions.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
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
                            <div>
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
                            <div>
                                <label className="text-xs font-medium text-slate-600">Số đơn mỗi trang</label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value) as 20 | 50 | 100);
                                        setPage(1);
                                    }}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            <div className="flex items-end">
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
                            Không có đơn phù hợp với bộ lọc.
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-auto max-h-[620px]">
                            <table className="w-full min-w-[1120px]">
                                <thead className="sticky top-0 z-10 bg-slate-50">
                                    <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                                        <th className="py-3 px-4">Mã đơn</th>
                                        <th className="py-3 px-4">Ngày tạo</th>
                                        <th className="py-3 px-4">Giờ tạo</th>
                                        <th className="py-3 px-4">Trạng thái đơn</th>
                                        <th className="py-3 px-4">Số sản phẩm</th>
                                        <th className="py-3 px-4">Thành tiền (VNĐ)</th>
                                        <th className="py-3 px-4">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map((o) => (
                                        <tr key={o.orderId} className="border-b border-slate-100 text-sm">
                                            <td className="py-3 px-4 font-semibold text-slate-900">#{o.orderId}</td>
                                            <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{formatVietnamDate(o.createdAt)}</td>
                                            <td className="py-3 px-4 text-slate-700 whitespace-nowrap tabular-nums">{formatVietnamTime(o.createdAt)}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-[11px] font-medium text-slate-500">Giao hàng</p>
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${getOrderStatusTone(o.status)}`}
                                                    >
                                                        {orderStatusLabel(o.status)}
                                                    </span>
                                                    <p className="text-[11px] font-medium text-slate-500">Thanh toán</p>
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${paymentStatusTone(o.latestPaymentStatus)}`}
                                                    >
                                                        {paymentStatusLabel(o.latestPaymentStatus)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-700">{o.itemCount}</td>
                                            <td className="py-3 px-4 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                                            <td className="py-3 px-4">
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

