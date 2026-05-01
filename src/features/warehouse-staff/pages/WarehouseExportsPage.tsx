import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useCancelExportMutation,
  useConfirmPickExportMutation,
  useCreateExportReceiptMutation,
  useGetApprovedExportsQuery,
  useGetWarehousePostPickExportsQuery,
  useLazyGetExportReceiptByIdQuery,
} from "../../export/api/export.api";
import { useGetPaidPendingExportOrdersQuery } from "../../order/api/order.api";
import { ROUTES } from "../../../shared/constants/routes";
import { boxStatusLabelVietnam } from "../../../shared/lib/boxStatusUi";
import { formatVietnamDateTime } from "../../../shared/lib/vietnamTime";

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

function resolveQrImageUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trimmed)}`;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const openedExportFromUrl = useRef<number | null>(null);

  const [activeTab, setActiveTab] = useState<"paidOrders" | "postPick" | "approvedHistory">("paidOrders");

  const [sortPaid, setSortPaid] = useState<
    "paidAtDesc" | "paidAtAsc" | "createdAtDesc" | "createdAtAsc"
  >("paidAtDesc");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "Online" | "POS">("ALL");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [paidPage, setPaidPage] = useState(1);
  const [postPickPage, setPostPickPage] = useState(1);
  const [postPickSort, setPostPickSort] = useState<"createdAtDesc" | "createdAtAsc">("createdAtDesc");
  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedSort, setApprovedSort] = useState<"createdAtDesc" | "createdAtAsc">("createdAtDesc");

  const [currentExportId, setCurrentExportId] = useState<number | null>(null);
  /** Chỉ hiện khối chi tiết phiếu sau khi bấm Chi tiết / tạo phiếu / mở từ URL — tránh hiện nhầm do cache RTK. */
  const [detailPanelExportId, setDetailPanelExportId] = useState<number | null>(null);
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

  const postPickSkip = (postPickPage - 1) * pageSize;
  const {
    data: postPickRows = [],
    isLoading: isLoadingPostPick,
    isFetching: isFetchingPostPick,
    refetch: refetchPostPick,
  } = useGetWarehousePostPickExportsQuery(
    { skip: postPickSkip, take: pageSize, sort: postPickSort },
    { skip: activeTab !== "postPick" },
  );

  const approvedSkip = (approvedPage - 1) * pageSize;
  const {
    data: approvedRows = [],
    isLoading: isLoadingApproved,
    isFetching: isFetchingApproved,
    refetch: refetchApproved,
  } = useGetApprovedExportsQuery(
    { skip: approvedSkip, take: pageSize, sort: approvedSort },
    { skip: activeTab !== "approvedHistory" },
  );

  const [createExport, { isLoading: isCreating }] = useCreateExportReceiptMutation();
  const [loadExport, { data: receipt, isFetching: isLoadingReceipt }] =
    useLazyGetExportReceiptByIdQuery();
  const [confirmPick, { isLoading: isConfirmingPick }] = useConfirmPickExportMutation();
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
  const hasNextPostPickPage = postPickRows.length === pageSize;
  const hasNextApprovedPage = approvedRows.length === pageSize;

  const refreshLists = async () => {
    await refetchPaid();
    // postPick query is skipped unless the tab is active; calling refetch while skipped throws:
    // "Cannot refetch a query that has not been started yet."
    if (activeTab === "postPick") {
      await refetchPostPick();
    }
    if (activeTab === "approvedHistory") {
      await refetchApproved();
    }
  };

  const openExportDetail = async (exportId: number, silentToast = false) => {
    setMsg("");
    setCurrentExportId(exportId);
    setDetailPanelExportId(exportId);
    try {
      await loadExport(exportId).unwrap();
      if (!silentToast) {
        toast.success(`Đã tải phiếu xuất #${exportId}.`);
      }
    } catch (err) {
      setDetailPanelExportId(null);
      setCurrentExportId(null);
      const m = getApiErrorMessage(err, "Không tải được phiếu xuất.");
      setMsg(m);
      toast.error(m);
    }
  };

  useEffect(() => {
    setDetailPanelExportId(null);
  }, [activeTab]);

  /** Mở phiếu khi vào từ thông báo: /warehouse/exports?exportId=… */
  const exportIdFromUrl = searchParams.get("exportId");
  useEffect(() => {
    if (!exportIdFromUrl) return;
    const id = Number(exportIdFromUrl);
    if (!Number.isInteger(id) || id <= 0) return;
    if (openedExportFromUrl.current === id) return;
    openedExportFromUrl.current = id;
    void openExportDetail(id, true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("exportId");
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi exportIdFromUrl đổi
  }, [exportIdFromUrl]);

  const onCreateForOrder = async (orderId: number) => {
    setMsg("");
    const t = toast.loading(`Đang lập phiếu xuất kho cho đơn #${orderId}...`);
    try {
      const res = await createExport({ orderId }).unwrap();
      toast.success(
        `Lập phiếu xuất kho thành công · #${res.id} · ${res.exportCode}. Đã mở chi tiết phiếu — bước tiếp: xác nhận lấy hàng.`,
        { id: t },
      );
      await refreshLists();
      await openExportDetail(res.id, true);
    } catch (err) {
      const m = getApiErrorMessage(err, "Lập phiếu xuất kho thất bại.");
      toast.error(m, { id: t });
      setMsg(m);
    }
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

  const onPrint = async () => {
    if (!currentExportId) return;
    const t = toast.loading(`Đang mở phiếu #${currentExportId}...`);
    try {
      const q = new URLSearchParams({ exportId: String(currentExportId) });
      const url = `${window.location.origin}${ROUTES.PRINT_EXPORT_SLIP}?${q.toString()}`;
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) throw new Error("Popup bị chặn. Hãy cho phép mở cửa sổ mới để in.");
      toast.success("Đã mở tab phiếu — bấm In phiếu trên tab mới để chọn máy in.", { id: t });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể mở phiếu in."), { id: t });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">Xuất kho</h1>
        <p className="mt-1 text-sm text-slate-600">Lập phiếu xuất kho và xác nhận lấy hàng.</p>
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
          Đơn chờ xuất
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("postPick")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
            activeTab === "postPick"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Đã xác nhận lấy hàng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("approvedHistory")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
            activeTab === "approvedHistory"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Đã duyệt xuất
        </button>
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
              <label className="text-xs font-medium text-slate-600">Số đơn</label>
              <input
                value={orderIdFilter}
                onChange={(e) => {
                  setOrderIdFilter(e.target.value);
                  setPaidPage(1);
                }}
                placeholder="Nhập theo số đơn"
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
                toast.success("Đã làm mới danh sách đơn chờ xuất.");
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
                        Không có đơn chờ xuất nào khớp điều kiện.
                      </td>
                    </tr>
                  ) : (
                    paidRows.map((row) => (
                      <tr key={row.orderId} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-semibold text-slate-900">Đơn hàng {row.orderId}</td>
                        <td className="py-2 px-3">{sourceLabel(row.source)}</td>
                        <td className="py-2 px-3 text-slate-700">
                          {row.paidAt ? formatVietnamDateTime(row.paidAt) : "—"}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {formatVietnamDateTime(row.createdAt)}
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
                                Lập phiếu xuất kho
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

      {activeTab === "postPick" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Sắp xếp</label>
              <select
                value={postPickSort}
                onChange={(e) => {
                  setPostPickSort(e.target.value as typeof postPickSort);
                  setPostPickPage(1);
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
                await refetchPostPick();
                toast.success("Đã làm mới danh sách phiếu đã xác nhận lấy hàng.");
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Làm mới
            </button>
          </div>
          {isLoadingPostPick ? (
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
                  {postPickRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                        Không có phiếu nào ở trạng thái đã xác nhận lấy hàng.
                      </td>
                    </tr>
                  ) : (
                    postPickRows.map((r) => (
                      <tr key={r.exportId} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-semibold">
                          #{r.exportId} · {r.exportCode}
                        </td>
                        <td className="py-2 px-3">Đơn hàng {r.orderId}</td>
                        <td className="py-2 px-3">{r.boxCount}</td>
                        <td className="py-2 px-3">{formatVietnamDateTime(r.createdAt)}</td>
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
          {isFetchingPostPick && !isLoadingPostPick && (
            <p className="text-xs text-slate-500">Đang cập nhật...</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPostPickPage((p) => Math.max(1, p - 1))}
              disabled={postPickPage <= 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-slate-600">Trang {postPickPage}</span>
            <button
              type="button"
              onClick={() => setPostPickPage((p) => p + 1)}
              disabled={!hasNextPostPickPage}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {activeTab === "approvedHistory" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-sm text-slate-600">
            Phiếu xuất đã được Manager/Admin duyệt (Approved). Mở chi tiết để <span className="font-semibold">in phiếu xuất</span>.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Sắp xếp</label>
              <select
                value={approvedSort}
                onChange={(e) => {
                  setApprovedSort(e.target.value as typeof approvedSort);
                  setApprovedPage(1);
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
                await refetchApproved();
                toast.success("Đã làm mới danh sách phiếu đã duyệt.");
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Làm mới
            </button>
          </div>
          {isLoadingApproved ? (
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
                    <th className="py-2 px-3 w-[220px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                        Chưa có phiếu đã duyệt xuất.
                      </td>
                    </tr>
                  ) : (
                    approvedRows.map((r) => (
                      <tr key={r.exportId} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-semibold">
                          #{r.exportId} · {r.exportCode}
                        </td>
                        <td className="py-2 px-3">Đơn hàng {r.orderId}</td>
                        <td className="py-2 px-3">{r.boxCount}</td>
                        <td className="py-2 px-3">{formatVietnamDateTime(r.createdAt)}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => openExportDetail(r.exportId)}
                              className="rounded-lg border border-indigo-300 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                              Chi tiết
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
          {isFetchingApproved && !isLoadingApproved && (
            <p className="text-xs text-slate-500">Đang cập nhật...</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setApprovedPage((p) => Math.max(1, p - 1))}
              disabled={approvedPage <= 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-slate-600">Trang {approvedPage}</span>
            <button
              type="button"
              onClick={() => setApprovedPage((p) => p + 1)}
              disabled={!hasNextApprovedPage}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {detailPanelExportId !== null &&
        (isLoadingReceipt || !receipt || receipt.id !== detailPanelExportId) && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
            Đang tải phiếu xuất...
          </div>
        )}

      {detailPanelExportId !== null &&
        receipt &&
        receipt.id === detailPanelExportId && (
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
                Đã xác nhận lấy hàng. Chờ Admin/Manager duyệt xuất kho.
              </div>
            )}
            {receiptNorm === "Approved" && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Phiếu đã duyệt xuất. Bạn có thể <span className="font-semibold">In phiếu xuất</span> bên dưới; tra cứu lại trong tab{" "}
                <span className="font-semibold">Đã duyệt xuất</span>.
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
                  {formatVietnamDateTime(receipt.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Chi tiết box xuất</h2>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[980px] table-fixed text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="w-1/6 px-3 py-2 text-left">Mã chi tiết</th>
                    <th className="w-1/6 px-3 py-2 text-left">Box</th>
                    <th className="w-1/6 px-3 py-2 text-left">Kho</th>
                    <th className="w-1/6 px-3 py-2 text-left">QR box</th>
                    <th className="w-1/6 px-3 py-2 text-center">Khối lượng</th>
                    <th className="w-1/6 px-3 py-2 text-left">Trạng thái box</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.details.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100">
                      <td className="px-3 py-2">#{d.id}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{d.boxCode}</td>
                      <td className="px-3 py-2">{d.warehouseName || "—"}</td>
                      <td className="px-3 py-2">
                        {(() => {
                          const qrUrl = resolveQrImageUrl(d.boxQrCode);
                          if (!qrUrl) return <span className="text-slate-400">—</span>;
                          return (
                            <a href={qrUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                              <img
                                src={qrUrl}
                                alt={`QR ${d.boxCode}`}
                                className="h-12 w-12 rounded border border-slate-200 bg-white object-contain"
                                loading="lazy"
                              />
                              <span className="text-xs font-semibold text-indigo-700 hover:underline">Mở QR</span>
                            </a>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2 text-center">{d.actualQuantity}</td>
                      <td className="px-3 py-2">{boxStatusLabelVietnam(d.boxStatus)}</td>
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
                {isConfirmingPick ? "Đang xác nhận..." : "Xác nhận lấy hàng"}
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
