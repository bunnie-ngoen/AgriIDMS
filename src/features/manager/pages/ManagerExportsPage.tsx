import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useApproveExportMutation,
  useCancelExportMutation,
  useGetApprovedExportsQuery,
  useGetPendingApproveExportsQuery,
  useLazyGetExportPrintDataQuery,
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
  const [listTab, setListTab] = useState<"pending" | "approved">("pending");
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [approvePage, setApprovePage] = useState(1);
  const [approvedHistoryPage, setApprovedHistoryPage] = useState(1);
  const [approveSort, setApproveSort] = useState<"createdAtDesc" | "createdAtAsc">("createdAtDesc");
  const [exportIdManual, setExportIdManual] = useState("");
  const [currentExportId, setCurrentExportId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const approveSkip = (approvePage - 1) * pageSize;
  const approvedSkip = (approvedHistoryPage - 1) * pageSize;
  const {
    data: pendingApproveRows = [],
    isLoading: isLoadingApprove,
    isFetching: isFetchingApprove,
    refetch: refetchPendingApprove,
  } = useGetPendingApproveExportsQuery(
    { skip: approveSkip, take: pageSize, sort: approveSort },
    { skip: listTab !== "pending" },
  );
  const {
    data: approvedHistoryRows = [],
    isLoading: isLoadingApprovedHistory,
    isFetching: isFetchingApprovedHistory,
    refetch: refetchApprovedHistory,
  } = useGetApprovedExportsQuery(
    { skip: approvedSkip, take: pageSize, sort: approveSort },
    { skip: listTab !== "approved" },
  );

  const [loadExport, { data: receipt, isFetching: isLoadingReceipt }] =
    useLazyGetExportReceiptByIdQuery();
  const [loadPrintData] = useLazyGetExportPrintDataQuery();
  const [approveExport, { isLoading: isApproving }] = useApproveExportMutation();
  const [cancelExport, { isLoading: isCancelling }] = useCancelExportMutation();

  const receiptNorm = normalizeExportStatus(receipt?.status);
  const canApprove = receiptNorm === "ReadyToExport";
  const canCancel = receiptNorm !== "Approved" && receiptNorm !== "Cancelled";
  const hasNextApprovePage = pendingApproveRows.length === pageSize;
  const hasNextApprovedHistoryPage = approvedHistoryRows.length === pageSize;

  /** Chỉ refetch list đang mở — query tab kia bị skip nên refetch sẽ lỗi RTK Query. */
  const refetchActiveList = async () => {
    if (listTab === "pending") {
      await refetchPendingApprove();
    } else {
      await refetchApprovedHistory();
    }
  };

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
      toast.success(
        `Duyệt xuất thành công — Phiếu #${id} → ${exportStatusLabel(st || res.status)}. Đã gửi thông báo trong hệ thống tới người tạo phiếu (kho).`,
        {
          id: t,
          duration: 5000,
        },
      );
      if (currentExportId === id) await loadExport(id).unwrap();
      await refetchActiveList();
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
      await refetchActiveList();
    } catch (err) {
      const m = getApiErrorMessage(err, "Hủy phiếu xuất thất bại.");
      toast.error(m, { id: t });
      setMsg(m);
    }
  };

  const buildExportPrintHtml = (d: {
    exportCode: string;
    orderId: number;
    createdAt: string;
    printWarningMessage?: string | null;
    lines: { boxCode: string; quantity: number }[];
  }) => {
    const created = new Date(d.createdAt).toLocaleString("vi-VN");
    const warning = (d.printWarningMessage ?? "").trim();
    const rows = d.lines
      .map(
        (x, idx) => `
          <tr>
            <td class="c">${idx + 1}</td>
            <td>${x.boxCode}</td>
            <td class="r">${x.quantity}</td>
          </tr>`,
      )
      .join("");

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Phiếu xuất kho</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
      h1 { font-size: 18px; margin: 0; }
      .muted { color: #475569; font-size: 12px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-top: 10px; }
      .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; }
      .warn { margin-top: 10px; padding: 10px; border: 1px solid #f59e0b44; background: #fffbeb; border-radius: 10px; color: #92400e; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; }
      th { background: #f8fafc; text-align: left; }
      .c { text-align: center; width: 48px; }
      .r { text-align: right; }
    </style>
  </head>
  <body>
    <h1>Phiếu xuất kho</h1>
    <div class="muted">In từ hệ thống • ${created}</div>

    <div class="grid">
      <div class="box">
        <div class="muted">Mã phiếu</div>
        <div style="font-size:16px;font-weight:700">${d.exportCode}</div>
      </div>
      <div class="box">
        <div class="muted">Đơn hàng</div>
        <div style="font-size:16px;font-weight:700">#${d.orderId}</div>
      </div>
    </div>

    ${warning ? `<div class="warn"><b>Lưu ý:</b> ${warning}</div>` : ""}

    <table>
      <thead>
        <tr>
          <th class="c">STT</th>
          <th>Box</th>
          <th class="r">Khối lượng</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
</html>`;
  };

  const onPrint = async () => {
    if (!currentExportId) return;
    const t = toast.loading(`Đang tải dữ liệu in phiếu #${currentExportId}...`);
    try {
      const data = await loadPrintData(currentExportId).unwrap();
      const html = buildExportPrintHtml({
        exportCode: data.exportCode,
        orderId: data.orderId,
        createdAt: data.createdAt,
        printWarningMessage: data.printWarningMessage,
        lines: data.lines.map((l) => ({ boxCode: l.boxCode, quantity: Number(l.quantity) })),
      });

      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) throw new Error("Popup bị chặn. Hãy cho phép mở cửa sổ mới để in.");
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.onload = () => w.print();

      toast.success("Đã mở bản in.", { id: t });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể lấy dữ liệu in phiếu xuất."), { id: t });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">Phê duyệt xuất kho (Manager)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi phiếu chờ duyệt và lịch sử phiếu đã xuất thành công; tra cứu theo mã và duyệt/hủy phiếu.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setListTab("pending")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
            listTab === "pending"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Chờ duyệt xuất
        </button>
        <button
          type="button"
          onClick={() => setListTab("approved")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
            listTab === "approved"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Đã xuất thành công
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {listTab === "pending" ? "Danh sách phiếu chờ duyệt" : "Lịch sử phiếu đã duyệt xuất (Approved)"}
          </h2>
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
            {(listTab === "pending" ? pendingApproveRows : approvedHistoryRows).length} phiếu/trang
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
                setApprovedHistoryPage(1);
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
                setApprovedHistoryPage(1);
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
              if (listTab === "pending") {
                await refetchPendingApprove();
                toast.success("Đã làm mới danh sách phiếu chờ duyệt.");
              } else {
                await refetchApprovedHistory();
                toast.success("Đã làm mới lịch sử phiếu đã duyệt.");
              }
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>

        {listTab === "pending" && isLoadingApprove ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : listTab === "approved" && isLoadingApprovedHistory ? (
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
                {listTab === "pending" && pendingApproveRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      Không có phiếu chờ duyệt.
                    </td>
                  </tr>
                ) : listTab === "approved" && approvedHistoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      Không có phiếu trong lịch sử.
                    </td>
                  </tr>
                ) : listTab === "pending" ? (
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
                ) : (
                  approvedHistoryRows.map((r) => (
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
                        <button
                          type="button"
                          onClick={() => openExportDetail(r.exportId)}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {listTab === "pending" && isFetchingApprove && !isLoadingApprove && (
          <p className="text-xs text-slate-500">Đang cập nhật...</p>
        )}
        {listTab === "approved" && isFetchingApprovedHistory && !isLoadingApprovedHistory && (
          <p className="text-xs text-slate-500">Đang cập nhật...</p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              listTab === "pending"
                ? setApprovePage((p) => Math.max(1, p - 1))
                : setApprovedHistoryPage((p) => Math.max(1, p - 1))
            }
            disabled={listTab === "pending" ? approvePage <= 1 : approvedHistoryPage <= 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-sm text-slate-600">
            Trang {listTab === "pending" ? approvePage : approvedHistoryPage}
          </span>
          <button
            type="button"
            onClick={() =>
              listTab === "pending"
                ? setApprovePage((p) => p + 1)
                : setApprovedHistoryPage((p) => p + 1)
            }
            disabled={listTab === "pending" ? !hasNextApprovePage : !hasNextApprovedHistoryPage}
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
            <div className="grid gap-2 sm:grid-cols-3">
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

              <button
                type="button"
                onClick={onPrint}
                disabled={!receipt || receiptNorm === "Cancelled"}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                In phiếu xuất
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
