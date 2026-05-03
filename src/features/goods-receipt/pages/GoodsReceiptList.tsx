import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetGoodsReceiptsQuery } from "../api/goods-receipt.api";
import { useGetSuppliersQuery } from "../../supplier/api/supplier.api";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";
import { Loader2, FileText, FilePlus2, Eye } from "lucide-react";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";
import { formatVietnamDate, parseApiDateInput } from "../../../shared/lib/vietnamTime";

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toVietnameseReceiptStatus(status: string): string {
  switch (status) {
    case "Draft":
      return "Nháp";
    case "Received":
      return "Đã nhận";
    case "QCCompleted":
      return "Đã hoàn tất kiểm tra chất lượng";
    case "PendingManagerApproval":
      return "Chờ quản lý duyệt";
    case "PendingManagerApprovalQc":
      return "Chờ quản lý duyệt (kiểm tra chất lượng)";
    case "Approved":
      return "Đã duyệt";
    case "Rejected":
      return "Đã từ chối";
    default:
      return status;
  }
}

export default function GoodsReceiptList() {
  const navigate = useNavigate();
  const { isManager, isWarehouseStaff } = useRoleGuard();
  const basePath = isWarehouseStaff()
    ? "/warehouse/goods-receipts"
    : isManager()
      ? "/manager/goods-receipts"
      : "/admin/goods-receipts";
  const { data: receipts = [], isLoading, isError, error, refetch } =
    useGetGoodsReceiptsQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: warehouses = [] } = useGetWarehousesQuery();

  const [supplierFilter, setSupplierFilter] = useState<number | 0>(0);
  const [warehouseFilter, setWarehouseFilter] = useState<number | 0>(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;
  const todayDateInput = useMemo(() => toDateInputValue(new Date()), []);

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set(receipts.map((r) => r.status))).filter(Boolean);
    return values.sort((a, b) => a.localeCompare(b));
  }, [receipts]);

  const filtered = useMemo(
    () =>
      receipts
        .filter((r) => {
        if (supplierFilter && r.supplierId !== supplierFilter) return false;
        if (warehouseFilter && r.warehouseId !== warehouseFilter) return false;
        if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

        const safeFromDate =
          fromDateFilter && fromDateFilter <= todayDateInput
            ? fromDateFilter
            : "";
        const safeToDate =
          toDateFilter && (!safeFromDate || toDateFilter >= safeFromDate)
            ? toDateFilter
            : "";

        if (safeFromDate || safeToDate) {
          const receivedAt = r.receivedDate ? parseApiDateInput(r.receivedDate) : null;
          if (!receivedAt || Number.isNaN(receivedAt.getTime())) return false;

          if (safeFromDate) {
            const fromDate = new Date(safeFromDate);
            fromDate.setHours(0, 0, 0, 0);
            if (receivedAt < fromDate) return false;
          }

          if (safeToDate) {
            const toDate = new Date(safeToDate);
            toDate.setHours(23, 59, 59, 999);
            if (receivedAt > toDate) return false;
          }
        }

        return true;
      })
        .sort((a, b) => {
          const aTime = a.receivedDate ? parseApiDateInput(a.receivedDate).getTime() : 0;
          const bTime = b.receivedDate ? parseApiDateInput(b.receivedDate).getTime() : 0;

          if (aTime !== bTime) {
            return sortDirection === "ASC" ? aTime - bTime : bTime - aTime;
          }

          // Nếu cùng ngày nhận thì dùng id để giữ thứ tự ổn định.
          return sortDirection === "ASC" ? a.id - b.id : b.id - a.id;
        }),
    [
      receipts,
      supplierFilter,
      warehouseFilter,
      statusFilter,
      sortDirection,
      fromDateFilter,
      toDateFilter,
      todayDateInput,
    ],
  );

  const isFromDateInvalid = !!fromDateFilter && fromDateFilter > todayDateInput;
  const isToDateInvalid =
    !!fromDateFilter && !!toDateFilter && toDateFilter < fromDateFilter;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePageIndex = Math.min(Math.max(1, pageIndex), totalPages);

  const paged = useMemo(() => {
    const start = (safePageIndex - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePageIndex]);

  // reset về trang 1 khi đổi filter / data
  useEffect(() => {
    setPageIndex(1);
  }, [
    supplierFilter,
    warehouseFilter,
    statusFilter,
    fromDateFilter,
    toDateFilter,
    receipts.length,
  ]);

  const statusClass = (status: string) => {
    if (status === "Approved") return "text-emerald-600";
    if (status === "PendingManagerApproval" || status === "Pending")
      return "text-amber-600";
    if (status === "Rejected") return "text-red-600";
    return "text-slate-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <FileText size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Danh sách phiếu nhập kho
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý phiếu nhận hàng từ nhà cung cấp vào kho.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/create`)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 sm:w-auto"
          >
            <FilePlus2 size={16} />
            Tạo phiếu nhập
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Bộ lọc */}
          <div className="px-3 py-3 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 sm:px-4 sm:py-4 lg:px-6">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Nhà cung cấp
              </label>
              <select
                value={supplierFilter}
                onChange={(e) =>
                  setSupplierFilter(Number(e.target.value) || 0)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value={0}>Tất cả nhà cung cấp</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Kho
              </label>
              <select
                value={warehouseFilter}
                onChange={(e) =>
                  setWarehouseFilter(Number(e.target.value) || 0)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value={0}>Tất cả kho</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {toVietnameseReceiptStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Sắp xếp
              </label>
              <select
                value={sortDirection}
                onChange={(e) =>
                  setSortDirection(e.target.value === "ASC" ? "ASC" : "DESC")
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value="DESC">Từ trên xuống</option>
                <option value="ASC">Từ dưới lên</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={fromDateFilter}
                max={todayDateInput}
                onChange={(e) => {
                  const next = e.target.value;
                  const normalized = next && next > todayDateInput ? todayDateInput : next;
                  setFromDateFilter(normalized);
                  if (toDateFilter && normalized && toDateFilter < normalized) {
                    setToDateFilter(normalized);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={toDateFilter}
                min={fromDateFilter || undefined}
                max={todayDateInput}
                onChange={(e) => {
                  const next = e.target.value;
                  const normalized = next && next > todayDateInput ? todayDateInput : next;
                  if (fromDateFilter && normalized && normalized < fromDateFilter) {
                    setToDateFilter(fromDateFilter);
                    return;
                  }
                  setToDateFilter(normalized);
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          {(isFromDateInvalid || isToDateInvalid) && (
            <div className="px-6 pb-3 -mt-1">
              <p className="text-xs text-rose-600">
                {isFromDateInvalid
                  ? "Từ ngày phải nhỏ hơn hoặc bằng ngày hiện tại."
                  : "Đến ngày phải lớn hơn hoặc bằng Từ ngày."}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-slate-400" />
            </div>
          ) : isError ? (
            <div className="py-6 px-6">
              <p className="text-red-500 text-sm">
                Không tải được danh sách phiếu nhập kho.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {(error as { status?: number })?.status === 401 &&
                  "Vui lòng đăng nhập lại."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm text-emerald-700 font-medium hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">
              Không có phiếu nhập kho nào phù hợp.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Mã phiếu
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Nhà cung cấp
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Kho
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ngày nhận
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td
                        className="px-5 py-3.5 font-medium text-slate-900 cursor-pointer"
                        onClick={() => navigate(`${basePath}/${r.id}`)}
                      >
                        {r.receiptCode}
                      </td>
                      <td
                        className="px-5 py-3.5 text-slate-700 cursor-pointer"
                        onClick={() => navigate(`${basePath}/${r.id}`)}
                      >
                        {r.supplierName}
                      </td>
                      <td
                        className="px-5 py-3.5 text-slate-700 cursor-pointer"
                        onClick={() => navigate(`${basePath}/${r.id}`)}
                      >
                        {r.warehouseName}
                      </td>
                      <td
                        className="px-5 py-3.5 text-slate-600 cursor-pointer"
                        onClick={() => navigate(`${basePath}/${r.id}`)}
                      >
                        {r.receivedDate ? formatVietnamDate(r.receivedDate) : "—"}
                      </td>
                      <td
                        className="px-5 py-3.5 cursor-pointer"
                        onClick={() => navigate(`${basePath}/${r.id}`)}
                      >
                        <span
                          className={`text-sm font-medium ${statusClass(
                            r.status,
                          )}`}
                        >
                          {toVietnameseReceiptStatus(r.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/${r.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                        >
                          <Eye size={14} className="text-emerald-600" />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-3 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:px-4 sm:py-4 lg:px-6">
                <p className="text-xs text-slate-500">
                  Hiển thị{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min((safePageIndex - 1) * pageSize + 1, filtered.length)}
                  </span>{" "}
                  –{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(safePageIndex * pageSize, filtered.length)}
                  </span>{" "}
                  / {filtered.length} phiếu
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setPageIndex(1)}
                    disabled={safePageIndex <= 1}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Đầu
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                    disabled={safePageIndex <= 1}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Trước
                  </button>
                  <span className="text-xs text-slate-600 px-2">
                    Trang{" "}
                    <span className="font-semibold text-slate-800">
                      {safePageIndex}
                    </span>{" "}
                    / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                    disabled={safePageIndex >= totalPages}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Sau
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageIndex(totalPages)}
                    disabled={safePageIndex >= totalPages}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Cuối
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

