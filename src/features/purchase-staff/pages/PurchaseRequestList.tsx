import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { useGetPurchaseRequestsQuery } from "../../purchase-request/api/purchase-request.api";

export default function PurchaseRequestList() {
  const navigate = useNavigate();
  const { data = [], isLoading, isError, refetch } = useGetPurchaseRequestsQuery();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex justify-center py-16">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <p className="text-red-600 text-sm">Không tải được purchase requests.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchase Requests</h1>
          <p className="text-sm text-slate-500">Gom nhu cầu mua và theo dõi phân bổ thành các PO theo supplier.</p>
        </div>
        <button
          onClick={() => navigate("/purchase-staff/purchase-requests/create")}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-700"
        >
          <Plus size={16} /> Tạo request
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Mã request</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Ngày tạo</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-slate-500">Số dòng</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-slate-500">Tổng còn lại (kg)</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Chưa có purchase request nào.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.requestCode}</td>
                  <td className="px-4 py-3 text-slate-700">{item.status}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.requestedDate ? new Date(item.requestedDate).toLocaleDateString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.details.length}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {item.details.reduce((sum, d) => sum + Number(d.remainingWeight ?? 0), 0).toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
