import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useGetPurchaseOrderStructuredByIdQuery,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
} from "../../purchase-order/api/purchase-order.api";
import { ArrowLeft, Pencil, Trash2, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

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

function toVietnameseProcurementMode(mode?: string): string {
  if (mode === "MultiSupplierStrictReceipt") return "Đa NCC - nhận đủ";
  if (mode === "LegacySingleSupplier") return "1 NCC - luồng cũ";
  return "Không xác định";
}

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin/purchase-orders");
  const isManager = location.pathname.startsWith("/manager/purchase-orders");
  const backLink = isAdmin
    ? "/admin/purchase-orders"
    : isManager
      ? "/manager/purchase-orders"
      : "/purchase-staff/dashboard";
  const editLink = isAdmin
    ? `/admin/purchase-orders/${id}/edit`
    : isManager
      ? `/manager/purchase-orders/${id}/edit`
      : `/purchase-staff/orders/${id}/edit`;
  const showApprove = isAdmin || isManager; // Admin/Manager only (BE kiểm tra role)

  const poId = id ? parseInt(id, 10) : 0;
  const { data: order, isLoading, error } = useGetPurchaseOrderStructuredByIdQuery(poId, {
    skip: !poId || Number.isNaN(poId),
  });
  const [deletePo, { isLoading: isDeleting }] = useDeletePurchaseOrderMutation();
  const [approvePo, { isLoading: isApproving }] = useApprovePurchaseOrderMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!order || !confirmDelete) return;
    try {
      await deletePo(order.id).unwrap();
      navigate(backLink);
    } catch {
      setConfirmDelete(false);
    }
  };

  const handleApprove = async () => {
    if (!order || order.status?.code !== "Pending") return;
    try {
      await approvePo(order.id).unwrap();
      // Refetch via invalidatesTags
    } catch {
      // Error handled by mutation
    }
  };

  if (Number.isNaN(poId) || poId < 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-slate-600">ID đơn không hợp lệ.</p>
        <button
          type="button"
          onClick={() => navigate(backLink)}
          className="mt-2 text-emerald-600 hover:underline"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
        {isLoading ? (
          <Loader2 size={32} className="animate-spin text-slate-400" />
        ) : error ? (
          <div>
            <p className="text-red-600">Không tìm thấy đơn mua hoặc lỗi tải dữ liệu.</p>
            <button
              type="button"
              onClick={() => navigate(backLink)}
              className="mt-2 text-emerald-600 hover:underline"
            >
              Quay lại
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const statusCode = order.status?.code ?? "";
  const canEdit = !showApprove && statusCode === "Pending";
  const canApprove = showApprove && statusCode === "Pending";
  const suppliers = order.supplierPlans.map((p) => p.supplier.supplierName).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(backLink)}
              className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Đơn mua · {order.orderCode}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  {toVietnameseProcurementMode(order.procurement?.mode)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    statusCode === "Approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : statusCode === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {order.status?.label || toVietnamesePoStatus(statusCode)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
          {canApprove && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Duyệt đơn
            </button>
          )}
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => navigate(editLink)}
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
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
        </div>
      </div>

        {/* Summary card */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 space-y-5">
            <div>
              <span className="text-slate-500 block text-xs font-medium mb-2">
                Nhà cung cấp tham gia
              </span>
              {suppliers.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {suppliers.map((name) => (
                    <span
                      key={name}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-medium text-slate-900">{suppliers[0] ?? "-"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-slate-100 pt-4">
            <div>
              <span className="text-slate-500 block text-xs font-medium">Kiểu đơn</span>
              <p className="font-medium text-slate-900 mt-1">
                {order.procurement?.label || toVietnameseProcurementMode(order.procurement?.mode)}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Trạng thái</span>
              <p className="font-medium mt-1">
                <span
                  className={
                    statusCode === "Approved"
                      ? "text-emerald-600"
                      : statusCode === "Pending"
                        ? "text-amber-600"
                        : "text-rose-600"
                  }
                >
                  {order.status?.label || toVietnamesePoStatus(statusCode)}
                </span>
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Người tạo</span>
              <p className="font-medium text-slate-900 mt-1">
                {order.createdBy?.name && order.createdBy.name.trim().length > 0
                  ? order.createdBy.name
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Ngày đặt</span>
              <p className="font-medium text-slate-900 mt-1">
                {order.orderDate
                  ? new Date(order.orderDate).toLocaleDateString("vi-VN")
                  : "-"}
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Tổng quan đơn mua</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500 block text-xs font-medium">Số NCC</span>
              <p className="font-semibold text-slate-900 mt-1">{order.summary.totalSuppliers}</p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Số sản phẩm</span>
              <p className="font-semibold text-slate-900 mt-1">{order.summary.totalProducts}</p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Tổng KL đặt (kg)</span>
              <p className="font-semibold text-slate-900 mt-1">{order.summary.totalOrderedWeight}</p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Tổng tiền dự kiến (VND)</span>
              <p className="font-semibold text-slate-900 mt-1">
                {order.summary.totalEstimatedAmount.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        {/* Supplier plans */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Kế hoạch theo nhà cung cấp
            </h2>
          </div>
          <div className="space-y-4 p-4">
            {order.supplierPlans.map((plan) => (
              <div key={`${plan.supplierPlanId}-${plan.supplier.supplierId}`} className="rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{plan.supplier.supplierName}</p>
                    <p className="text-xs text-slate-500">
                      Ngày đặt: {plan.orderDate ? new Date(plan.orderDate).toLocaleDateString("vi-VN") : "-"}
                      {plan.notes ? ` · Ghi chú: ${plan.notes}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>Tổng KL: <span className="font-semibold text-slate-900">{plan.summary.totalOrderedWeight}</span> kg</p>
                    <p>Tổng tiền: <span className="font-semibold text-slate-900">{plan.summary.totalEstimatedAmount.toLocaleString("vi-VN")}</span> VND</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white">
                        <th className="text-left py-2.5 px-4 font-semibold text-slate-700">Sản phẩm</th>
                        <th className="text-right py-2.5 px-4 font-semibold text-slate-700">KL đặt (kg)</th>
                        <th className="text-right py-2.5 px-4 font-semibold text-slate-700">Đơn giá (VND)</th>
                        <th className="text-right py-2.5 px-4 font-semibold text-slate-700">Ngày áp giá</th>
                        <th className="text-right py-2.5 px-4 font-semibold text-slate-700">Thành tiền (VND)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.details.map((line) => (
                        <tr key={line.lineId} className="border-b border-slate-100 hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 text-slate-800">{line.productName}</td>
                          <td className="py-2.5 px-4 text-right text-slate-700">{line.orderedWeight}</td>
                          <td className="py-2.5 px-4 text-right text-slate-700">{line.unitPriceAtOrder.toLocaleString("vi-VN")}</td>
                          <td className="py-2.5 px-4 text-right text-slate-600">
                            {line.priceDate ? new Date(line.priceDate).toLocaleDateString("vi-VN") : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-slate-800">
                            {line.lineAmount.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
