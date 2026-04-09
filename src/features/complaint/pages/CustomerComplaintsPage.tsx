import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import {
  useCancelComplaintMutation,
  useCreateComplaintMutation,
  useGetEligibleOrdersForComplaintQuery,
  useGetMyComplaintsQuery,
  useGetOrderBoxesForComplaintQuery,
} from "../api/complaint.api";
import { type ComplaintType } from "../schemas/complaint.schema";
import { uploadFileToCloudinary } from "../../../shared/lib/cloudinaryUpload";

function typeLabel(type: string) {
  if (type === "Damaged") return "Hàng hư hỏng";
  if (type === "MissingQuantity") return "Thiếu số lượng";
  if (type === "WrongItem") return "Sai mặt hàng";
  if (type === "Other") return "Khác";
  return type;
}

function statusLabel(status: string) {
  if (status === "Pending") return "Chờ xử lý";
  if (status === "Verified") return "Đã chấp nhận";
  if (status === "Rejected") return "Từ chối";
  if (status === "Closed") return "Đã đóng";
  return status;
}

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

const field =
  "w-full min-h-[3rem] rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-normal text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";
const labelCls = "mb-2 block text-sm font-medium text-slate-600";

export default function CustomerComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdFromQuery = Number(searchParams.get("orderId") ?? "0");
  const hasOrderId = Number.isInteger(orderIdFromQuery) && orderIdFromQuery > 0;

  const { data: rows = [], isLoading, refetch } = useGetMyComplaintsQuery();

  const complaintRowsForView = useMemo(() => {
    if (!hasOrderId) return rows;
    return rows.filter((r) => Number(r.orderId) === orderIdFromQuery);
  }, [rows, hasOrderId, orderIdFromQuery]);

  const hasOtherComplaints =
    hasOrderId && rows.length > 0 && complaintRowsForView.length < rows.length;
  const [createComplaint, { isLoading: isCreating }] = useCreateComplaintMutation();
  const [cancelComplaint, { isLoading: isCancelling }] = useCancelComplaintMutation();

  // Eligible orders (only shown when user doesn't pass orderId in URL)
  const [eligiblePage, setEligiblePage] = useState(1);
  const eligiblePageSize = 20;
  const eligibleSkip = (eligiblePage - 1) * eligiblePageSize;
  const {
    data: eligibleOrders = [],
    isLoading: isLoadingEligibleOrders,
    isFetching: isFetchingEligibleOrders,
    refetch: refetchEligibleOrders,
  } = useGetEligibleOrdersForComplaintQuery(
    { skip: eligibleSkip, take: eligiblePageSize },
    { skip: hasOrderId },
  );

  const {
    data: boxes = [],
    isLoading: isLoadingBoxes,
    refetch: refetchBoxes,
  } = useGetOrderBoxesForComplaintQuery(orderIdFromQuery, { skip: !hasOrderId });

  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [type, setType] = useState<ComplaintType>("Damaged");
  const [damagedQuantity, setDamagedQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const evidenceFileInputRef = useRef<HTMLInputElement>(null);

  const evidencePreviewUrl = useMemo(
    () => (evidenceFile ? URL.createObjectURL(evidenceFile) : null),
    [evidenceFile],
  );

  useEffect(() => {
    if (!evidencePreviewUrl) return;
    return () => URL.revokeObjectURL(evidencePreviewUrl);
  }, [evidencePreviewUrl]);

  useEffect(() => {
    // Reset box when switching to/from a specific order
    if (!hasOrderId) {
      setSelectedBoxId(null);
      return;
    }

    if (!boxes || boxes.length === 0) {
      setSelectedBoxId(null);
      return;
    }

    const stillValid = selectedBoxId != null && boxes.some((b) => b.boxId === selectedBoxId);
    if (stillValid) return;

    // Prefer a box that has no pending complaint
    const first = boxes.find((b) => !b.hasPendingComplaint)?.boxId ?? boxes[0].boxId;
    setSelectedBoxId(first);
  }, [boxes, hasOrderId, selectedBoxId]);

  useEffect(() => {
    // Chỉ cho phép customer điền mô tả khi chọn "Khác".
    if (type !== "Other" && description) setDescription("");
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBox = useMemo(() => {
    if (!boxes || boxes.length === 0) return null;
    return boxes.find((b) => b.boxId === selectedBoxId) ?? null;
  }, [boxes, selectedBoxId]);

  const onCreate = async () => {
    if (!hasOrderId) {
      toast.error("Chưa xác định đơn.");
      return;
    }
    if (selectedBoxId == null) {
      toast.error("Chọn thùng.");
      return;
    }
    if (type === "Other" && !description.trim()) {
      toast.error("Nhập mô tả.");
      return;
    }

    const qty = Number(damagedQuantity);
    if (!(qty > 0)) {
      toast.error("Số lượng khiếu nại không hợp lệ.");
      return;
    }
    if (selectedBox?.hasPendingComplaint) {
      toast.error("Box này đã có khiếu nại đang chờ xử lý.");
      return;
    }
    if (selectedBox && qty > Number(selectedBox.complaintableQuantity)) {
      toast.error(`Vượt giới hạn. Tối đa có thể khiếu nại: ${selectedBox.complaintableQuantity}.`);
      return;
    }

    let uploadedEvidenceUrl: string | undefined;
    if (evidenceFile) {
      const uploadToast = toast.loading("Đang tải ảnh minh chứng...");
      setIsUploadingEvidence(true);
      try {
        uploadedEvidenceUrl = await uploadFileToCloudinary(evidenceFile, { folder: "complaints" });
        toast.success("Tải ảnh thành công.", { id: uploadToast });
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Tải ảnh thất bại."), { id: uploadToast });
        return;
      } finally {
        setIsUploadingEvidence(false);
      }
    }

    const t = toast.loading("Đang tạo khiếu nại...");
    try {
      const res = await createComplaint({
        orderId: orderIdFromQuery,
        boxId: selectedBoxId,
        type,
        damagedQuantity: qty,
        description: description.trim() || undefined,
        customerEvidenceUrl: uploadedEvidenceUrl,
      }).unwrap();
      toast.success(`Đã tạo khiếu nại #${res.id}.`, { id: t });
      setDescription("");
      setEvidenceFile(null);
      evidenceFileInputRef.current && (evidenceFileInputRef.current.value = "");
      setDamagedQuantity("");
      await refetch();
      // Update box pending status
      await refetchBoxes();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tạo khiếu nại thất bại."), { id: t });
    }
  };

  const onCancel = async (complaintId: number) => {
    const t = toast.loading(`Đang hủy khiếu nại #${complaintId}...`);
    try {
      await cancelComplaint(complaintId).unwrap();
      toast.success(`Đã hủy khiếu nại #${complaintId}.`, { id: t });
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Hủy khiếu nại thất bại."), { id: t });
    }
  };

  const complaintsSectionEl = (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Đã gửi</h2>
          {hasOrderId && (
            <p className="mt-1 text-xs text-slate-500">
              Đang lọc theo đơn <span className="font-semibold tabular-nums text-slate-700">#{orderIdFromQuery}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasOtherComplaints && (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("orderId");
                setSearchParams(next);
              }}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-100"
            >
              Xem mọi đơn
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : complaintRowsForView.length === 0 ? (
        <p className="text-sm text-slate-500">
          {hasOrderId ? "Chưa có khiếu nại cho đơn này." : "Bạn chưa gửi khiếu nại nào."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Đơn · Thùng</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Loại</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ảnh</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">TT</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaintRowsForView.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">#{r.id}</td>
                  <td className="px-4 py-3 text-slate-600">
                    #{r.orderId} · <span className="font-mono text-slate-800">{r.boxCode ?? r.boxId}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{typeLabel(r.type)}</td>
                  <td className="px-4 py-3">
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
                          alt={`Minh chứng #${r.id}`}
                          className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                          loading="lazy"
                        />
                        <span className="text-xs font-semibold text-indigo-700 hover:text-indigo-800">Mở</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onCancel(r.id)}
                      disabled={r.status !== "Pending" || isCancelling}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Hủy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 border-b border-slate-200/80 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Khiếu nại</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {hasOrderId
              ? `Đang xử lý đơn #${orderIdFromQuery}.`
              : "Đơn đang giao hoặc đã hoàn thành."}
          </p>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-sm font-semibold text-slate-900">Gửi mới</h2>

          {!hasOrderId ? (
            <div className="space-y-4">
              {isLoadingEligibleOrders ? (
                <p className="text-sm text-slate-500">Đang tải…</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90">
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Đơn</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">TT</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Thùng</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eligibleOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                            Không có đơn hợp lệ.
                          </td>
                        </tr>
                      ) : (
                        eligibleOrders.map((o) => (
                          <tr key={o.orderId} className="transition-colors hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-semibold text-slate-900">#{o.orderId}</td>
                            <td className="px-4 py-3 text-slate-600">{o.status}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-600">{o.boxCount}</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  searchParams.set("orderId", String(o.orderId));
                                  setSearchParams(searchParams);
                                  setEligiblePage(1);
                                }}
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                              >
                                Chọn
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={eligiblePage <= 1}
                  onClick={() => setEligiblePage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                >
                  ←
                </button>
                <span className="text-xs tabular-nums text-slate-500">{eligiblePage}</span>
                <button
                  type="button"
                  disabled={eligibleOrders.length < eligiblePageSize}
                  onClick={() => setEligiblePage((p) => p + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await refetchEligibleOrders();
                    toast.success("Đã cập nhật.");
                  }}
                  disabled={isFetchingEligibleOrders}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Làm mới
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-sm">
                <p className="text-sm font-medium">
                  Đơn <span className="font-bold tabular-nums">#{orderIdFromQuery}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    searchParams.delete("orderId");
                    setSearchParams(searchParams);
                    setSelectedBoxId(null);
                    setDamagedQuantity("");
                    setDescription("");
                    setEvidenceFile(null);
                    if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = "";
                  }}
                  className="text-xs font-semibold text-white/90 underline-offset-2 hover:underline"
                >
                  Đổi đơn
                </button>
              </div>

              {isLoadingBoxes ? (
                <p className="text-sm text-slate-500">Đang tải…</p>
              ) : boxes.length === 0 ? (
                <p className="text-sm text-slate-500">Không có thùng hợp lệ.</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    {boxes.length === 1 ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-5 py-4">
                        <p className="text-sm font-medium text-slate-600">Thùng</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-slate-900">{boxes[0].boxCode}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Tối đa <span className="font-semibold text-slate-800">{boxes[0].complaintableQuantity}</span> kg
                          {boxes[0].hasPendingComplaint ? " · Đang chờ" : ""}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className={labelCls}>Thùng</label>
                        <select
                          value={selectedBoxId ?? ""}
                          onChange={(e) => setSelectedBoxId(Number(e.target.value))}
                          className={field}
                        >
                          {boxes.map((b) => (
                            <option key={b.boxId} value={b.boxId} disabled={b.hasPendingComplaint}>
                              {b.boxCode} · max {b.complaintableQuantity}
                              {b.hasPendingComplaint ? " · chờ" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Số lượng (kg)</label>
                      <input
                        inputMode="decimal"
                        value={damagedQuantity}
                        onChange={(e) => setDamagedQuantity(e.target.value)}
                        placeholder={selectedBox ? `Tối đa ${selectedBox.complaintableQuantity}` : "Nhập số kg"}
                        className={field}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Loại khiếu nại</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as ComplaintType)}
                        className={field}
                      >
                        <option value="Damaged">{typeLabel("Damaged")}</option>
                        <option value="MissingQuantity">{typeLabel("MissingQuantity")}</option>
                        <option value="WrongItem">{typeLabel("WrongItem")}</option>
                        <option value="Other">{typeLabel("Other")}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Ảnh minh chứng (tùy chọn)</label>
                    <input
                      ref={evidenceFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                      className={`${field} py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-800`}
                    />
                    {evidenceFile && (
                      <div className="mt-4 space-y-3">
                        <p className="truncate text-sm text-slate-600">{evidenceFile.name}</p>
                        {evidencePreviewUrl && (
                          <div className="relative inline-block max-w-full">
                            <img
                              src={evidencePreviewUrl}
                              alt="Xem trước ảnh minh chứng"
                              className="max-h-72 max-w-full rounded-xl border border-slate-200 bg-slate-50 object-contain shadow-sm"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEvidenceFile(null);
                            if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = "";
                          }}
                          className="text-sm font-semibold text-rose-700 underline-offset-2 hover:text-rose-800 hover:underline"
                        >
                          Gỡ ảnh
                        </button>
                      </div>
                    )}
                  </div>

                  {type === "Other" && (
                    <div>
                      <label className={labelCls}>Mô tả</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Mô tả ngắn gọn…"
                        className={`${field} min-h-[140px] resize-y py-3`}
                        rows={5}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onClick={onCreate}
                      disabled={
                        isCreating || isUploadingEvidence || !selectedBoxId || !!selectedBox?.hasPendingComplaint
                      }
                      className="min-h-[3rem] min-w-[8rem] rounded-xl bg-slate-900 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUploadingEvidence ? "Đang tải…" : isCreating ? "Đang gửi…" : "Gửi"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {complaintsSectionEl}
      </div>
    </div>
  );
}
