import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
} from "../../purchase-order/api/purchase-order.api";
import { ArrowLeft, FilePlus, Loader2, Eye, X, Pencil, Trash2, CheckCircle } from "lucide-react";

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

  const { data: list = [], isLoading, isError, error, refetch } = useGetPurchaseOrdersQuery();
  const { data: order, isLoading: loadingOrder } = useGetPurchaseOrderByIdQuery(detailModalId ?? 0, {
    skip: !detailModalId,
  });
  const [deletePo, { isLoading: isDeleting }] = useDeletePurchaseOrderMutation();
  const [approvePo, { isLoading: isApproving }] = useApprovePurchaseOrderMutation();

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

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm">
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
              <h1 className="text-xl font-semibold text-slate-900">
                {isAdmin ? "Duyệt đơn mua hàng" : "Danh sách đơn mua"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7FBB35] text-white text-sm font-medium hover:bg-[#598325]"
            >
              <FilePlus size={18} />
              Tạo đơn mua
            </button>
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
        ) : list.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">Chưa có đơn mua nào.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Mã đơn</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nhà cung cấp</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Ngày đặt</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((po) => (
                  <tr
                    key={po.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{po.orderCode}</td>
                    <td className="px-4 py-3 text-slate-700">{po.supplierName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          po.status === "Approved"
                            ? "text-emerald-600"
                            : po.status === "Pending"
                              ? "text-amber-600"
                              : "text-slate-600"
                        }
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {po.orderDate
                        ? new Date(po.orderDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailModalId(po.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50"
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
      </div>

      {/* Modal chi tiết đơn mua */}
      {detailModalId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !loadingOrder && setDetailModalId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
              <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
                Chi tiết đơn mua
              </h2>
              <button
                type="button"
                onClick={() => setDetailModalId(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {loadingOrder || !order ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Mã đơn</span>
                      <p className="font-medium text-slate-800">{order.orderCode}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Nhà cung cấp</span>
                      <p className="font-medium text-slate-800">{order.supplierName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Trạng thái</span>
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
                      <span className="text-slate-500 block">Ngày đặt</span>
                      <p className="font-medium text-slate-800">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString("vi-VN") : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold text-slate-700">Sản phẩm</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-700">KL đặt</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-700">Đã nhận</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-700">Đơn giá</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-700">Thu hoạch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.details?.map((d) => (
                          <tr key={d.id} className="border-b border-slate-100">
                            <td className="py-2 px-3 text-slate-800">{d.productName}</td>
                            <td className="py-2 px-3 text-right text-slate-700">{d.orderedWeight}</td>
                            <td className="py-2 px-3 text-right text-slate-700">{d.receivedWeight}</td>
                            <td className="py-2 px-3 text-right text-slate-700">{d.unitPrice}</td>
                            <td className="py-2 px-3 text-right text-slate-600">
                              {d.harvestDate
                                ? new Date(d.harvestDate).toLocaleDateString("vi-VN")
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

            {order && !loadingOrder && (
              <div className="flex flex-wrap items-center justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
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
