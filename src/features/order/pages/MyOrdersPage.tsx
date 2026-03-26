import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "../../../shared/constants/routes";
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
    if (status === "Paid") return "bg-lime-100 text-lime-700 border-lime-200";
    if (status === "Shipping") return "bg-cyan-100 text-cyan-700 border-cyan-200";
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
    if (status === "Paid") return "Đã thanh toán";
    if (status === "Shipping") return "Đang giao";
    if (status === "Completed") return "Hoàn thành";
    if (status === "Cancelled") return "Đã hủy";
    if (status === "InventoryFailed") return "Thiếu tồn kho";
    return status;
}

function paymentStatusLabel(status?: string | null) {
    if (!status) return "N/A";
    if (status === "Pending") return "Chờ xử lý";
    if (status === "Processing") return "Đang xử lý";
    if (status === "Paid" || status === "Success") return "Đã thanh toán";
    if (status === "Cancelled") return "Đã hủy";
    if (status === "Failed") return "Thất bại";
    return status;
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
            sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else if (sortBy === "createdDesc") {
            sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList size={22} />
                    Đơn hàng của tôi
                </h1>
                <span className="text-sm text-slate-600">
                    Tổng đơn: <span className="font-semibold text-slate-900">{orders.length}</span>
                </span>
            </div>

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
                <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="grid md:grid-cols-5 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Trạng thái</label>
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
                                <label className="text-xs font-medium text-slate-600">Tìm theo Order ID</label>
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
                                <label className="text-xs font-medium text-slate-600">Sắp xếp</label>
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
                                    <option value="totalDesc">Tổng tiền giảm dần</option>
                                    <option value="totalAsc">Tổng tiền tăng dần</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Số dòng/trang</label>
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
                        <div className="rounded-xl border border-slate-200 bg-white overflow-auto max-h-[620px]">
                            <table className="w-full min-w-[980px]">
                                <thead className="sticky top-0 z-10 bg-slate-50">
                                    <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                                        <th className="py-3 px-4">Mã đơn</th>
                                        <th className="py-3 px-4">Ngày tạo</th>
                                        <th className="py-3 px-4">Trạng thái</th>
                                        <th className="py-3 px-4">Số dòng</th>
                                        <th className="py-3 px-4">Tổng tiền</th>
                                        <th className="py-3 px-4">Thanh toán</th>
                                        <th className="py-3 px-4">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map((o) => (
                                        <tr key={o.orderId} className="border-b border-slate-100 text-sm">
                                            <td className="py-3 px-4 font-semibold text-slate-900">#{o.orderId}</td>
                                            <td className="py-3 px-4 text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${getOrderStatusTone(o.status)}`}
                                                >
                                                    {orderStatusLabel(o.status)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-700">{o.itemCount}</td>
                                            <td className="py-3 px-4 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                                            <td className="py-3 px-4 text-slate-700">{paymentStatusLabel(o.latestPaymentStatus)}</td>
                                            <td className="py-3 px-4">
                                                <Link
                                                    to={ROUTES.CUSTOMER_ORDER_DETAIL.replace(":id", String(o.orderId))}
                                                    className="inline-flex rounded-lg bg-[#1a5f2a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#145026]"
                                                >
                                                    Xem chi tiết
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
    );
}

