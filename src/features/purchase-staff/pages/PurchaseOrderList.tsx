import { useNavigate, useLocation } from "react-router-dom";
import { useGetPurchaseOrdersQuery } from "../../purchase-order/api/purchase-order.api";
import { ArrowLeft, FilePlus, Loader2, Eye } from "lucide-react";

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin/purchase-orders");
  const backLink = isAdmin ? "/admin/dashboard" : "/purchase-staff/dashboard";
  const createLink = isAdmin ? "/admin/purchase-orders/create" : "/purchase-staff/orders/create";
  const detailLink = (id: number) =>
    isAdmin ? `/admin/purchase-orders/${id}` : `/purchase-staff/orders/${id}`;

  const { data: list = [], isLoading, isError } = useGetPurchaseOrdersQuery();

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
          <p className="text-red-500 text-sm py-6">Không tải được danh sách đơn mua.</p>
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
                        onClick={() => navigate(detailLink(po.id))}
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
    </div>
  );
}
