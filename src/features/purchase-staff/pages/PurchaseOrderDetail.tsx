import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useGetPurchaseOrderByIdQuery,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
} from "../../purchase-order/api/purchase-order.api";
import { ArrowLeft, Pencil, Trash2, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin/purchase-orders");
  const backLink = isAdmin ? "/admin/purchase-orders" : "/purchase-staff/dashboard";
  const editLink = isAdmin
    ? `/admin/purchase-orders/${id}/edit`
    : `/purchase-staff/orders/${id}/edit`;
  const showApprove = isAdmin; // Admin/Manager only (BE kiểm tra role)

  const poId = id ? parseInt(id, 10) : 0;
  const { data: order, isLoading, error } = useGetPurchaseOrderByIdQuery(poId, {
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
    if (!order || order.status !== "Pending") return;
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

  const canEdit = order.status === "Pending";
  const canApprove = showApprove && order.status === "Pending";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(backLink)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{order.orderCode}</h1>
            <p className="text-sm text-slate-500">
              {order.supplierName} · {order.status}
            </p>
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100"
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
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  {isDeleting ? "Đang xóa..." : "Chắc chắn xóa"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  Hủy
                </button>
              </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Nhà cung cấp</span>
            <p className="font-medium text-slate-800">{order.supplierName}</p>
          </div>
          <div>
            <span className="text-slate-500">Trạng thái</span>
            <p className="font-medium">
              <span
                className={
                  order.status === "Approved"
                    ? "text-emerald-600"
                    : order.status === "Pending"
                      ? "text-amber-600"
                      : "text-slate-600"
                }
              >
                {order.status}
              </span>
            </p>
          </div>
          <div>
            <span className="text-slate-500">Ngày đặt</span>
            <p className="font-medium text-slate-800">
              {order.orderDate ? new Date(order.orderDate).toLocaleDateString("vi-VN") : "-"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Sản phẩm</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">KL đặt</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Đã nhận</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Đơn giá</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Thu hoạch</th>
              </tr>
            </thead>
            <tbody>
              {order.details?.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-800">{d.productName}</td>
                  <td className="py-3 px-4 text-right text-slate-700">{d.orderedWeight}</td>
                  <td className="py-3 px-4 text-right text-slate-700">{d.receivedWeight}</td>
                  <td className="py-3 px-4 text-right text-slate-700">{d.unitPrice}</td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {d.harvestDate
                      ? new Date(d.harvestDate).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
