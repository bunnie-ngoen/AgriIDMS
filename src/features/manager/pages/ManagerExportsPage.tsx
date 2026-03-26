import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useApproveExportMutation,
  useCancelExportMutation,
  useGetPendingApproveExportsQuery,
  useLazyGetExportReceiptByIdQuery,
} from "../../export/api/export.api";

function exportStatusLabel(status: string) {
  if (status === "ReadyToExport") return "Sẵn sàng xuất";
  if (status === "Approved") return "Đã duyệt xuất";
  if (status === "Cancelled") return "Đã hủy";
  return status;
}

function exportStatusTone(status: string) {
  if (status === "ReadyToExport") return "bg-indigo-100 text-indigo-700 border-indigo-200";
  if (status === "Approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Cancelled") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function normalizeExportStatus(status?: string | null) {
  const s = (status ?? "").trim().replace(/\s/g, "");
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower === "readytoexport") return "ReadyToExport";
  if (lower === "approved") return "Approved";
  if (lower === "cancelled") return "Cancelled";
  return s;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const e = err as {
    data?: { message?: string; error?: string; detail?: string };
    message?: string;
  };
  return e?.data?.message || e?.data?.error || e?.data?.detail || e?.message || fallback;
}

export default function ManagerExportsPage() {
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [approvePage, setApprovePage] = useState(1);
  const [approveSort, setApproveSort] = useState<"createdAtDesc" | "createdAtAsc">("createdAtDesc");
  const [exportIdManual, setExportIdManual] = useState("");
  const [currentExportId, setCurrentExportId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const approveSkip = (approvePage - 1) * pageSize;
  const {
    data: pendingApproveRows = [],
    isLoading: isLoadingApprove,
    isFetching: isFetchingApprove,
    refetch: refetchPendingApprove,
  } = useGetPendingApproveExportsQuery({ skip: approveSkip, take: pageSize, sort: approveSort });

  const [loadExport, { data: receipt, isFetching: isLoadingReceipt }] =
    useLazyGetExportReceiptByIdQuery();
  const [approveExport, { isLoading: isApproving }] = useApproveExportMutation();
  const [cancelExport, { isLoading: isCancelling }] = useCancelExportMutation();

  const receiptNorm = normalizeExportStatus(receipt?.status);
  const canApprove = receiptNorm === "ReadyToExport";
  const canCancel = receiptNorm !== "Approved" && receiptNorm !== "Cancelled";
  const hasNextApprovePage = pendingApproveRows.length === pageSize;

  const summary = useMemo(() => {
    if (!receipt) return null;
    const totalQty = receipt.details.reduce((sum, d) => sum + Number(d.actualQuantity || 0), 0);
    return {
      boxCount: receipt.details.length,
      totalQty,
    };
  }, [receipt]);

  const openExportDetail = async (exportId: number, silentToast = false) => {
    setMsg("");
    setCurrentExportId(exportId);
    setExportIdManual(String(exportId));
    try {
      await loadExport(exportId).unwrap();
      if (!silentToast) toast.success(`Đã tải phiếu xuất #${exportId}.`);
    } catch (err) {
      const m = getApiErrorMessage(err, "Không tải được phiếu xuất.");
      setMsg(m);
      toast.error(m);
    }
  };

  const onLoadManual = async () => {
    const exportId = Number(exportIdManual);
    if (!Number.isInteger(exportId) || exportId <= 0) {
      const m = "Mã phiếu xuất không hợp lệ.";
      setMsg(m);
      toast.error(m);
      return;
    }
    await openExportDetail(exportId);
  };

  const onApprove = async (exportId?: number) => {
    const id = exportId ?? currentExportId;
    if (!id) return;
    const t = toast.loading(`Đang duyệt phiếu xuất #${id}...`);
    try {
      const res = await approveExport(id).unwrap();
      const st = normalizeExportStatus(res.status);
      toast.success(`Duyệt xuất thành công - Phiếu #${id} -> ${exportStatusLabel(st || res.status)}.`, {
        id: t,
      });
      if (currentExportId === id) await loadExport(id).unwrap();
      await refetchPendingApprove();
    } catch (err) {
      const m = getApiErrorMessage(err, "Duyệt phiếu xuất thất bại.");
      toast.error(m, { id: t });
      setMsg(m);
    }
  };

  const onCancel = async () => {
    if (!currentExportId) return;
    const t = toast.loading(`Đang hủy phiếu xuất #${currentExportId}...`);
    try {
      const res = await cancelExport(currentExportId).unwrap();
      const st = normalizeExportStatus(res.status);
      toast.success(`Hủy phiếu xuất thành công - #${currentExportId} -> ${exportStatusLabel(st || res.status)}.`, {
        id: t,
      });
      await loadExport(currentExportId).unwrap();
      await refetchPendingApprove();
    } catch (err) {
      const m = getApiErrorMessage(err, "Hủy phiếu xuất thất bại.");
      toast.error(m, { id: t });
      setMsg(m);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">Phê duyệt xuất kho (Manager)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi danh sách phiếu chờ duyệt, tra cứu nhanh theo mã và duyệt/hủy phiếu xuất.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Danh sách phiếu chờ duyệt</h2>
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
            {pendingApproveRows.length} phiếu/trang
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Sắp xếp</label>
            <select
              value={approveSort}
              onChange={(e) => {
                setApproveSort(e.target.value as typeof approveSort);
                setApprovePage(1);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="createdAtDesc">Phiếu mới nhất</option>
              <option value="createdAtAsc">Phiếu cũ nhất</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Hiển thị mỗi trang</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as 20 | 50 | 100);
                setApprovePage(1);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button
            type="button"
            onClick={async () => {
              await refetchPendingApprove();
              toast.success("Đã làm mới danh sách phiếu chờ duyệt.");
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>

        {isLoadingApprove ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : (
          <div className="overflow-auto max-h-[420px] rounded-lg border border-slate-200">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 px-3">Phiếu xuất</th>
                  <th className="py-2 px-3">Đơn hàng</th>
                  <th className="py-2 px-3">Trạng thái</th>
                  <th className="py-2 px-3">Số box</th>
                  <th className="py-2 px-3">Tạo lúc</th>
                  <th className="py-2 px-3 w-[200px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingApproveRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      Không có phiếu chờ duyệt.
                    </td>
                  </tr>
                ) : (
                  pendingApproveRows.map((r) => (
                    <tr key={r.exportId} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-semibold">Phiếu {r.exportId} - {r.exportCode}</td>
                      <td className="py-2 px-3">Đơn hàng {r.orderId}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${exportStatusTone(
                            normalizeExportStatus(r.status) || r.status,
                          )}`}
                        >
                          {exportStatusLabel(normalizeExportStatus(r.status) || r.status)}
                        </span>
                      </td>
                      <td className="py-2 px-3">{r.boxCount}</td>
                      <td className="py-2 px-3">{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => openExportDetail(r.exportId)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => onApprove(r.exportId)}
                            disabled={isApproving}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Duyệt xuất
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {isFetchingApprove && !isLoadingApprove && <p className="text-xs text-slate-500">Đang cập nhật...</p>}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setApprovePage((p) => Math.max(1, p - 1))}
            disabled={approvePage <= 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-sm text-slate-600">Trang {approvePage}</span>
          <button
            type="button"
            onClick={() => setApprovePage((p) => p + 1)}
            disabled={!hasNextApprovePage}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-800">Tìm phiếu theo mã</h2>
        <p className="mt-1 text-xs text-slate-600">
          Nhập mã phiếu xuất để mở nhanh chi tiết phiếu cần kiểm tra.
        </p>
        <div className="mt-2 flex gap-2 items-center">
          <input
            value={exportIdManual}
            onChange={(e) => setExportIdManual(e.target.value)}
            placeholder="Ví dụ: 123"
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          />
          <button
            type="button"
            onClick={onLoadManual}
            disabled={isLoadingReceipt}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            Tìm
          </button>
        </div>
      </div>

      {receipt && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Phiếu xuất</p>
                <p className="text-xl font-bold text-slate-900">Phiếu {receipt.id} - {receipt.exportCode}</p>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${exportStatusTone(
                  receiptNorm || receipt.status,
                )}`}
              >
                {exportStatusLabel(receiptNorm || receipt.status)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Đơn hàng</p>
                <p className="text-lg font-bold text-slate-900">Đơn hàng {receipt.orderId}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Số box</p>
                <p className="text-lg font-bold text-slate-900">{summary?.boxCount ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Khối lượng</p>
                <p className="text-lg font-bold text-slate-900">{summary?.totalQty ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Thời gian tạo</p>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(receipt.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onApprove()}
                disabled={!canApprove || isApproving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isApproving ? "Đang duyệt..." : "Duyệt xuất"}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={!canCancel || isCancelling}
                className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                {isCancelling ? "Đang hủy..." : "Hủy phiếu xuất"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!!msg && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {msg}
        </div>
      )}
    </div>
  );
}
