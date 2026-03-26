import toast from "react-hot-toast";
import { useState } from "react";
import { useGetAllComplaintsForStaffQuery, useVerifyComplaintMutation } from "../api/complaint.api";

function statusTone(status: string) {
  if (status === "Pending") return "bg-amber-100 text-amber-700 border-amber-200";
  if (status === "Verified") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Rejected") return "bg-rose-100 text-rose-700 border-rose-200";
  if (status === "Closed") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { message?: string; error?: string; detail?: string }; message?: string };
  return e?.data?.message || e?.data?.error || e?.data?.detail || e?.message || fallback;
}

export default function StaffComplaintsPage() {
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [page, setPage] = useState(1);
  const skip = (page - 1) * pageSize;
  const { data: rows = [], isLoading, isFetching, refetch } = useGetAllComplaintsForStaffQuery({ skip, take: pageSize });
  const [verifyComplaint, { isLoading: isVerifying }] = useVerifyComplaintMutation();
  const hasNext = rows.length === pageSize;

  const onVerify = async (id: number, approved: boolean) => {
    const t = toast.loading(approved ? `Dang chap nhan #${id}...` : `Dang tu choi #${id}...`);
    try {
      await verifyComplaint({ complaintId: id, approved }).unwrap();
      toast.success(approved ? `Da chap nhan khiếu nại #${id}.` : `Da tu choi khiếu nại #${id}.`, { id: t });
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Xu ly khiếu nại that bai."), { id: t });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">Xu ly khiếu nại (Staff)</h1>
        <p className="mt-1 text-sm text-slate-600">Danh sach complaint cho Admin/Sales/Manager duyet hoac tu choi.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">So dong/trang</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as 20 | 50 | 100);
                setPage(1);
              }}
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button onClick={() => refetch()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Lam moi
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Dang tai...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Khong co khiếu nại nao.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="py-2 px-3 text-left">ID</th>
                  <th className="py-2 px-3 text-left">Don/Box</th>
                  <th className="py-2 px-3 text-left">Loai</th>
                  <th className="py-2 px-3 text-right">So luong</th>
                  <th className="py-2 px-3 text-left">Trang thai</th>
                  <th className="py-2 px-3 text-left">Mo ta</th>
                  <th className="py-2 px-3 text-left">Tao luc</th>
                  <th className="py-2 px-3 text-left">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 px-3 font-semibold">#{r.id}</td>
                    <td className="py-2 px-3">#{r.orderId} / {r.boxCode ?? `Box#${r.boxId}`}</td>
                    <td className="py-2 px-3">{r.type}</td>
                    <td className="py-2 px-3 text-right">{r.damagedQuantity}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="py-2 px-3">{r.description ?? "—"}</td>
                    <td className="py-2 px-3">{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onVerify(r.id, true)}
                          disabled={r.status !== "Pending" || isVerifying}
                          className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Chap nhan
                        </button>
                        <button
                          type="button"
                          onClick={() => onVerify(r.id, false)}
                          disabled={r.status !== "Pending" || isVerifying}
                          className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          Tu choi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isFetching && !isLoading && <p className="mt-2 text-xs text-slate-500">Dang cap nhat...</p>}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Truoc
          </button>
          <span className="text-sm text-slate-600">Trang {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
