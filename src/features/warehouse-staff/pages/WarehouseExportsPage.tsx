import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useApproveExportMutation,
  useCancelExportMutation,
  useConfirmPickExportMutation,
  useCreateExportReceiptMutation,
  useGetPendingApproveExportsQuery,
  useLazyGetExportReceiptByIdQuery,
} from "../../export/api/export.api";
import { useGetPaidPendingExportOrdersQuery } from "../../order/api/order.api";

function vnd(n: number) {
  return n.toLocaleString("vi-VN");
}

function exportStatusLabel(status: string) {
  if (status === "PendingPick") return "Chờ lấy hàng";
  if (status === "ReadyToExport") return "Sẵn sàng xuất";
  if (status === "Approved") return "Đã duyệt xuất";
  if (status === "Cancelled") return "Đã hủy";
  return status;
}

function exportStatusTone(status: string) {
  if (status === "PendingPick") return "bg-amber-100 text-amber-700 border-amber-200";
  if (status === "ReadyToExport") return "bg-indigo-100 text-indigo-700 border-indigo-200";
  if (status === "Approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Cancelled") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function sourceLabel(source: string) {
  if (source === "Online") return "Mua online";
  if (source === "POS") return "Mua tại quầy";
  return source;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const e = err as {
    data?: { message?: string; error?: string; detail?: string };
    message?: string;
  };
  return e?.data?.message || e?.data?.error || e?.data?.detail || e?.message || fallback;
}

/** BE có thể trả PascalCase hoặc camelCase cho enum string */
function normalizeExportStatus(status?: string | null) {
  const s = (status ?? "").trim().replace(/\s/g, "");
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower === "pendingpick") return "PendingPick";
  if (lower === "readytoexport") return "ReadyToExport";
  if (lower === "approved") return "Approved";
  if (lower === "cancelled") return "Cancelled";
  return s;
}

export default function WarehouseExportsPage() {
  // Màn kho chỉ xử lý thao tác của kho: tạo phiếu + xác nhận lấy hàng.
  const canApproveExport = false;

  const [activeTab, setActiveTab] = useState<"paidOrders" | "pendingApprove">("paidOrders");

  const [sortPaid, setSortPaid] = useState<
    "paidAtDesc" | "paidAtAsc" | "createdAtDesc" | "createdAtAsc"
  >("paidAtDesc");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "Online" | "POS">("ALL");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [paidPage, setPaidPage] = useState(1);
  const [approvePage, setApprovePage] = useState(1);
  const [approveSort, setApproveSort] = useState<"createdAtDesc" | "createdAtAsc">("createdAtDesc");

  const [exportIdManual, setExportIdManual] = useState("");
  const [currentExportId, setCurrentExportId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const paidSkip = (paidPage - 1) * pageSize;
  const orderIdNum = orderIdFilter.trim() === "" ? undefined : Number(orderIdFilter);
  const paidQueryArg = {
    skip: paidSkip,
    take: pageSize,
    sort: sortPaid,
    source: sourceFilter === "ALL" ? undefined : sourceFilter,
    orderId:
      orderIdNum !== undefined && Number.isInteger(orderIdNum) && orderIdNum > 0
        ? orderIdNum
        : undefined,
  };

  const {
    data: paidRows = [],
    isLoading: isLoadingPaid,
    isFetching: isFetchingPaid,
    refetch: refetchPaid,
  } = useGetPaidPendingExportOrdersQuery(paidQueryArg);

  const approveSkip = (approvePage - 1) * pageSize;
  const {
    data: pendingApproveRows = [],
    isLoading: isLoadingApprove,
    refetch: refetchPendingApprove,
  } = useGetPendingApproveExportsQuery(
    { skip: approveSkip, take: pageSize, sort: approveSort },
    { skip: !canApproveExport || activeTab !== "pendingApprove" },
  );

  const [createExport, { isLoading: isCreating }] = useCreateExportReceiptMutation();
  const [loadExport, { data: receipt, isFetching: isLoadingReceipt }] =
    useLazyGetExportReceiptByIdQuery();
  const [confirmPick, { isLoading: isConfirmingPick }] = useConfirmPickExportMutation();
  const [approveExport, { isLoading: isApproving }] = useApproveExportMutation();
  const [cancelExport, { isLoading: isCancelling }] = useCancelExportMutation();

  const receiptNorm = normalizeExportStatus(receipt?.status);
  const canConfirmPick = receiptNorm === "PendingPick";
  const canCancel = receiptNorm !== "Approved" && receiptNorm !== "Cancelled";

  const summary = useMemo(() => {
    if (!receipt) return null;
    const totalQty = receipt.details.reduce((sum, d) => sum + Number(d.actualQuantity || 0), 0);
    return {
      boxCount: receipt.details.length,
      totalQty,
    };
  }, [receipt]);

  const hasNextPaidPage = paidRows.length === pageSize;
  const hasNextApprovePage = pendingApproveRows.length === pageSize;

  const refreshLists = async () => {
    await refetchPaid();
    if (canApproveExport) await refetchPendingApprove();
  };

  const openExportDetail = async (exportId: number, silentToast = false) => {
    setMsg("");
    setCurrentExportId(exportId);
    setExportIdManual(String(exportId));
    try {
      await loadExport(exportId).unwrap();
      if (!silentToast) {
        toast.success(`Đã tải phiếu xuất #${exportId}.`);
      }
    } catch (err) {
      const m = getApiErrorMessage(err, "Không tải được phiếu xuất.");
      setMsg(m);
      toast.error(m);
    }
  };

  const onCreateForOrder = async (orderId: number) => {
    setMsg("");
    const t = toast.loading(`Đang tạo phiếu xuất cho đơn #${orderId}...`);
    try {
      const res = await createExport({ orderId }).unwrap();
      toast.success(
        `Tạo phiếu xuất thành công · #${res.id} · ${res.exportCode}. Đã mở chi tiết phiếu — bước tiếp: xác nhận lấy hàng.`,
        { id: t },
      );
      await refreshLists();
      await openExportDetail(res.id, true);
    } catch (err) {
      const m = getApiErrorMessage(err, "Tạo phiếu xuất thất bại.");
      toast.error(m, { id: t });
      setMsg(m);
    }
  };

  const onLoadManual = async () => {
    const exportId = Number(exportIdManual);
    if (!Number.isInteger(exportId) || exportId <= 0) {
      const m = "ExportId không hợp lệ.";
      setMsg(m);
      toast.error(m);
      return;
    }
    await openExportDetail(exportId);
  };

  const onConfirmPick = async () => {
    if (!currentExportId) return;
    const norm = normalizeExportStatus(receipt?.status);
    if (norm !== "PendingPick") {
      const hint =
        norm === "ReadyToExport"
          ? "Phiếu đã xác nhận lấy hàng trước đó. Bước tiếp theo: Admin/Manager duyệt xuất."
          : `Không thể xác nhận lấy hàng ở trạng thái hiện tại (${receipt?.status ?? "—"}).`;
      toast(hint, { icon: "ℹ️" });
      setMsg(hint);
      return;
    }
    const t = toast.loading(`Đang xác nhận lấy hàng phiếu #${currentExportId}...`);
    try {
      const res = await confirmPick(currentExportId).unwrap();
      const next = normalizeExportStatus(res.status);
      toast.success(
        `Xác nhận lấy hàng thành công · Phiếu #${currentExportId} → ${exportStatusLabel(next || res.status)}.`,
        { id: t },
      );
      await loadExport(currentExportId).unwrap();
      await refreshLists();
      toast.success("Đã cập nhật chi tiết phiếu và danh sách.");
    } catch (err) {
      const m = getApiErrorMessage(err, "Xác nhận lấy hàng thất bại.");
      toast.error(m, { id: t });
      setMsg(m);
    }
  };

  const onApprove = async (exportId?: number) => {
    const id = exportId ?? currentExportId;
    if (!id) return;
    const t = toast.loading(`Đang duyệt phiếu xuất #${id}...`);
    try {
      const res = await approveExport(id).unwrap();
      const st = normalizeExportStatus(res.status);
      toast.success(
        `Duyệt xuất thành công · Phiếu #${id} → ${exportStatusLabel(st || res.status)}. Đơn chuyển sang Đang giao.`,
        { id: t },
      );
      if (currentExportId === id) {
        try {
          await loadExport(id).unwrap();
        } catch {
          /* chi tiết có thể tải lại sau */
        }
      }
      await refreshLists();
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
      toast.success(`Hủy phiếu xuất thành công · #${currentExportId} → ${exportStatusLabel(st || res.status)}.`, {
        id: t,
      });
      await loadExport(currentExportId).unwrap();
      await refreshLists();
    } catch (err) {
      const m = getApiErrorMessage(err, "Hủy phiếu xuất thất bại.");
      toast.error(m, { id: t });
      setMsg(m);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">Xuất kho sau thanh toán</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kho tạo phiếu và xác nhận lấy hàng. Admin/Manager duyệt xuất để đơn chuyển sang đang giao.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("paidOrders")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
            activeTab === "paidOrders"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Đơn Paid chờ xuất
        </button>
        {canApproveExport && (
          <button
            type="button"
            onClick={() => setActiveTab("pendingApprove")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
              activeTab === "pendingApprove"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Phiếu chờ duyệt xuất
          </button>
        )}
      </div>

      {activeTab === "paidOrders" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Sắp xếp</label>
              <select
                value={sortPaid}
                onChange={(e) => {
                  setSortPaid(e.target.value as typeof sortPaid);
                  setPaidPage(1);
                }}
                className="mt-1 block w-full min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="paidAtDesc">Thanh toán mới nhất</option>
                <option value="paidAtAsc">Thanh toán cũ nhất</option>
                <option value="createdAtDesc">Tạo đơn mới nhất</option>
                <option value="createdAtAsc">Tạo đơn cũ nhất</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Hình thức mua</label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value as typeof sourceFilter);
                  setPaidPage(1);
                }}
                className="mt-1 block w-full min-w-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="ALL">Tất cả</option>
                <option value="Online">Trực tuyến</option>
                <option value="POS">Tại quầy</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Lọc OrderId</label>
              <input
                value={orderIdFilter}
                onChange={(e) => {
                  setOrderIdFilter(e.target.value);
                  setPaidPage(1);
                }}
                placeholder="Để trống = tất cả"
                className="mt-1 block w-full min-w-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Số dòng/trang</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as 20 | 50 | 100);
                  setPaidPage(1);
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
                await refetchPaid();
                toast.success("Đã làm mới danh sách đơn Paid.");
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Làm mới
            </button>
          </div>

          {isLoadingPaid ? (
            <p className="text-sm text-slate-500">Đang tải danh sách...</p>
          ) : (
            <div className="overflow-auto max-h-[480px] rounded-lg border border-slate-200">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="py-2 px-3">Đơn</th>
                    <th className="py-2 px-3">Hình thức mua</th>
                    <th className="py-2 px-3">Thanh toán lúc</th>
                    <th className="py-2 px-3">Tạo đơn</th>
                    <th className="py-2 px-3 text-right">Thành tiền (VNĐ)</th>
                    <th className="py-2 px-3">Phiếu xuất</th>
                    <th className="py-2 px-3 w-[220px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paidRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                        Không có đơn Paid nào khớp điều kiện xuất kho.
                      </td>
                    </tr>
                  ) : (
                    paidRows.map((row) => (
                      <tr key={row.orderId} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-semibold text-slate-900">Đơn hàng {row.orderId}</td>
                        <td className="py-2 px-3">{sourceLabel(row.source)}</td>
                        <td className="py-2 px-3 text-slate-700">
                          {row.paidAt ? new Date(row.paidAt).toLocaleString("vi-VN") : "—"}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {new Date(row.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">{vnd(row.totalAmount)} ₫</td>
                        <td className="py-2 px-3">
                          {row.hasExportReceipt ? (
                            <div className="space-y-1">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${exportStatusTone(
                                  row.exportStatus || "",
                                )}`}
                              >
                                {row.exportCode} · {exportStatusLabel(row.exportStatus || "")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Chưa có phiếu</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {!row.hasExportReceipt && (
                              <button
                                type="button"
                                onClick={() => onCreateForOrder(row.orderId)}
                                disabled={isCreating}
                                className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                              >
                                Tạo phiếu
                              </button>
                            )}
                            {row.hasExportReceipt && row.exportReceiptId != null && (
                              <button
                                type="button"
                                onClick={() => openExportDetail(row.exportReceiptId!)}
                                className="rounded-lg border border-indigo-300 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                              >
                                Mở phiếu
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {isFetchingPaid && !isLoadingPaid && (
            <p className="text-xs text-slate-500">Đang cập nhật...</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPaidPage((p) => Math.max(1, p - 1))}
              disabled={paidPage <= 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-slate-600">Trang {paidPage}</span>
            <button
              type="button"
              onClick={() => setPaidPage((p) => p + 1)}
              disabled={!hasNextPaidPage}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {activeTab === "pendingApprove" && canApproveExport && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
            <div className="overflow-auto max-h-[400px] rounded-lg border border-slate-200">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="py-2 px-3">Phiếu</th>
                    <th className="py-2 px-3">Đơn</th>
                    <th className="py-2 px-3">Số box</th>
                    <th className="py-2 px-3">Tạo lúc</th>
                    <th className="py-2 px-3 w-[200px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApproveRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                        Không có phiếu chờ duyệt.
                      </td>
                    </tr>
                  ) : (
                    pendingApproveRows.map((r) => (
                      <tr key={r.exportId} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-semibold">
                          #{r.exportId} · {r.exportCode}
                        </td>
                        <td className="py-2 px-3">Đơn hàng {r.orderId}</td>
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
      )}

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-800">Mở phiếu theo mã (tuỳ chọn)</h2>
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
            Tải
          </button>
        </div>
      </div>

      {receipt && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Phiếu xuất</p>
                <p className="text-xl font-bold text-slate-900">
                  #{receipt.id} · {receipt.exportCode}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${exportStatusTone(
                  receiptNorm || receipt.status,
                )}`}
              >
                {exportStatusLabel(receiptNorm || receipt.status)}
              </span>
            </div>

            {receiptNorm === "ReadyToExport" && (
              <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                Đã xác nhận lấy hàng. {canApproveExport ? "Bạn có thể bấm Duyệt xuất bên dưới." : "Chờ Admin/Manager duyệt xuất."}
              </div>
            )}
            {receiptNorm === "PendingPick" && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Bước kho: bấm &quot;Kho xác nhận lấy hàng&quot; để chuyển sang Sẵn sàng xuất.
              </div>
            )}

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
            <h2 className="text-sm font-semibold text-slate-900">Chi tiết box xuất</h2>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 text-left">Mã chi tiết</th>
                    <th className="py-2 pr-3 text-left">Box</th>
                    <th className="py-2 pr-3 text-right">Khối lượng</th>
                    <th className="py-2 pr-3 text-left">Trạng thái box</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.details.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3">#{d.id}</td>
                      <td className="py-2 pr-3 font-semibold text-slate-900">{d.boxCode}</td>
                      <td className="py-2 pr-3 text-right">{d.actualQuantity}</td>
                      <td className="py-2 pr-3">{d.boxStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={onConfirmPick}
                disabled={!canConfirmPick || isConfirmingPick || !receipt}
                title={
                  !canConfirmPick && receipt
                    ? receiptNorm === "ReadyToExport"
                      ? "Đã xác nhận lấy hàng rồi — chờ Admin/Manager duyệt xuất"
                      : "Không áp dụng ở trạng thái này"
                    : undefined
                }
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isConfirmingPick ? "Đang xác nhận..." : "Kho xác nhận lấy hàng"}
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
            {!canApproveExport && (
              <p className="mt-2 text-xs text-amber-700">
                Tài khoản kho chỉ tạo phiếu và xác nhận lấy hàng. Duyệt xuất do Admin/Manager.
              </p>
            )}
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
