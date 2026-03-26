import { useEffect, useMemo, useState } from "react";
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

export default function CustomerComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdFromQuery = Number(searchParams.get("orderId") ?? "0");
  const hasOrderId = Number.isInteger(orderIdFromQuery) && orderIdFromQuery > 0;

  const { data: rows = [], isLoading, refetch } = useGetMyComplaintsQuery();
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
    isFetching: isFetchingBoxes,
    refetch: refetchBoxes,
  } = useGetOrderBoxesForComplaintQuery(orderIdFromQuery, { skip: !hasOrderId });

  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [type, setType] = useState<ComplaintType>("Damaged");
  const [damagedQuantity, setDamagedQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

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

  const selectedBox = useMemo(() => {
    if (!boxes || boxes.length === 0) return null;
    return boxes.find((b) => b.boxId === selectedBoxId) ?? null;
  }, [boxes, selectedBoxId]);

  const onCreate = async () => {
    if (!hasOrderId) {
      toast.error("Chưa xác định được đơn hàng.");
      return;
    }
    if (selectedBoxId == null) {
      toast.error("Chưa chọn box để khiếu nại.");
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-bold text-slate-900">Khiếu nại đơn hàng</h1>
        <p className="mt-1 text-sm text-slate-600">
          Chỉ tạo được khi đơn đang giao hoặc đã hoàn thành (Shipping/Completed).
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Tạo khiếu nại mới</h2>
        {!hasOrderId ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Chọn 1 đơn có thể khiếu nại. (Shipping/Completed)
            </div>

            {isLoadingEligibleOrders ? (
              <p className="text-sm text-slate-500">Đang tải danh sách...</p>
            ) : (
              <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="py-2 px-3 text-left">Đơn hàng</th>
                      <th className="py-2 px-3 text-left">Trạng thái</th>
                      <th className="py-2 px-3 text-left">Số box</th>
                      <th className="py-2 px-3 text-left">Tạo lúc</th>
                      <th className="py-2 px-3 w-[160px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 px-3 text-center text-slate-500">
                          Không có đơn nào đủ điều kiện để khiếu nại.
                        </td>
                      </tr>
                    ) : (
                      eligibleOrders.map((o) => (
                        <tr key={o.orderId} className="border-t border-slate-100">
                          <td className="py-2 px-3 font-semibold">#{o.orderId}</td>
                          <td className="py-2 px-3">{o.status}</td>
                          <td className="py-2 px-3">{o.boxCount}</td>
                          <td className="py-2 px-3">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                searchParams.set("orderId", String(o.orderId));
                                setSearchParams(searchParams);
                                setEligiblePage(1);
                              }}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                            >
                              Khiếu nại đơn này
                            </button>
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
                disabled={eligiblePage <= 1}
                onClick={() => setEligiblePage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm text-slate-600">Trang {eligiblePage}</span>
              <button
                type="button"
                disabled={eligibleOrders.length < eligiblePageSize}
                onClick={() => setEligiblePage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Sau
              </button>
              <button
                type="button"
                onClick={async () => {
                  await refetchEligibleOrders();
                  toast.success("Đã làm mới danh sách đơn đủ điều kiện.");
                }}
                disabled={isFetchingEligibleOrders}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Làm mới
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
              Đang tạo khiếu nại cho đơn <span className="font-bold">Đơn hàng {orderIdFromQuery}</span>
            </div>

            {isLoadingBoxes ? (
              <p className="text-sm text-slate-500">Đang tải danh sách box...</p>
            ) : boxes.length === 0 ? (
              <p className="text-sm text-slate-500">Không có box hợp lệ để khiếu nại cho đơn này.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 items-end">
                <div className="md:col-span-2 lg:col-span-2">
                  {boxes.length === 1 ? (
                    <div className="rounded-lg border border-indigo-200 bg-white p-3">
                      <p className="text-sm font-semibold text-indigo-900">{boxes[0].boxCode}</p>
                      <p className="text-xs text-indigo-700">
                        Tối đa khiếu nại: {boxes[0].complaintableQuantity}. {boxes[0].hasPendingComplaint ? "(Đã có khiếu nại chờ xử lý)" : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Chọn box</label>
                      <select
                        value={selectedBoxId ?? ""}
                        onChange={(e) => setSelectedBoxId(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        {boxes.map((b) => (
                          <option key={b.boxId} value={b.boxId} disabled={b.hasPendingComplaint}>
                            {b.boxCode} (max: {b.complaintableQuantity}){b.hasPendingComplaint ? " - đang chờ xử lý" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    value={damagedQuantity}
                    onChange={(e) => setDamagedQuantity(e.target.value)}
                    placeholder={selectedBox ? `Số lượng (max ${selectedBox.complaintableQuantity})` : "Số lượng khiếu nại (kg)"}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ComplaintType)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="Damaged">Damaged</option>
                    <option value="MissingQuantity">MissingQuantity</option>
                    <option value="WrongItem">WrongItem</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2 lg:col-span-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Ảnh minh chứng (tùy chọn)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    {evidenceFile && (
                      <p className="text-xs text-slate-500">
                        Đã chọn: <span className="font-medium text-slate-700">{evidenceFile.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-3 lg:col-span-3">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-3 lg:col-span-3">
                  <button
                    type="button"
                    onClick={onCreate}
                    disabled={isCreating || isUploadingEvidence || !selectedBoxId || !!selectedBox?.hasPendingComplaint}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isUploadingEvidence ? "Đang tải ảnh..." : isCreating ? "Đang tạo..." : "Tạo khiếu nại"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  searchParams.delete("orderId");
                  setSearchParams(searchParams);
                  setSelectedBoxId(null);
                  setDamagedQuantity("");
                  setDescription("");
                  setEvidenceFile(null);
                }}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                Chọn đơn khác
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Khiếu nại của tôi</h2>
          <button onClick={() => refetch()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Làm mới</button>
        </div>
        {isLoading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Bạn chưa có khiếu nại nào.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="py-2 px-3 text-left">ID</th>
                  <th className="py-2 px-3 text-left">Đơn/Box</th>
                  <th className="py-2 px-3 text-left">Loại</th>
                  <th className="py-2 px-3 text-left">Trạng thái</th>
                  <th className="py-2 px-3 text-left">Tạo lúc</th>
                  <th className="py-2 px-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 px-3 font-semibold">#{r.id}</td>
                    <td className="py-2 px-3">Đơn hàng {r.orderId} / {r.boxCode ?? `Box#${r.boxId}`}</td>
                    <td className="py-2 px-3">{typeLabel(r.type)}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone(r.status)}`}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td className="py-2 px-3">{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => onCancel(r.id)}
                        disabled={r.status !== "Pending" || isCancelling}
                        className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
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
      </div>
    </div>
  );
}
