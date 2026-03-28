import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
} from "../../purchase-order/api/purchase-order.api";
import { useGetSuppliersQuery } from "../../supplier/api/supplier.api";
import { ArrowLeft, FilePlus, Loader2, Eye, X, Pencil, Trash2, CheckCircle } from "lucide-react";

function toVietnamesePoStatus(status: string): string {
  switch (status) {
    case "Pending":
      return "Chờ duyệt";
    case "Approved":
      return "Đã duyệt";
    case "Rejected":
      return "Đã từ chối";
    case "Completed":
      return "Hoàn tất";
    case "Cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin/purchase-orders");
  const backLink = isAdmin ? "/admin/dashboard" : "/purchase-staff/dashboard";
  const createLink = isAdmin ? "/admin/purchase-orders/create" : "/purchase-staff/orders/create";
  const editLink = (id: number) =>
    isAdmin ? `/admin/purchase-orders/${id}/edit` : `/purchase-staff/orders/${id}/edit`;

  const [detailModalId, setDetailModalId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<number | 0>(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [dateError, setDateError] = useState<string | null>(null);

  const { data: list = [], isLoading, isError, error, refetch } = useGetPurchaseOrdersQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: order, isLoading: loadingOrder } = useGetPurchaseOrderByIdQuery(detailModalId ?? 0, {
    skip: !detailModalId,
  });
  const [deletePo, { isLoading: isDeleting }] = useDeletePurchaseOrderMutation();
  const [approvePo, { isLoading: isApproving }] = useApprovePurchaseOrderMutation();

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set(list.map((po) => po.status))).filter(Boolean);
    return values.sort((a, b) => a.localeCompare(b));
  }, [list]);

  const handleDelete = async () => {
    if (!order || !confirmDelete) return;
    try {
      await deletePo(order.id).unwrap();
      setDetailModalId(null);
      setConfirmDelete(false);
    } catch {
      setConfirmDelete(false);
    }
  };

  const handleApprove = async () => {
    if (!order || order.status !== "Pending") return;
    try {
      await approvePo(order.id).unwrap();
    } catch {
      // Error handled by mutation
    }
  };

  const canEdit = !isAdmin && order?.status === "Pending";
  const canApprove = isAdmin && order?.status === "Pending";

  // Tính toán và validate khoảng ngày lọc
  const dateValidation = useMemo(() => {
    const todayOnly = new Date();
    const today = new Date(
      todayOnly.getFullYear(),
      todayOnly.getMonth(),
      todayOnly.getDate(),
    );

    const hasFrom = !!fromDate;
    const hasTo = !!toDate;

    const fromOnly = hasFrom
      ? (() => {
          const d = new Date(fromDate);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        })()
      : null;
    const toOnly = hasTo
      ? (() => {
          const d = new Date(toDate);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        })()
      : null;

    let invalid = false;
    if (fromOnly && toOnly && fromOnly > toOnly) invalid = true;
    if (fromOnly && fromOnly > today) invalid = true;

    return { invalid, fromOnly, toOnly };
  }, [fromDate, toDate]);

  // Cập nhật thông báo lỗi cho khoảng ngày
  useEffect(() => {
    if (dateValidation.invalid) {
      setDateError(
        "Ngày từ phải nhỏ hơn hoặc bằng ngày đến, và không được lớn hơn ngày hiện tại.",
      );
    } else {
      setDateError(null);
    }
  }, [dateValidation]);

  const filteredList = useMemo(() => {
    return list.filter((po) => {
      if (supplierFilter && po.supplierId !== supplierFilter) return false;
      if (statusFilter !== "ALL" && po.status !== statusFilter) return false;

      // Nếu ngày lọc hợp lệ thì áp dụng filter theo ngày
      if (!dateValidation.invalid && (fromDate || toDate)) {
        if (!po.orderDate) return false;
        const d = new Date(po.orderDate);
        const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (fromDate && dateValidation.fromOnly && dOnly < dateValidation.fromOnly) {
          return false;
        }
        if (toDate && dateValidation.toOnly && dOnly > dateValidation.toOnly) {
          return false;
        }
      }

      return true;
    });
  }, [list, supplierFilter, statusFilter, fromDate, toDate, dateValidation]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [supplierFilter, statusFilter, fromDate, toDate]);

  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedList = filteredList.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 py-6">
      <div className="w-full max-w-[1600px] mx-auto">
        {/* Header tương tự CategoryList */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(backLink)}
              className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:border-slate-300"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isAdmin ? "Duyệt đơn mua hàng" : "Danh sách đơn mua"}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdmin
                  ? "Purchasing Staff tạo đơn → Admin duyệt. Bấm vào đơn để xem và duyệt."
                  : "Danh sách đơn mua do bạn tạo. Bấm để xem chi tiết."}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => navigate(createLink)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl py-3 px-5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <FilePlus size={18} />
              Tạo đơn mua
            </button>
          )}
        </div>

        {/* Card nội dung */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Bộ lọc trên FE */}
        <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
              Nhà cung cấp
            </label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(Number(e.target.value) || 0)}
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
                  {toVietnamesePoStatus(status)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          {dateError && (
            <p className="xl:col-span-4 text-[11px] text-red-500">
              {dateError}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-slate-400" />
          </div>
        ) : isError ? (
          <div className="py-6">
            <p className="text-red-500 text-sm">Không tải được danh sách đơn mua.</p>
            <p className="text-slate-500 text-xs mt-1">
              {(error as { status?: number })?.status === 401 && "Vui lòng đăng nhập lại."}
              {(error as { status?: number })?.status === 404 && " API không tìm thấy (kiểm tra URL backend)."}
              {(error as { status?: number })?.status === 500 && " Lỗi server (xem log backend)."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm text-[#1a5f2a] font-medium hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : filteredList.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">Không có đơn mua nào phù hợp với bộ lọc.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Mã đơn
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Nhà cung cấp
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Người tạo
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Ngày đặt
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedList.map((po) => (
                  <tr
                    key={po.id}
                    className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-900">{po.orderCode}</td>
                    <td className="px-5 py-3.5 text-slate-700">{po.supplierName}</td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {po.createdByName && po.createdByName.trim().length > 0
                        ? po.createdByName
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          po.status === "Approved"
                            ? "text-emerald-600"
                            : po.status === "Pending"
                              ? "text-amber-600"
                              : "text-slate-600"
                        }
                      >
                        {toVietnamesePoStatus(po.status)}
                      </span>
                    </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[140px]">
                      {po.orderDate
                        ? new Date(po.orderDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailModalId(po.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Eye size={14} />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && filteredList.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-xs text-slate-500">
              Hiển thị <span className="font-semibold text-slate-700">{startIndex + 1}</span>–
              <span className="font-semibold text-slate-700">{endIndex}</span> /{" "}
              <span className="font-semibold text-slate-700">{totalItems}</span> đơn mua
            </p>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Trang trước
              </button>

              <span className="text-xs text-slate-500 px-1">
                Trang <span className="font-semibold text-slate-700">{safePage}</span> /{" "}
                <span className="font-semibold text-slate-700">{totalPages}</span>
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modal chi tiết đơn mua — style giống modal cập nhật nhà cung cấp */}
      {detailModalId != null && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => !loadingOrder && setDetailModalId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-[18px] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <div>
                <h2
                  id="modal-title"
                  className="text-base md:text-lg font-semibold text-slate-900"
                >
                  Chi tiết đơn mua
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Xem thông tin và duyệt đơn mua hàng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalId(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 bg-slate-50">
              {loadingOrder || !order ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  {/* Thông tin đơn */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4">
                    <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Mã đơn
                        </span>
                        <p className="font-semibold text-slate-900 mt-1">
                          {order.orderCode}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Nhà cung cấp
                        </span>
                        <p className="font-medium text-slate-900 mt-1">
                          {order.supplierName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Người tạo
                        </span>
                        <p className="font-medium text-slate-900 mt-1">
                          {order.createdByName &&
                          order.createdByName.trim().length > 0
                            ? order.createdByName
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Trạng thái
                        </span>
                        <p className="font-medium mt-1">
                          <span
                            className={
                              order.status === "Approved"
                                ? "text-emerald-600"
                                : order.status === "Pending"
                                  ? "text-amber-600"
                                  : "text-rose-600"
                            }
                          >
                            {toVietnamesePoStatus(order.status)}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Ngày đặt
                        </span>
                        <p className="font-medium text-slate-900 mt-1">
                          {order.orderDate
                            ? new Date(
                                order.orderDate,
                              ).toLocaleDateString("vi-VN")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bảng chi tiết */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left py-2.5 px-3 font-semibold text-slate-700">
                            Sản phẩm
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-700">
                            KL đặt
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-700">
                            Đã nhận
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-700">
                            Còn lại
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-700">
                            Đơn giá
                          </th>
                          <th className="text-right py-2.5 px-3 font-semibold text-slate-700">
                            Thu hoạch
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.details?.map((d) => (
                          <tr
                            key={d.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2.5 px-3 text-slate-800">
                              {d.productName}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-700">
                              {d.orderedWeight}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-700">
                              {d.receivedWeight}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-700">
                              {d.remainingWeight}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-700">
                              {d.unitPrice.toLocaleString("vi-VN")}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">
                              {d.harvestDate
                                ? new Date(
                                    d.harvestDate,
                                  ).toLocaleDateString("vi-VN")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal footer */}
            {order && !loadingOrder && (
              <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                {canApprove && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isApproving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Duyệt đơn
                  </button>
                )}
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(editLink(order.id))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                      <Pencil size={16} /> Sửa
                    </button>
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Xóa
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? "Đang xóa..." : "Chắc chắn xóa"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setDetailModalId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
