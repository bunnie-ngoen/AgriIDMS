import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useApproveExportMutation,
  useCancelExportMutation,
  useGetPendingApproveExportsQuery,
  useLazyGetExportReceiptByIdQuery,
} from "../../export/api/export.api";

function exportStatusLabel(status: string) {
  if (status === "ReadyToExport") return "San sang xuat";
  if (status === "Approved") return "Da duyet xuat";
  if (status === "Cancelled") return "Da huy";
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
      if (!silentToast) toast.success(`Da tai phieu xuat #${exportId}.`);
    } catch (err) {
      const m = getApiErrorMessage(err, "Khong tai duoc phieu xuat.");
      setMsg(m);
      toast.error(m);
    }
  };

  const onLoadManual = async () => {
    const exportId = Number(exportIdManual);
    if (!Number.isInteger(exportId) || exportId <= 0) {
      const m = "ExportId khong hop le.";
      setMsg(m);
      toast.error(m);
      return;
    }
    await openExportDetail(exportId);
  };

  const onApprove = async (exportId?: number) => {
    const id = exportId ?? currentExportId;
    if (!id) return;
    const t = toast.loading(`Dang duyet phieu xuat #${id}...`);
    try {
      const res = await approveExport(id).unwrap();
      const st = normalizeExportStatus(res.status);
      toast.success(`Duyet xuat thanh cong - Phieu #${id} -> ${exportStatusLabel(st || res.status)}.`, {
        id: t,
      });
      if (currentExportId === id) await loadExport(id).unwrap();
      await refetchPendingApprove();
    } catch (err) {
      const m = getApiErrorMessage(err, "Duyet phieu xuat that bai.");
      toast.error(m, { id: t });
      setMsg(m);
    }
  };

  const onCancel = async () => {
    if (!currentExportId) return;
    const t = toast.loading(`Dang huy phieu xuat #${currentExportId}...`);
    try {
      const res = await cancelExport(currentExportId).unwrap();
      const st = normalizeExportStatus(res.status);
      toast.success(`Huy phieu xuat thanh cong - #${currentExportId} -> ${exportStatusLabel(st || res.status)}.`, {
        id: t,
      });
      await loadExport(currentExportId).unwrap();
      await refetchPendingApprove();
    } catch (err) {
      const m = getApiErrorMessage(err, "Huy phieu xuat that bai.");
      toast.error(m, { id: t });
      setMsg(m);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">Phe duyet xuat kho (Manager)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Giao dien rieng cho manager: xem danh sach ReadyToExport va duyet/huy phieu xuat.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Sap xep</label>
            <select
              value={approveSort}
              onChange={(e) => {
                setApproveSort(e.target.value as typeof approveSort);
                setApprovePage(1);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="createdAtDesc">Phieu moi nhat</option>
              <option value="createdAtAsc">Phieu cu nhat</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">So dong/trang</label>
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
              toast.success("Da lam moi danh sach phieu cho duyet.");
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Lam moi
          </button>
        </div>

        {isLoadingApprove ? (
          <p className="text-sm text-slate-500">Dang tai...</p>
        ) : (
          <div className="overflow-auto max-h-[420px] rounded-lg border border-slate-200">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 px-3">Phieu</th>
                  <th className="py-2 px-3">Don</th>
                  <th className="py-2 px-3">Trang thai</th>
                  <th className="py-2 px-3">So box</th>
                  <th className="py-2 px-3">Tao luc</th>
                  <th className="py-2 px-3 w-[200px]">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {pendingApproveRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      Khong co phieu cho duyet.
                    </td>
                  </tr>
                ) : (
                  pendingApproveRows.map((r) => (
                    <tr key={r.exportId} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-semibold">#{r.exportId} - {r.exportCode}</td>
                      <td className="py-2 px-3">#{r.orderId}</td>
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
                            Chi tiet
                          </button>
                          <button
                            type="button"
                            onClick={() => onApprove(r.exportId)}
                            disabled={isApproving}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Duyet xuat
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
        {isFetchingApprove && !isLoadingApprove && <p className="text-xs text-slate-500">Dang cap nhat...</p>}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setApprovePage((p) => Math.max(1, p - 1))}
            disabled={approvePage <= 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Truoc
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
        <h2 className="text-sm font-semibold text-slate-800">Mo phieu theo ma (tuy chon)</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={exportIdManual}
            onChange={(e) => setExportIdManual(e.target.value)}
            placeholder="ExportId"
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          />
          <button
            type="button"
            onClick={onLoadManual}
            disabled={isLoadingReceipt}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            Tai
          </button>
        </div>
      </div>

      {receipt && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Phieu xuat</p>
                <p className="text-xl font-bold text-slate-900">#{receipt.id} - {receipt.exportCode}</p>
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
                <p className="text-xs text-slate-500">Order</p>
                <p className="text-lg font-bold text-slate-900">#{receipt.orderId}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">So box</p>
                <p className="text-lg font-bold text-slate-900">{summary?.boxCount ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Khoi luong</p>
                <p className="text-lg font-bold text-slate-900">{summary?.totalQty ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Thoi gian tao</p>
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
                {isApproving ? "Dang duyet..." : "Duyet xuat"}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={!canCancel || isCancelling}
                className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                {isCancelling ? "Dang huy..." : "Huy phieu xuat"}
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
