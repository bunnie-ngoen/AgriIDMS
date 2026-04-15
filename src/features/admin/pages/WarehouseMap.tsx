import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  useGetWarehouseQuery,
  useGetZonesQuery,
  useGetRacksQuery,
  useGetSlotsQuery,
  useGetSlotContentsQuery,
  userApi,
} from "../api/create-user.api";
import {
  useGetUnassignedBoxesByWarehouseQuery,
  useGetExpiredBoxesByWarehouseQuery,
  useDisposeExpiredBoxesMutation,
  useCreateDisposalRequestMutation,
  useGetDisposeHistoryByWarehouseQuery,
} from "../../goods-receipt/api/goods-receipt.api";
import type { SlotBoxItem, SlotItem } from "../types/warehouse.type";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";
import type { AppDispatch } from "../../../app/store";

const getNowMs = () => Date.now();

const DisposeReasonModal = ({
  isOpen,
  title,
  subtitle,
  value,
  onChange,
  onClose,
  onConfirm,
  isSubmitting,
  confirmLabel = "Xác nhận",
  showReasonField = true,
}: {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  confirmLabel?: string;
  showReasonField?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border-b border-slate-100 px-5 py-4">
          <p className="text-base font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-600">{subtitle}</p>}
        </div>

        {showReasonField && (
          <div className="px-5 py-4">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Lý do tiêu hủy (tùy chọn)
            </label>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
              placeholder="Có thể nhập ghi chú để lưu lại lịch sử tiêu hủy..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            <p className="mt-1 text-[11px] text-slate-500">Thông tin này sẽ được lưu kèm lịch sử giao dịch.</p>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {isSubmitting ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Panel chi tiết slot: thông tin + slot chứa gì (hiện tại chỉ có capacity, có thể bổ sung API sản phẩm sau) */
const SlotDetailPanel = ({
  slot,
  warehouseId,
  onClose,
  onTransferBox,
  className = "",
}: {
  slot: SlotItem;
  warehouseId: number;
  onClose: () => void;
  onTransferBox: (box: SlotBoxItem) => void;
  className?: string;
}) => {
  const { data: contents, isLoading: isLoadingContents, refetch: refetchContents } =
    useGetSlotContentsQuery(slot.id);
  const [selectedBox, setSelectedBox] = useState<SlotBoxItem | null>(null);
  const [isBoxesModalOpen, setIsBoxesModalOpen] = useState(false);
  const [selectedBoxIdsInSlot, setSelectedBoxIdsInSlot] = useState<number[]>([]);
  const [isDisposeReasonModalOpen, setIsDisposeReasonModalOpen] = useState(false);
  const [disposeTargetBox, setDisposeTargetBox] = useState<SlotBoxItem | null>(null);
  const [disposeReason, setDisposeReason] = useState("");
  const [disposeDecisionNowMs, setDisposeDecisionNowMs] = useState<number>(0);
  const [createDisposalRequest, createDisposalRequestState] = useCreateDisposalRequestMutation();
  const [disposeExpiredBoxes, disposeExpiredBoxesState] = useDisposeExpiredBoxesMutation();

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore (clipboard API may be blocked)
    }
  };

  const exportSlotQrToPdf = () => {
    if (!slot.qrCode) {
      toast.error("Slot chưa có mã QR để in.");
      return;
    }
    const ts = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "-")
      .slice(0, 13);
    const fileName = `qr-slot-${slot.code || slot.id}-${ts}.pdf`;
    const safeCode = String(slot.qrCode)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    const safeSlotCode = String(slot.code || `#${slot.id}`)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    const qrHtml = slot.qrImageUrl
      ? `<img class="qr" src="${slot.qrImageUrl}" alt="QR ${safeSlotCode}" />`
      : `<div class="qr qr-fallback">${safeCode}</div>`;

    const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${fileName}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; }
      .sheet {
        min-height: calc(100vh - 24mm);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .title { font-size: 22px; font-weight: 700; margin: 0; }
      .code { font-size: 18px; font-weight: 600; margin: 0; }
      .qr {
        width: 300px;
        height: 300px;
        border: 1px solid #cbd5e1;
        object-fit: contain;
        background: #fff;
      }
      .qr-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-size: 12px;
        color: #64748b;
        text-align: center;
        padding: 8px;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <h1 class="title">QR ô chứa</h1>
      <p class="code">${safeSlotCode}</p>
      ${qrHtml}
    </div>
    <script>window.onload = () => window.print();</script>
  </body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const printDoc = iframe.contentDocument;
    const printWin = iframe.contentWindow;
    if (!printDoc || !printWin) {
      document.body.removeChild(iframe);
      toast.error("Không thể mở trình in lúc này.");
      return;
    }

    printDoc.open();
    printDoc.write(html);
    printDoc.close();

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    };
    printWin.onafterprint = cleanup;
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 120);
  };

  const effectiveCurrentCapacity =
    (contents?.currentCapacity ?? 0) > 0
      ? (contents?.currentCapacity ?? 0)
      : (contents?.totalBoxVolumeM3 ?? 0) > 0
        ? (contents?.totalBoxVolumeM3 ?? 0)
        : (slot.currentCapacity || 0);
  const effectiveCapacity = (contents?.capacity ?? 0) > 0 ? (contents?.capacity ?? 0) : slot.capacity;
  const ratio =
    effectiveCapacity > 0 ? Math.min(1, effectiveCurrentCapacity / effectiveCapacity) * 100 : 0;
  const sortedSlotBoxes = useMemo(() => {
    if (!contents?.boxes) return [];
    return [...contents.boxes].sort((a, b) => {
      const da = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      const db = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [contents?.boxes]);
  useEffect(() => {
    if (!isBoxesModalOpen) {
      setSelectedBoxIdsInSlot([]);
      return;
    }
    const idSet = new Set(sortedSlotBoxes.map((b) => b.id));
    setSelectedBoxIdsInSlot((prev) => prev.filter((id) => idSet.has(id)));
  }, [isBoxesModalOpen, sortedSlotBoxes]);

  const handleDisposeSingleBox = (box: SlotBoxItem) => {
    const nowMs = getNowMs();
    if (isExpiredAt(box, nowMs)) {
      const ok = window.confirm(
        `Xác nhận tiêu hủy ngay box ${box.boxCode}? Box này đã hết hạn nên không cần duyệt.`,
      );
      if (!ok) return;
      void disposeExpiredInSlot([box.id]);
      return;
    }
    setDisposeDecisionNowMs(nowMs);
    setDisposeTargetBox(box);
    setDisposeReason("");
    setIsDisposeReasonModalOpen(true);
  };

  const toggleSelectBoxInSlot = (boxId: number) => {
    setSelectedBoxIdsInSlot((prev) =>
      prev.includes(boxId) ? prev.filter((id) => id !== boxId) : [...prev, boxId],
    );
  };

  const isExpiredAt = (box: SlotBoxItem, nowMs: number) =>
    !!box.expiryDate && new Date(box.expiryDate).getTime() <= nowMs;

  const selectedBoxesInSlot = useMemo(
    () => sortedSlotBoxes.filter((b) => selectedBoxIdsInSlot.includes(b.id)),
    [sortedSlotBoxes, selectedBoxIdsInSlot],
  );
  const shouldOpenRequestModal =
    (disposeTargetBox != null && !isExpiredAt(disposeTargetBox, disposeDecisionNowMs)) ||
    (disposeTargetBox == null &&
      selectedBoxesInSlot.some((b) => !isExpiredAt(b, disposeDecisionNowMs)));

  const disposeExpiredInSlot = async (boxIds: number[]) => {
    const res = await disposeExpiredBoxes({ boxIds }).unwrap();
    toast.success(res.message);
    setSelectedBoxIdsInSlot([]);
    setDisposeTargetBox(null);
    setDisposeReason("");
    setIsDisposeReasonModalOpen(false);
    setSelectedBox(null);
    await refetchContents();
  };

  const submitDisposeSingleBox = async () => {
    if (!disposeTargetBox) return;

    try {
      const nowMs = getNowMs();
      const isExpired = isExpiredAt(disposeTargetBox, nowMs);
      const res = isExpired
        ? await disposeExpiredBoxes({ boxIds: [disposeTargetBox.id] }).unwrap()
        : await createDisposalRequest({
            warehouseId,
            boxIds: [disposeTargetBox.id],
            reason: disposeReason.trim() || undefined,
          }).unwrap();
      toast.success(res.message);
      setDisposeTargetBox(null);
      setDisposeReason("");
      await refetchContents();
      if (selectedBox?.id === disposeTargetBox.id) setSelectedBox(null);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Tiêu hủy box thất bại.";
      toast.error(msg);
    }
  };

  const submitDisposeSelectedInSlot = async () => {
    if (!selectedBoxIdsInSlot.length) {
      toast.error("Chọn ít nhất 1 hàng để tiêu hủy.");
      return;
    }

    try {
      const nowMs = getNowMs();
      const hasNonExpired = selectedBoxesInSlot.some((b) => !isExpiredAt(b, nowMs));
      const res = hasNonExpired
        ? await createDisposalRequest({
            warehouseId,
            boxIds: selectedBoxIdsInSlot,
            reason: disposeReason.trim() || undefined,
          }).unwrap()
        : await disposeExpiredBoxes({
            boxIds: selectedBoxIdsInSlot,
          }).unwrap();
      toast.success(res.message);
      setSelectedBoxIdsInSlot([]);
      setDisposeTargetBox(null);
      setDisposeReason("");
      setIsDisposeReasonModalOpen(false);
      setSelectedBox(null);
      await refetchContents();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Tiêu hủy box thất bại.";
      toast.error(msg);
    }
  };

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {selectedBox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedBox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Chi tiết box
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vị trí {slot.code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBox(null)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4 text-[11px] space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                {selectedBox.qrCode && (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">QR</p>
                      <p className="font-mono text-[11px] text-slate-900 break-all mt-1">
                        {selectedBox.qrCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(selectedBox.qrCode || "")}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sao chép
                    </button>
                  </div>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Thể tích</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums mt-1">
                    {selectedBox.volumeM3 ?? 0} m³
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Khối lượng</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums mt-1">
                    {selectedBox.weight ?? 0} kg
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Trạng thái</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedBox.status || "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Sản phẩm</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {contents?.productName || "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Biến thể</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {contents?.variantName || "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2 col-span-2">
                  <dt className="text-[10px] text-slate-500">Lô hàng</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedBox.lotCode} (#{selectedBox.lotId})
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Ngày nhận</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedBox.receivedDate
                      ? new Date(selectedBox.receivedDate).toLocaleDateString(
                          "vi-VN",
                        )
                      : "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">HSD</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedBox.expiryDate
                      ? new Date(selectedBox.expiryDate).toLocaleDateString(
                          "vi-VN",
                        )
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
      <DisposeReasonModal
        isOpen={isDisposeReasonModalOpen}
        title={
          selectedBoxIdsInSlot.length > 0
            ? `Tiêu hủy ${selectedBoxIdsInSlot.length} hàng đã chọn`
            : disposeTargetBox
            ? `Tiêu hủy hàng ${disposeTargetBox.boxCode}`
            : "Tiêu hủy hàng"
        }
        subtitle={
          shouldOpenRequestModal
            ? "Box còn hạn sẽ tạo yêu cầu duyệt từ Admin/Quản lí."
            : "Box hết hạn sẽ tiêu hủy trực tiếp, không cần duyệt."
        }
        value={disposeReason}
        onChange={setDisposeReason}
        onClose={() => {
          setDisposeTargetBox(null);
          setDisposeReason("");
          setIsDisposeReasonModalOpen(false);
        }}
        onConfirm={() =>
          void (selectedBoxIdsInSlot.length > 0
            ? submitDisposeSelectedInSlot()
            : submitDisposeSingleBox())
        }
        isSubmitting={
          createDisposalRequestState.isLoading ||
          disposeExpiredBoxesState.isLoading
        }
        confirmLabel={shouldOpenRequestModal ? "Gửi yêu cầu" : "Tiêu hủy ngay"}
        showReasonField={shouldOpenRequestModal}
      />

      {isBoxesModalOpen && contents && contents.boxCount > 0 && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsBoxesModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Danh sách hàng trong vị trí {slot.code}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {contents.productName || "Sản phẩm"}
                  {contents.variantName ? ` · ${contents.variantName}` : ""} —{" "}
                  {contents.boxCount} hàng ·{" "}
                  {contents.totalBoxVolumeM3 ?? contents.currentCapacity} m³
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBoxesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBoxIdsInSlot(sortedSlotBoxes.map((b) => b.id))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBoxIdsInSlot([])}
                    disabled={!selectedBoxIdsInSlot.length}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Bỏ chọn
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedBoxIdsInSlot.length) {
                      toast.error("Chọn ít nhất 1 hàng để tiêu hủy.");
                      return;
                    }
                    const nowMs = getNowMs();
                    const onlyExpired = selectedBoxesInSlot.every((b) =>
                      isExpiredAt(b, nowMs),
                    );
                    if (onlyExpired) {
                      const ok = window.confirm(
                        `Xác nhận tiêu hủy ngay ${selectedBoxIdsInSlot.length} box hết hạn đã chọn?`,
                      );
                      if (!ok) return;
                      void disposeExpiredInSlot(selectedBoxIdsInSlot);
                      return;
                    }
                    setDisposeDecisionNowMs(nowMs);
                    setDisposeTargetBox(null);
                    setDisposeReason("");
                    setIsDisposeReasonModalOpen(true);
                  }}
                  disabled={
                    !selectedBoxIdsInSlot.length ||
                    createDisposalRequestState.isLoading ||
                    disposeExpiredBoxesState.isLoading
                  }
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  Tiêu hủy đã chọn ({selectedBoxIdsInSlot.length})
                </button>
              </div>
              <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="text-left font-semibold px-3 py-2 w-[36px]">#</th>
                      <th className="text-left font-semibold px-3 py-2">Hàng</th>
                      <th className="text-right font-semibold px-3 py-2">
                        Thao tác
                      </th>
                      <th className="text-right font-semibold px-3 py-2">m³</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {sortedSlotBoxes.map((b) => (
                      <tr
                        key={b.id}
                        className="border-t border-slate-100 hover:bg-white cursor-pointer"
                        onClick={() => {
                          setSelectedBox(b);
                        }}
                        title="Bấm xem chi tiết hàng"
                      >
                        <td
                          className="px-3 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedBoxIdsInSlot.includes(b.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectBoxInSlot(b.id);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 pr-2">
                          <div className="font-mono text-[10px] truncate max-w-[320px]">
                            {b.boxCode}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[320px]">
                            Biến thể: {contents.variantName || "—"} · HSD:{" "}
                            {b.expiryDate
                              ? new Date(b.expiryDate).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTransferBox(b);
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                              title="Chuyển hàng sang vị trí khác"
                            >
                              Chuyển
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDisposeSingleBox(b);
                              }}
                              disabled={
                                createDisposalRequestState.isLoading ||
                                disposeExpiredBoxesState.isLoading
                              }
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              title="Tiêu hủy hàng (có ghi nhận lịch sử)"
                            >
                              Tiêu hủy
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {b.volumeM3 ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-amber-600">
                Quy định: 1 slot chỉ được chứa 1 loại sản phẩm.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span
          id="slot-modal-title"
          className="text-xs font-semibold text-slate-800"
        >
          Chi tiết slot: {slot.code}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          aria-label="Đóng"
        >
          ×
        </button>
      </div>
      <dl className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <dt className="text-slate-500">Sức chứa (m³)</dt>
          <dd className="font-medium text-slate-800">{effectiveCapacity}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Đang chứa (m³)</dt>
          <dd className="font-medium text-slate-800">{effectiveCurrentCapacity}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Tỷ lệ sử dụng</dt>
          <dd className="font-medium text-slate-800">{ratio.toFixed(0)}%</dd>
        </div>
        {slot.qrCode && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">QR</dt>
              <div className="flex items-center gap-2">
                <dd className="font-mono text-[10px] text-slate-600 truncate max-w-[120px]">
                  {slot.qrCode}
                </dd>
                <button
                  type="button"
                  onClick={exportSlotQrToPdf}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  In PDF QR
                </button>
              </div>
            </div>
            {slot.qrImageUrl ? (
              <div className="flex justify-center pt-1">
                <img
                  src={slot.qrImageUrl}
                  alt=""
                  className="h-24 w-24 rounded-lg border border-slate-200 bg-white object-contain"
                />
              </div>
            ) : null}
          </div>
        )}
      </dl>
      <div className="mt-2 pt-2 border-t border-slate-100">
        <p className="text-[10px] font-medium text-slate-600 mb-0.5">
          Vị trí đang chứa
        </p>
        {isLoadingContents ? (
          <p className="text-[11px] text-slate-500">Đang tải chi tiết...</p>
        ) : !contents || contents.boxCount === 0 ? (
          <p className="text-[11px] text-slate-700">
            Trống ({effectiveCurrentCapacity} / {effectiveCapacity} m³ ·{" "}
            {ratio.toFixed(0)}% tải)
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">
                {contents.productName || "Sản phẩm"}
              </span>
              {contents.variantName ? ` · ${contents.variantName}` : ""} —{" "}
              {contents.boxCount} box ·{" "}
              {contents.totalBoxVolumeM3 ?? contents.currentCapacity} m³
            </p>
            <p className="text-[10px] text-slate-500">
              {contents.currentCapacity} / {contents.capacity} m³ · còn{" "}
              {contents.remainingCapacity} m³ trống
            </p>
            <button
              type="button"
              onClick={() => setIsBoxesModalOpen(true)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Xem danh sách box ({contents.boxCount})
            </button>
            <p className="text-[10px] text-amber-600">
              Quy định: 1 slot chỉ được chứa 1 loại sản phẩm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const getUsageStyleFromRatio = (ratio: number) => {
  if (ratio <= 0) {
    return "bg-slate-100 border-slate-200 text-slate-600";
  }
  if (ratio < 0.7) {
    return "bg-emerald-500/90 border-emerald-500 text-white";
  }
  if (ratio < 0.9) {
    return "bg-amber-400/90 border-amber-400 text-slate-900";
  }
  return "bg-rose-500/95 border-rose-500 text-white";
};

type RackOverviewProps = {
  rackId: number;
  name: string;
  onSlotClick?: (slot: SlotItem) => void;
  variantFilterId?: number | null;
};

const RackOverview = ({
  rackId,
  name,
  onSlotClick,
  variantFilterId,
}: RackOverviewProps) => {
  const { data: slots, isLoading } = useGetSlotsQuery(rackId);

  const { totalCapacity, totalCurrent } = useMemo(() => {
    if (!slots || slots.length === 0) {
      return { totalCapacity: 0, totalCurrent: 0 };
    }
    return slots.reduce(
      (acc, s) => ({
        totalCapacity: acc.totalCapacity + (s.capacity || 0),
        totalCurrent: acc.totalCurrent + (s.currentCapacity || 0),
      }),
      { totalCapacity: 0, totalCurrent: 0 }
    );
  }, [slots]);

  const ratio =
    totalCapacity > 0 ? Math.min(1, totalCurrent / totalCapacity) : 0;
  const style = getUsageStyleFromRatio(ratio);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md min-w-[200px]">
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 ${style}`}
      >
        <span className="font-semibold text-sm truncate">{name}</span>
        <span className="text-[10px] opacity-90 whitespace-nowrap shrink-0">
          {totalCurrent}/{totalCapacity} ({Math.round(ratio * 100)}%)
        </span>
      </div>
      {isLoading && (
        <div className="px-3 py-2 text-[10px] text-slate-500">
          Đang tải slot...
        </div>
      )}
      {slots && slots.length > 0 && (
        <div className="p-2 flex flex-wrap gap-1.5">
          {slots.map((s) => {
            const r =
              s.capacity && s.capacity > 0
                ? Math.min(1, s.currentCapacity / s.capacity)
                : 0;
            const cellStyle = getUsageStyleFromRatio(r);
            const pct = Math.round(r * 100);
            const hasVariantFilter = !!variantFilterId;
            const isVariantMatched =
              hasVariantFilter &&
              Number(s.productVariantId ?? 0) === Number(variantFilterId);
            const isVariantDimmed = hasVariantFilter && !isVariantMatched;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSlotClick?.(s)}
                className={`inline-flex flex-col items-center justify-center rounded-lg border min-w-[52px] py-1.5 px-1.5 text-[10px] font-medium cursor-pointer transition ring-2 ring-transparent hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${cellStyle} ${
                  isVariantMatched
                    ? "bg-sky-600 text-white border-sky-700 shadow-[0_0_0_2px_rgba(14,165,233,0.28)]"
                    : ""
                } ${
                  isVariantDimmed
                    ? "opacity-40 saturate-50"
                    : ""
                }`}
                title={`${s.code}: ${s.currentCapacity}/${s.capacity} (${pct}%) — Bấm xem chi tiết`}
              >
                <span className="truncate max-w-full font-semibold">
                  {s.code}
                </span>
                <span className="text-[9px] opacity-90 mt-0.5">
                  {s.currentCapacity}/{s.capacity} ({pct}%)
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

type ZoneOverviewProps = {
  zoneId: number;
  name: string;
  onSlotClick?: (slot: SlotItem) => void;
  variantFilterId?: number | null;
};

const ZoneOverview = ({
  zoneId,
  name,
  onSlotClick,
  variantFilterId,
}: ZoneOverviewProps) => {
  const { data: racks, isLoading } = useGetRacksQuery(zoneId);

  return (
    <div className="border border-slate-200 rounded-2xl p-3.5 bg-gradient-to-b from-slate-50 to-slate-100/60 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-900">
          Khu <span className="font-bold">{name}</span>
        </p>
        <p className="text-[10px] text-slate-500">
          {isLoading ? "Đang tải rack..." : `${racks?.length ?? 0} rack`}
        </p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {racks && racks.length > 0 ? (
          racks.map((r) => (
            <RackOverview
              key={r.id}
              rackId={r.id}
              name={r.name}
              onSlotClick={onSlotClick}
              variantFilterId={variantFilterId}
            />
          ))
        ) : !isLoading ? (
          <p className="text-[10px] text-slate-500 italic">
            Chưa có rack trong zone này.
          </p>
        ) : null}
      </div>
    </div>
  );
};

const WarehouseMap = () => {
  const { isManager } = useRoleGuard();
  const warehouseBasePath = isManager() ? "/manager/warehouses" : "/admin/warehouses";
  const putawayBasePath = isManager() ? "/manager/putaway" : "/admin/putaway";
  const { id } = useParams<{ id: string }>();
  const warehouseId = Number(id);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { data: warehouse, isLoading: isWarehouseLoading } =
    useGetWarehouseQuery(warehouseId, {
      skip: Number.isNaN(warehouseId),
    });

  const { data: zones } = useGetZonesQuery(warehouseId, {
    skip: Number.isNaN(warehouseId),
  });

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<number | null>(null);
  const [detailSlot, setDetailSlot] = useState<SlotItem | null>(null);
  const [selectedUnassignedBoxQr, setSelectedUnassignedBoxQr] = useState<string>("");
  const [selectedVariantFilterId, setSelectedVariantFilterId] = useState<number | null>(null);
  const [isAreaDetailModalOpen, setIsAreaDetailModalOpen] = useState(false);
  const [slotExpiryFilter, setSlotExpiryFilter] = useState<"ALL" | "EXPIRED" | "D1" | "D3" | "D7">("ALL");
  const [slotIdsByExpiryFilter, setSlotIdsByExpiryFilter] = useState<number[]>([]);
  const [, setIsLoadingExpiryFilter] = useState(false);
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [disposeTab, setDisposeTab] = useState<"expired" | "history">("expired");
  const [selectedDisposeBoxIds, setSelectedDisposeBoxIds] = useState<number[]>(
    [],
  );
  const [isBulkDisposeModalOpen, setIsBulkDisposeModalOpen] = useState(false);
  const [bulkDisposeReason, setBulkDisposeReason] = useState("");
  const [disposeFromDate, setDisposeFromDate] = useState("");
  const [disposeToDate, setDisposeToDate] = useState("");
  const [disposeCreatedBy, setDisposeCreatedBy] = useState("");

  const {
    data: unassignedBoxes = [],
    isFetching: isFetchingUnassignedBoxes,
  } = useGetUnassignedBoxesByWarehouseQuery(warehouseId, {
    skip: Number.isNaN(warehouseId),
  });
  const {
    data: expiredBoxes = [],
    isFetching: isFetchingExpiredBoxes,
    refetch: refetchExpiredBoxes,
  } = useGetExpiredBoxesByWarehouseQuery(warehouseId, {
    skip: Number.isNaN(warehouseId),
  });
  const [disposeExpiredBoxesForList, disposeExpiredBoxesForListState] =
    useDisposeExpiredBoxesMutation();
  const { data: disposeHistory = [], isFetching: isFetchingDisposeHistory } =
    useGetDisposeHistoryByWarehouseQuery(
      {
        warehouseId,
        fromDate: disposeFromDate || undefined,
        toDate: disposeToDate || undefined,
        createdBy: disposeCreatedBy.trim() || undefined,
      },
      { skip: Number.isNaN(warehouseId) || !isDisposeModalOpen || disposeTab !== "history" },
    );
  const { data: racks } = useGetRacksQuery(selectedZoneId ?? 0, {
    skip: !selectedZoneId,
  });

  const { data: slots, isLoading: isSlotsLoading } = useGetSlotsQuery(
    selectedRackId ?? 0,
    {
      skip: !selectedRackId,
    }
  );

  useEffect(() => {
    if (!selectedZoneId && zones && zones.length > 0) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  useEffect(() => {
    if (!selectedRackId && racks && racks.length > 0) {
      setSelectedRackId(racks[0].id);
    }
  }, [racks, selectedRackId]);

  const legend = [
    { label: "Trống", className: "bg-slate-200 border-slate-300" },
    { label: "< 70% tải", className: "bg-emerald-500 text-white" },
    { label: "70–90% tải", className: "bg-yellow-400 text-slate-900" },
    { label: "> 90% tải", className: "bg-red-500 text-white" },
  ];

  const getSlotStyle = (slot: SlotItem) => {
    if (!slot.capacity || slot.capacity <= 0 || slot.currentCapacity <= 0) {
      return getUsageStyleFromRatio(0);
    }

    const ratio = slot.currentCapacity / slot.capacity;
    return getUsageStyleFromRatio(ratio);
  };

  const selectedZoneName = useMemo(() => {
    if (!zones || !selectedZoneId) return "";
    return zones.find((z) => z.id === selectedZoneId)?.name ?? "";
  }, [zones, selectedZoneId]);

  const selectedRackName = useMemo(() => {
    if (!racks || !selectedRackId) return "";
    return racks.find((r) => r.id === selectedRackId)?.name ?? "";
  }, [racks, selectedRackId]);

  const variantOptionsInRack = useMemo(() => {
    if (!slots?.length) return [];
    const map = new Map<number, { id: number; label: string }>();
    for (const s of slots) {
      if (!s.productVariantId || s.productVariantId <= 0) continue;
      if (map.has(s.productVariantId)) continue;
      const label = s.productName
        ? `${s.productName}${s.productVariantName ? ` · ${s.productVariantName}` : ""}`
        : s.productVariantName || `Variant #${s.productVariantId}`;
      map.set(s.productVariantId, { id: s.productVariantId, label });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "vi"),
    );
  }, [slots]);

  useEffect(() => {
    if (!selectedVariantFilterId) return;
    const stillExists = variantOptionsInRack.some(
      (v) => v.id === selectedVariantFilterId,
    );
    if (!stillExists) {
      setSelectedVariantFilterId(null);
    }
  }, [variantOptionsInRack, selectedVariantFilterId]);

  const filteredUnassignedBoxes = useMemo(() => {
    const cleanBoxes = unassignedBoxes.filter(
      (b) =>
        Number(b.weight ?? 0) > 0 &&
        (b.status ?? "").toLowerCase() === "stored" &&
        (!b.expiryDate || new Date(b.expiryDate).getTime() > getNowMs()),
    );

    if (!selectedVariantFilterId) return cleanBoxes;
    return cleanBoxes.filter((b) => b.productVariantId === selectedVariantFilterId);
  }, [unassignedBoxes, selectedVariantFilterId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!slots?.length || slotExpiryFilter === "ALL") {
        if (!cancelled) {
          setSlotIdsByExpiryFilter([]);
          setIsLoadingExpiryFilter(false);
        }
        return;
      }

      if (!cancelled) {
        setIsLoadingExpiryFilter(true);
      }
      const matched: number[] = [];

      await Promise.all(
        slots.map(async (slot) => {
          try {
            const contents = await dispatch(
              userApi.endpoints.getSlotContents.initiate(slot.id, {
                forceRefetch: true,
                subscribe: false,
              }),
            ).unwrap();
            const hasMatch = (contents.boxes ?? []).some((b) => {
              if (!b.expiryDate) return false;
              const now = new Date();
              const end = new Date(b.expiryDate);
              if (Number.isNaN(end.getTime())) return false;
              const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
              if (slotExpiryFilter === "EXPIRED") return diffDays <= 0;
              if (slotExpiryFilter === "D1") return diffDays > 0 && diffDays <= 1;
              if (slotExpiryFilter === "D3") return diffDays > 1 && diffDays <= 3;
              if (slotExpiryFilter === "D7") return diffDays > 3 && diffDays <= 7;
              return false;
            });
            if (hasMatch) matched.push(slot.id);
          } catch {
            // skip slot errors, keep others
          }
        }),
      );

      if (!cancelled) {
        setSlotIdsByExpiryFilter(matched);
        setIsLoadingExpiryFilter(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [dispatch, slots, slotExpiryFilter]);

  const expiredBoxesInWarehouse = useMemo(() => {
    return [...expiredBoxes].sort((a, b) => {
      const ea = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      const eb = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      return ea - eb;
    });
  }, [expiredBoxes]);

  useEffect(() => {
    if (!expiredBoxesInWarehouse.length) {
      setSelectedDisposeBoxIds([]);
      return;
    }
    const idSet = new Set(expiredBoxesInWarehouse.map((b) => b.id));
    setSelectedDisposeBoxIds((prev) => prev.filter((id) => idSet.has(id)));
  }, [expiredBoxesInWarehouse]);

  const toggleSelectDisposeBox = (boxId: number) => {
    setSelectedDisposeBoxIds((prev) =>
      prev.includes(boxId) ? prev.filter((id) => id !== boxId) : [...prev, boxId],
    );
  };

  const handleDisposeExpiredBoxes = async () => {
    if (!selectedDisposeBoxIds.length) {
      toast.error("Chọn ít nhất 1 box để tiêu hủy.");
      return;
    }
    setBulkDisposeReason("");
    setIsBulkDisposeModalOpen(true);
  };

  const submitBulkDispose = async () => {
    if (!selectedDisposeBoxIds.length) {
      toast.error("Chọn ít nhất 1 box để tiêu hủy.");
      return;
    }

    try {
      const result = await disposeExpiredBoxesForList({
        boxIds: selectedDisposeBoxIds,
      }).unwrap();
      toast.success(result.message);
      setIsBulkDisposeModalOpen(false);
      setSelectedDisposeBoxIds([]);
      await refetchExpiredBoxes();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Tiêu hủy box thất bại.";
      toast.error(msg);
    }
  };

  if (Number.isNaN(warehouseId)) {
    return (
      <div className="px-5">
        <div className="bg-white rounded-[15px] p-6 shadow-sm">
          <p className="text-sm text-red-500">
            Không tìm thấy kho. Vui lòng quay lại danh sách kho.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5">
      <DisposeReasonModal
        isOpen={isBulkDisposeModalOpen}
        title={`Tiêu hủy ${selectedDisposeBoxIds.length} hàng đã chọn`}
        subtitle="Danh sách này chỉ gồm hàng hết hạn nên sẽ tiêu hủy trực tiếp, không qua duyệt."
        value={bulkDisposeReason}
        onChange={setBulkDisposeReason}
        onClose={() => {
          setIsBulkDisposeModalOpen(false);
          setBulkDisposeReason("");
        }}
        onConfirm={() => void submitBulkDispose()}
        isSubmitting={disposeExpiredBoxesForListState.isLoading}
        confirmLabel="Tiêu hủy ngay"
        showReasonField={false}
      />
      {detailSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDetailSlot(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="slot-modal-title"
        >
          <div
            className="max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <SlotDetailPanel
              slot={detailSlot}
              warehouseId={warehouseId}
              onClose={() => setDetailSlot(null)}
              onTransferBox={(box) => {
                const qr = box.qrCode || "";
                if (!qr) {
                  navigate(putawayBasePath);
                  toast(
                    "Hàng chưa có mã QR trên hệ thống. Tại trang xếp hàng, hãy chụp/chọn ảnh có QR hàng hoặc nhập mã.",
                    { icon: "📷", duration: 4500 },
                  );
                  return;
                }
                navigate(`${putawayBasePath}?boxQr=${encodeURIComponent(qr)}`);
              }}
            />
          </div>
        </div>
      )}
      {isDisposeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsDisposeModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Danh sách box tiêu hủy (hàng hết hạn)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kho #{warehouseId} · {expiredBoxesInWarehouse.length} box có thể tiêu hủy
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDisposeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setDisposeTab("expired")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    disposeTab === "expired"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Hàng hết hạn
                </button>
                <button
                  type="button"
                  onClick={() => setDisposeTab("history")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    disposeTab === "history"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Lịch sử tiêu hủy
                </button>
              </div>

              {disposeTab === "expired" ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDisposeBoxIds(expiredBoxesInWarehouse.map((b) => b.id))
                        }
                        disabled={!expiredBoxesInWarehouse.length}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDisposeBoxIds([])}
                        disabled={!selectedDisposeBoxIds.length}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void refetchExpiredBoxes()}
                        disabled={isFetchingExpiredBoxes}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {isFetchingExpiredBoxes ? "Đang tải..." : "Làm mới"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDisposeExpiredBoxes()}
                        disabled={
                          disposeExpiredBoxesForListState.isLoading ||
                          !selectedDisposeBoxIds.length
                        }
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {disposeExpiredBoxesForListState.isLoading
                          ? "Đang tiêu hủy..."
                          : `Tiêu hủy đã chọn (${selectedDisposeBoxIds.length})`}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left w-[40px]">#</th>
                          <th className="px-3 py-2 text-left">Hàng</th>
                          <th className="px-3 py-2 text-left">Lô hàng</th>
                          <th className="px-3 py-2 text-left">HSD</th>
                          <th className="px-3 py-2 text-left">Vị trí</th>
                          <th className="px-3 py-2 text-right">Kg</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {expiredBoxesInWarehouse.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                              Không có hàng hết hạn cần tiêu hủy.
                            </td>
                          </tr>
                        ) : (
                          expiredBoxesInWarehouse.map((b) => {
                            const checked = selectedDisposeBoxIds.includes(b.id);
                            return (
                              <tr key={b.id} className="border-t border-slate-100 hover:bg-white">
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleSelectDisposeBox(b.id)}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <p className="font-mono text-[10px]">{b.boxCode}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {b.productName || "—"}
                                    {b.productVariantName ? ` · ${b.productVariantName}` : ""}
                                  </p>
                                </td>
                                <td className="px-3 py-2">{b.lotCode || "—"}</td>
                                <td className="px-3 py-2">
                                  {b.expiryDate
                                    ? new Date(b.expiryDate).toLocaleDateString("vi-VN")
                                    : "—"}
                                </td>
                                <td className="px-3 py-2">{b.slotCode || "Chưa xếp"}</td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {b.weight}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="date"
                      value={disposeFromDate}
                      onChange={(e) => setDisposeFromDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                    <input
                      type="date"
                      value={disposeToDate}
                      onChange={(e) => setDisposeToDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={disposeCreatedBy}
                      onChange={(e) => setDisposeCreatedBy(e.target.value)}
                      placeholder="Lọc theo người thao tác"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs md:col-span-2"
                    />
                  </div>

                  <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Thời gian</th>
                          <th className="px-3 py-2 text-left">Hàng / Lô</th>
                          <th className="px-3 py-2 text-left">Sản phẩm</th>
                          <th className="px-3 py-2 text-left">Người thao tác</th>
                          <th className="px-3 py-2 text-right">Kg tiêu hủy</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {isFetchingDisposeHistory ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                              Đang tải lịch sử...
                            </td>
                          </tr>
                        ) : disposeHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                              Chưa có lịch sử tiêu hủy theo bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          disposeHistory.map((h) => (
                            <tr key={h.transactionId} className="border-t border-slate-100 hover:bg-white">
                              <td className="px-3 py-2">
                                {h.createdAt
                                  ? new Date(h.createdAt).toLocaleString("vi-VN")
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-mono text-[10px]">{h.boxCode || `#${h.boxId}`}</p>
                                <p className="text-[10px] text-slate-500">{h.lotCode || "—"}</p>
                              </td>
                              <td className="px-3 py-2">
                                {h.productName || "—"}
                                {h.productVariantName ? ` · ${h.productVariantName}` : ""}
                              </td>
                              <td className="px-3 py-2">{h.createdByName || h.createdBy}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{h.quantity}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="bg-white/95 rounded-[18px] p-6 shadow-sm flex flex-col gap-4 border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Sơ đồ kho
            </h1>
            {warehouse && (
              <p className="text-xs text-slate-500 mt-1">
                {warehouse.name} — {warehouse.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsDisposeModalOpen(true)}
              className="inline-flex items-center rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 font-medium text-rose-700 hover:bg-rose-100"
            >
              Danh sách hàng tiêu hủy
            </button>
            <Link
              to={`${warehouseBasePath}/${warehouseId}/config`}
              className="inline-flex items-center rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Cấu hình kho
            </Link>
            <Link
              to={warehouseBasePath}
              className="text-emerald-600 hover:underline"
            >
              ← Quay lại danh sách kho
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                Sản phẩm biến thể
              </span>
              <select
                value={selectedVariantFilterId ?? ""}
                onChange={(e) =>
                  setSelectedVariantFilterId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full sm:w-auto min-w-[220px] max-w-[280px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!variantOptionsInRack.length}
              >
                <option value="">
                  {!variantOptionsInRack.length
                    ? "Rack chưa có sản phẩm"
                    : "Chọn biến thể"}
                </option>
                {variantOptionsInRack.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <select
                value={slotExpiryFilter}
                onChange={(e) =>
                  setSlotExpiryFilter(
                    e.target.value as "ALL" | "EXPIRED" | "D1" | "D3" | "D7",
                  )
                }
                className="w-full sm:w-auto min-w-[220px] max-w-[280px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
              >
                <option value="ALL">Lọc hạn dùng theo ô (tất cả)</option>
                <option value="EXPIRED">Ô có hàng đã hết hạn</option>
                <option value="D1">Ô có hàng còn 1 ngày hết hạn</option>
                <option value="D3">Ô có hàng còn 3 ngày hết hạn</option>
                <option value="D7">Ô có hàng còn 7 ngày hết hạn</option>
              </select>
              <button
                type="button"
                onClick={() => setIsAreaDetailModalOpen(true)}
                className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 sm:ml-auto"
              >
                Mở chi tiết khu vực
              </button>
          </div>

        </div>

        {zones && zones.length > 0 && (
          <div className="mt-1">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              Tổng quan cấu trúc kho
              <span className="flex flex-wrap items-center gap-2 text-[11px] font-normal">
                {legend.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 border border-slate-200 text-slate-500"
                  >
                    <span className={`h-3 w-5 rounded-sm border ${item.className}`} />
                    {item.label}
                  </span>
                ))}
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {zones.map((z) => (
                <ZoneOverview
                  key={z.id}
                  zoneId={z.id}
                  name={z.name}
                  onSlotClick={(slot) => setDetailSlot(slot)}
                  variantFilterId={selectedVariantFilterId}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {isAreaDetailModalOpen && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/40"
          onClick={() => setIsAreaDetailModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-6xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Chi tiết khu vực</p>
              <button
                type="button"
                onClick={() => setIsAreaDetailModalOpen(false)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    Khu:
                  </span>
                  <select
                    value={selectedZoneId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedZoneId(value ? Number(value) : null);
                      setSelectedRackId(null);
                    }}
                    className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Chọn khu</option>
                    {zones?.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    Kệ:
                  </span>
                  <select
                    value={selectedRackId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedRackId(value ? Number(value) : null);
                    }}
                    className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Chọn kệ</option>
                    {racks?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    Hàng chưa xếp:
                  </span>
                  <select
                    value={selectedUnassignedBoxQr}
                    onChange={(e) => {
                      const qr = e.target.value;
                      setSelectedUnassignedBoxQr(qr);
                      if (qr) {
                        navigate(`${putawayBasePath}?boxQr=${encodeURIComponent(qr)}`);
                      }
                    }}
                    className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    disabled={
                      isFetchingUnassignedBoxes || !filteredUnassignedBoxes.length
                    }
                  >
                    <option value="">
                      {!filteredUnassignedBoxes.length
                        ? isFetchingUnassignedBoxes
                          ? "Đang tải..."
                          : "Không có hàng chưa xếp theo bộ lọc"
                        : "Chọn hàng chưa xếp"}
                    </option>
                    {filteredUnassignedBoxes.map((b) => (
                      <option key={b.id} value={b.qrCode ?? ""} disabled={!b.qrCode}>
                        #{b.id} · {b.boxCode}
                        {b.productVariantName ? ` · ${b.productVariantName}` : ""}
                        {!b.qrCode ? " (chưa có QR)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {legend.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span
                      className={`h-3 w-5 rounded-sm border ${item.className}`}
                    />
                    <span className="text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {(isWarehouseLoading || (!slots && isSlotsLoading)) && (
              <p className="text-xs text-slate-500">Đang tải sơ đồ kho...</p>
            )}

            {!selectedZoneId && (
              <p className="text-xs text-slate-500">
                Chưa có zone nào. Hãy vào phần cấu hình để thêm zone.
              </p>
            )}

            {selectedZoneId && !selectedRackId && (
              <p className="text-xs text-slate-500">
                Chọn rack trong zone "{selectedZoneName}" để xem sơ đồ slot.
              </p>
            )}

            {selectedRackId && slots && slots.length === 0 && (
              <p className="text-xs text-slate-500">
                Chưa có vị trí nào trong kệ "{selectedRackName}".
              </p>
            )}

            {selectedRackId && slots && slots.length > 0 && (
              <div className="mt-3 border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Khu: {selectedZoneName || "—"} • Kệ:{" "}
                      {selectedRackName || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mỗi ô là một vị trí, màu sắc thể hiện mức độ sử dụng tải.
                    </p>
                    {selectedVariantFilterId ? (
                      <p className="text-[11px] text-sky-700 mt-0.5">
                        Vị trí có viền xanh dương là vị trí đang chứa biến thể đã chọn, các vị trí còn lại được làm mờ.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {slots.map((slot) => {
                    const style = getSlotStyle(slot);
                    const ratio =
                      slot.capacity > 0
                        ? (slot.currentCapacity / slot.capacity) * 100
                        : 0;
                    const isSelected = detailSlot?.id === slot.id;
                    const hasVariantFilter = !!selectedVariantFilterId;
                    const isVariantMatched =
                      hasVariantFilter &&
                      Number(slot.productVariantId ?? 0) ===
                        Number(selectedVariantFilterId);
                    const isVariantDimmed = hasVariantFilter && !isVariantMatched;
                    const hasExpiryFilter = slotExpiryFilter !== "ALL";
                    const isExpiryMatched = hasExpiryFilter && slotIdsByExpiryFilter.includes(slot.id);
                    const isExpiryDimmed = hasExpiryFilter && !isExpiryMatched;
                    const isHighlighted = isVariantMatched || isExpiryMatched;
                    const shouldDim = isVariantDimmed || isExpiryDimmed;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() =>
                          setDetailSlot((prev) =>
                            prev?.id === slot.id ? null : slot
                          )
                        }
                        className={`relative flex flex-col items-center justify-center rounded-xl border text-[10px] font-medium shadow-sm h-14 cursor-pointer transition ring-2 ring-transparent hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${style} ${isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""} ${isHighlighted ? "z-10 bg-sky-600 text-white border-sky-700 shadow-[0_0_0_3px_rgba(14,165,233,0.30)] scale-[1.03]" : ""} ${shouldDim ? "opacity-35 saturate-50" : ""}`}
                        title="Bấm xem chi tiết vị trí"
                      >
                        <span className="truncate max-w-[80%]">{slot.code}</span>
                        <span className="mt-0.5 text-[9px] opacity-90">
                          {slot.currentCapacity}/{slot.capacity} (
                          {ratio.toFixed(0)}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseMap;

