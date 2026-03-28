import toast from "react-hot-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { AUTH_ROLE } from "../../auth/constants/auth.constants";
import { decodeQrFromImageFile } from "../../../shared/lib/decodeQrFromImage";
import QrCameraScannerModal from "../../../shared/components/QrCameraScannerModal";
import {
  useApproveStockCheckMutation,
  useCompleteStockCheckCountMutation,
  useGetStockCheckDetailsQuery,
  useRejectStockCheckMutation,
  useStartStockCheckMutation,
  useUpdateCountedWeightMutation,
} from "../api/stock-check.api";
import { useLazyGetBoxByQrQuery } from "../../goods-receipt/api/goods-receipt.api";
import type { StockCheckDetailLine, UpdateCountedWeightPayload } from "../types/stock-check.type";
import { Loader2, CheckCircle2, XCircle, Play, Save, QrCode, ImageUp, Camera } from "lucide-react";
import {
  toVietnameseStockCheckStatus,
  toVietnameseStockCheckType,
  toVietnameseVarianceReason,
  toVietnameseVarianceType,
} from "../utils/stock-check-labels";

function formatDateTime(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleString("vi-VN");
}

const VARIANCE_TOLERANCE = 0.001;

function varianceReasonStringToValue(reason?: string | null): number | null {
  if (!reason) return null;
  if (reason === "Damaged") return 1;
  if (reason === "Loss") return 2;
  if (reason === "MeasurementError") return 3;
  return null;
}

function getVarianceTypeFromDiff(diff: number): "Match" | "Shortage" | "Excess" {
  if (Math.abs(diff) <= VARIANCE_TOLERANCE) return "Match";
  return diff < 0 ? "Shortage" : "Excess";
}

export default function StockCheckDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const stockCheckId = Number(id);

  const auth = useAuth();
  const roles = auth.user?.roles ?? [];
  const isWarehouseStaff = roles.includes(AUTH_ROLE.WAREHOUSE_STAFF);
  const isManager = roles.includes(AUTH_ROLE.MANAGER) || roles.includes(AUTH_ROLE.ADMIN);

  const { data, isLoading, refetch } = useGetStockCheckDetailsQuery(stockCheckId, {
    skip: Number.isNaN(stockCheckId),
  });

  const [updateCountedWeight, { isLoading: isUpdating }] =
    useUpdateCountedWeightMutation();
  const [completeStockCheckCount, { isLoading: isCompleting }] =
    useCompleteStockCheckCountMutation();
  const [startStockCheck, { isLoading: isStarting }] =
    useStartStockCheckMutation();
  const [approveStockCheck, { isLoading: isApproving }] =
    useApproveStockCheckMutation();
  const [rejectStockCheck, { isLoading: isRejecting }] =
    useRejectStockCheckMutation();
  const [triggerBoxByQr, { isFetching: isFindingByQr }] =
    useLazyGetBoxByQrQuery();

  // Local editable inputs per detail row
  const [inputs, setInputs] = useState<
    Record<
      number,
      { countedWeight: string; note: string; varianceReason: number | null }
    >
  >({});
  const [detailQrInput, setDetailQrInput] = useState("");
  const [isDetailQrCameraOpen, setIsDetailQrCameraOpen] = useState(false);
  const [highlightDetailId, setHighlightDetailId] = useState<number | null>(null);
  const detailQrImageRef = useRef<HTMLInputElement | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const countedInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!data?.details) return;
    const next: typeof inputs = {};
    data.details.forEach((d) => {
      next[d.stockCheckDetailId] = {
        countedWeight: d.countedWeight != null ? String(d.countedWeight) : "",
        note: d.note ?? "",
        varianceReason: varianceReasonStringToValue(d.varianceReason),
      };
    });
    setInputs(next);
  }, [data?.stockCheckId]); // only reset when switching phiếu

  useEffect(() => {
    setHighlightDetailId(null);
  }, [data?.stockCheckId]);

  const stockStatus = data?.status ?? "";
  const isDraft = stockStatus === "Draft";
  const isInProgress = stockStatus === "InProgress";
  const isCounted = stockStatus === "Counted";

  const canWarehouseEdit = isWarehouseStaff && isInProgress;
  const canWarehouseStart = isWarehouseStaff && isDraft;
  const canManagerApprove = isManager && isCounted;

  const details = (data?.details ?? []) as StockCheckDetailLine[];

  const readyToComplete = useMemo(() => {
    if (!canWarehouseEdit) return false;
    if (details.length === 0) return false;

    for (const d of details) {
      const inp = inputs[d.stockCheckDetailId];
      if (!inp) return false;
      if (inp.countedWeight.trim() === "") return false;

      const counted = Number(inp.countedWeight);
      if (!Number.isFinite(counted) || counted < 0) return false;

      const diff = counted - d.snapshotWeight;
      const varianceType = getVarianceTypeFromDiff(diff);
      if (varianceType === "Shortage") {
        if (inp.varianceReason == null) return false;
      }
    }
    return true;
  }, [canWarehouseEdit, details, inputs]);

  const handleStart = async () => {
    if (!data) return;
    try {
      await startStockCheck(data.stockCheckId).unwrap();
      toast.success("Đã bắt đầu kiểm kê");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể bắt đầu kiểm kê");
    }
  };

  const handleComplete = async () => {
    if (!data) return;
    try {
      await completeStockCheckCount(data.stockCheckId).unwrap();
      toast.success("Đã chốt đếm");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể chốt đếm");
    }
  };

  const handleApprove = async () => {
    if (!data) return;
    try {
      await approveStockCheck(data.stockCheckId).unwrap();
      toast.success("Đã duyệt phiếu");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể duyệt");
    }
  };

  const handleReject = async () => {
    if (!data) return;
    try {
      await rejectStockCheck(data.stockCheckId).unwrap();
      toast.success("Đã từ chối phiếu");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể từ chối");
    }
  };

  const handleUpdateRow = async (d: StockCheckDetailLine) => {
    const inp = inputs[d.stockCheckDetailId];
    if (!inp) return;
    const counted = Number(inp.countedWeight);
    if (!Number.isFinite(counted) || counted < 0) {
      toast.error("Khối lượng kiểm kê không hợp lệ");
      return;
    }

    const diff = counted - d.snapshotWeight;
    const varianceType = getVarianceTypeFromDiff(diff);
    const varianceReason =
      varianceType === "Shortage" ? inp.varianceReason : null;

    if (varianceType === "Shortage" && varianceReason == null) {
      toast.error("Thiếu hàng cần chọn nguyên nhân");
      return;
    }

    const payload: UpdateCountedWeightPayload = {
      stockCheckDetailId: d.stockCheckDetailId,
      countedWeight: counted,
      note: inp.note.trim() ? inp.note.trim() : null,
      varianceReason,
    };

    try {
      await updateCountedWeight(payload).unwrap();
      toast.success("Đã lưu dòng");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể lưu dòng");
    }
  };

  const handleFocusDetailByQr = async (qrOverride?: string) => {
    const qr = (qrOverride ?? detailQrInput).trim();
    if (!qr) {
      toast.error("Vui lòng nhập/quét QR thùng.");
      return;
    }
    try {
      const box = await triggerBoxByQr(qr).unwrap();
      const matched = details.find(
        (d) => d.boxId === box.id || d.boxCode === box.boxCode,
      );

      if (!matched) {
        toast.error("Thùng này không thuộc phiếu kiểm kê hiện tại.");
        return;
      }

      setDetailQrInput(qr);
      setHighlightDetailId(matched.stockCheckDetailId);
      const rowEl = rowRefs.current[matched.stockCheckDetailId];
      rowEl?.scrollIntoView({ behavior: "smooth", block: "center" });

      if (canWarehouseEdit) {
        setTimeout(() => {
          countedInputRefs.current[matched.stockCheckDetailId]?.focus();
        }, 120);
      }

      toast.success(`Đã định vị thùng ${matched.boxCode}`);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không tìm thấy thùng theo QR.";
      toast.error(msg);
    }
  };

  const handleDetailQrFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const loading = toast.loading("Đang đọc QR từ ảnh...");
    try {
      const text = await decodeQrFromImageFile(file);
      if (!text) {
        toast.error("Không tìm thấy QR trong ảnh.", { id: loading });
        return;
      }
      setDetailQrInput(text);
      await handleFocusDetailByQr(text);
      toast.success("Đã đọc QR từ ảnh.", { id: loading });
    } catch {
      toast.error("Không đọc được QR từ ảnh.", { id: loading });
    }
  };

  if (isLoading) {
    return <div className="text-center text-slate-500 py-10">Đang tải...</div>;
  }

  if (!data) {
    return (
      <div className="text-center text-slate-500 py-10">Phiếu không tồn tại</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">
              Kho: <span className="font-semibold text-slate-800">{data.warehouseName}</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">
              Phiếu kiểm kê #{data.stockCheckId}
            </h2>
            <div className="mt-1 text-sm text-slate-700">
              {toVietnameseStockCheckType(data.checkType)} ·{" "}
              {toVietnameseStockCheckStatus(data.status)} · Thời điểm snapshot:{" "}
              {formatDateTime(data.snapshotAt)}
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <button
              type="button"
              onClick={() =>
                navigate(
                  isWarehouseStaff
                    ? "/warehouse/stock-checks"
                    : "/manager/stock-checks"
                )
              }
              className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Quay lại
            </button>

            {canWarehouseStart ? (
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={isStarting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isStarting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Bắt đầu kiểm kê
              </button>
            ) : null}

            {canWarehouseEdit ? (
              <button
                type="button"
                onClick={() => void handleComplete()}
                disabled={!readyToComplete || isCompleting}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {isCompleting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Chốt đếm
              </button>
            ) : null}

            {canManagerApprove ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleApprove()}
                  disabled={isApproving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Duyệt
                </button>
                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={isRejecting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Từ chối
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Danh sách thùng</div>
        <div className="mt-1 text-xs text-slate-500">
          {details.length} dòng · Đã khóa snapshot: {data.isLockedSnapshot ? "Có" : "Không"}
        </div>
        {details.length > 0 ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-700 inline-flex items-center gap-2">
              <QrCode size={14} />
              Tìm nhanh dòng thùng bằng QR
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={detailQrInput}
                onChange={(e) => setDetailQrInput(e.target.value)}
                placeholder="Dán hoặc quét QR thùng"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => void handleFocusDetailByQr()}
                disabled={isFindingByQr}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {isFindingByQr ? <Loader2 size={14} className="animate-spin" /> : null}
                Tìm dòng
              </button>
              <button
                type="button"
                onClick={() => detailQrImageRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ImageUp size={14} />
                Ảnh QR
              </button>
              <button
                type="button"
                onClick={() => setIsDetailQrCameraOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Camera size={14} />
                Camera
              </button>
              <input
                ref={detailQrImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDetailQrFromImage}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {details.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">Trống</div>
          ) : (
            details.map((d) => {
              const inp = inputs[d.stockCheckDetailId];
              const countedVal = inp?.countedWeight?.trim()
                ? Number(inp.countedWeight)
                : d.countedWeight ?? null;

              const diff =
                countedVal != null && Number.isFinite(countedVal)
                  ? countedVal - d.snapshotWeight
                  : d.differenceWeight ?? null;

              const varianceType =
                diff != null && Number.isFinite(diff) ? getVarianceTypeFromDiff(diff) : d.varianceType ?? null;

              const shortage = varianceType === "Shortage";

              return (
                <div
                  key={d.stockCheckDetailId}
                  ref={(el) => {
                    rowRefs.current[d.stockCheckDetailId] = el;
                  }}
                  className={`rounded-xl border p-3 ${
                    highlightDetailId === d.stockCheckDetailId
                      ? "border-sky-300 bg-sky-50 ring-2 ring-sky-500/60"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">Thùng</div>
                      <div className="text-sm font-semibold text-slate-900 truncate">{d.boxCode}</div>
                      <div className="text-[11px] text-slate-600 truncate mt-1">
                        Lô: {d.lotCode}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">
                        Ô kệ: {d.slotCode ?? "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Tại snapshot</div>
                      <div className="text-sm font-semibold text-slate-900">{d.snapshotWeight} kg</div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Hệ thống hiện tại: {d.currentSystemWeight ?? "—"} kg
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Chênh lệch</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {diff != null && Number.isFinite(diff) ? Math.abs(diff).toFixed(3) : "—"} kg
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Trạng thái:{" "}
                        {toVietnameseVarianceType(
                          typeof varianceType === "string" ? varianceType : null,
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                        <div>
                          <div className="text-xs text-slate-500">Khối lượng kiểm kê (kg)</div>
                          {canWarehouseEdit ? (
                            <input
                              ref={(el) => {
                                countedInputRefs.current[d.stockCheckDetailId] = el;
                              }}
                              type="number"
                              step="0.001"
                              min={0}
                              value={inp?.countedWeight ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInputs((prev) => ({
                                  ...prev,
                                  [d.stockCheckDetailId]: {
                                    countedWeight: val,
                                    note: prev[d.stockCheckDetailId]?.note ?? "",
                                    varianceReason: prev[d.stockCheckDetailId]?.varianceReason ?? null,
                                  },
                                }));
                              }}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                              placeholder="0,000"
                            />
                          ) : (
                            <div className="text-sm font-semibold text-slate-900">
                              {d.countedWeight ?? "—"} kg
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-xs text-slate-500">Nguyên nhân</div>
                          {canWarehouseEdit && shortage ? (
                            <select
                              value={inp?.varianceReason ?? ""}
                              onChange={(e) => {
                                const v = e.target.value === "" ? null : Number(e.target.value);
                                setInputs((prev) => ({
                                  ...prev,
                                  [d.stockCheckDetailId]: {
                                    countedWeight: prev[d.stockCheckDetailId]?.countedWeight ?? "",
                                    note: prev[d.stockCheckDetailId]?.note ?? "",
                                    varianceReason: v,
                                  },
                                }));
                              }}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                            >
                              <option value="">Chọn nguyên nhân</option>
                              <option value={1}>Hỏng</option>
                              <option value={2}>Mất</option>
                              <option value={3}>Sai số cân</option>
                            </select>
                          ) : (
                            <div className="text-sm text-slate-700">
                              {shortage ? (
                                d.varianceReason ? (
                                  toVietnameseVarianceReason(d.varianceReason)
                                ) : (
                                  <span className="text-rose-600">Chưa chọn</span>
                                )
                              ) : (
                                toVietnameseVarianceReason(d.varianceReason)
                              )}
                            </div>
                          )}
                        </div>

                        {canWarehouseEdit ? (
                          <div className="sm:col-span-2">
                            <div className="text-xs text-slate-500">Ghi chú</div>
                            <input
                              type="text"
                              value={inp?.note ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInputs((prev) => ({
                                  ...prev,
                                  [d.stockCheckDetailId]: {
                                    countedWeight: prev[d.stockCheckDetailId]?.countedWeight ?? "",
                                    note: val,
                                    varianceReason: prev[d.stockCheckDetailId]?.varianceReason ?? null,
                                  },
                                }));
                              }}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                              placeholder="(tuỳ chọn)"
                            />
                            <div className="mt-2 flex items-center justify-end">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => void handleUpdateRow(d)}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                              >
                                <Save size={14} />
                                Lưu dòng
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {d.countedAt ? (
                        <div className="text-[11px] text-slate-500 mt-2">
                          Kiểm kê bởi: {d.countedByName ?? d.countedBy ?? "—"} · {formatDateTime(d.countedAt)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <QrCameraScannerModal
        open={isDetailQrCameraOpen}
        title="Quét QR để tìm dòng thùng"
        onClose={() => setIsDetailQrCameraOpen(false)}
        onDetected={(value) => {
          setDetailQrInput(value);
          void handleFocusDetailByQr(value);
        }}
      />
    </div>
  );
}

