import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useGetAllComplaintsForStaffQuery, useVerifyComplaintMutation } from "../api/complaint.api";

type ComplaintListMode = "all" | "pending" | "processed";

type StaffComplaintsPageProps = {
  mode?: ComplaintListMode;
};

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

export default function StaffComplaintsPage({ mode = "all" }: StaffComplaintsPageProps) {
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [page, setPage] = useState(1);
  const [verifyComplaint, { isLoading: isVerifying }] = useVerifyComplaintMutation();
  const fetchTake = 500;
  const {
    data: allRows = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetAllComplaintsForStaffQuery({ skip: 0, take: fetchTake });

  const filteredRows = useMemo(() => {
    if (mode === "pending") return allRows.filter((r) => r.status === "Pending");
    if (mode === "processed") return allRows.filter((r) => r.status !== "Pending");
    return allRows;
  }, [allRows, mode]);

  const total = filteredRows.length;
  const start = (page - 1) * pageSize;
  const visibleRows = filteredRows.slice(start, start + pageSize);
  const hasNext = start + pageSize < total;

  useEffect(() => {
    setPage(1);
  }, [pageSize, mode]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, pageSize, total]);

  const pageTitle =
    mode === "pending"
      ? "Khiếu nại chờ xử lý"
      : mode === "processed"
        ? "Khiếu nại đã xử lý"
        : "Xử lý khiếu nại (Staff)";
  const pageDesc =
    mode === "pending"
      ? "Danh sách khiếu nại đang chờ xử lý."
      : mode === "processed"
        ? "Danh sách khiếu nại đã xử lý (chấp nhận/từ chối/đóng)."
        : "Danh sách khiếu nại cho Admin/Sales/Manager chấp nhận hoặc từ chối.";
  const showActions = mode !== "processed";

  const onVerify = async (id: number, approved: boolean) => {
    const t = toast.loading(approved ? `Đang chấp nhận #${id}...` : `Đang từ chối #${id}...`);
    try {
      await verifyComplaint({ complaintId: id, approved }).unwrap();
      toast.success(approved ? `Đã chấp nhận khiếu nại #${id}.` : `Đã từ chối khiếu nại #${id}.`, { id: t });
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Xử lý khiếu nại thất bại."), { id: t });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">{pageDesc}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Hiển thị mỗi trang</label>
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
            Làm mới
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : visibleRows.length === 0 ? (
          <p className="text-sm text-slate-500">Không có khiếu nại nào.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="py-2 px-3 text-left">ID</th>
                  <th className="py-2 px-3 text-left">Đơn/Box</th>
                  <th className="py-2 px-3 text-left">Loại</th>
                  <th className="py-2 px-3 text-right">Số lượng</th>
                  <th className="py-2 px-3 text-left">Trạng thái</th>
                  <th className="py-2 px-3 text-left">Ảnh minh chứng</th>
                  <th className="py-2 px-3 text-left">Mô tả</th>
                  <th className="py-2 px-3 text-left">Tạo lúc</th>
                  {showActions && <th className="py-2 px-3 text-left">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 px-3 font-semibold">#{r.id}</td>
                    <td className="py-2 px-3">Đơn hàng {r.orderId} / {r.boxCode ?? `Box#${r.boxId}`}</td>
                    <td className="py-2 px-3">{r.type}</td>
                    <td className="py-2 px-3 text-right">{r.damagedQuantity}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="py-2 px-3">
                      {r.customerEvidenceUrl ? (
                        <a
                          href={r.customerEvidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 hover:opacity-90"
                          title="Mở ảnh minh chứng"
                        >
                          <img
                            src={r.customerEvidenceUrl}
                            alt={`Evidence-${r.id}`}
                            className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                            loading="lazy"
                          />
                          <span className="text-xs font-semibold text-indigo-700 hover:text-indigo-800">
                            Xem ảnh
                          </span>
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3">{r.description ?? "—"}</td>
                    <td className="py-2 px-3">{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                    {showActions && (
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => onVerify(r.id, true)}
                            disabled={r.status !== "Pending" || isVerifying}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Chấp nhận
                          </button>
                          <button
                            type="button"
                            onClick={() => onVerify(r.id, false)}
                            disabled={r.status !== "Pending" || isVerifying}
                            className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isFetching && !isLoading && <p className="mt-2 text-xs text-slate-500">Đang cập nhật...</p>}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Trước
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
