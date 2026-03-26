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

function typeLabel(type: string) {
  if (type === "Damaged") return "Hang hu hong";
  if (type === "MissingQuantity") return "Thieu so luong";
  if (type === "WrongItem") return "Sai mat hang";
  if (type === "Other") return "Khac";
  return type;
}

function statusLabel(status: string) {
  if (status === "Pending") return "Cho xu ly";
  if (status === "Verified") return "Da chap nhan";
  if (status === "Rejected") return "Tu choi";
  if (status === "Closed") return "Da dong";
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
  const [customerEvidenceUrl, setCustomerEvidenceUrl] = useState("");

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
      toast.error("Chua xac dinh duoc OrderId.");
      return;
    }
    if (selectedBoxId == null) {
      toast.error("Chua chon box de khiếu nại.");
      return;
    }

    const qty = Number(damagedQuantity);
    if (!(qty > 0)) {
      toast.error("So luong khiếu nại khong hop le.");
      return;
    }
    if (selectedBox?.hasPendingComplaint) {
      toast.error("Box nay da co khiếu nại dang cho xu ly.");
      return;
    }
    if (selectedBox && qty > Number(selectedBox.complaintableQuantity)) {
      toast.error(`Vuot gioi han. Toi da co the khieu nai: ${selectedBox.complaintableQuantity}.`);
      return;
    }

    const t = toast.loading("Dang tao khiếu nại...");
    try {
      const res = await createComplaint({
        orderId: orderIdFromQuery,
        boxId: selectedBoxId,
        type,
        damagedQuantity: qty,
        description: description.trim() || undefined,
        customerEvidenceUrl: customerEvidenceUrl.trim() || undefined,
      }).unwrap();
      toast.success(`Da tao khiếu nại #${res.id}.`, { id: t });
      setDescription("");
      setCustomerEvidenceUrl("");
      setDamagedQuantity("");
      await refetch();
      // Update box pending status
      await refetchBoxes();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tao khiếu nại that bai."), { id: t });
    }
  };

  const onCancel = async (complaintId: number) => {
    const t = toast.loading(`Dang huy khiếu nại #${complaintId}...`);
    try {
      await cancelComplaint(complaintId).unwrap();
      toast.success(`Da huy khiếu nại #${complaintId}.`, { id: t });
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Huy khiếu nại that bai."), { id: t });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-bold text-slate-900">Khiếu nại don hang</h1>
        <p className="mt-1 text-sm text-slate-600">
          Chi tao duoc khi don dang giao hoac da hoan thanh (Shipping/Completed).
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Tao khiếu nại moi</h2>
        {!hasOrderId ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Chon 1 don co the khiếu nại. (Shipping/Completed)
            </div>

            {isLoadingEligibleOrders ? (
              <p className="text-sm text-slate-500">Dang tai danh sach...</p>
            ) : (
              <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="py-2 px-3 text-left">OrderId</th>
                      <th className="py-2 px-3 text-left">Trang thai</th>
                      <th className="py-2 px-3 text-left">So box</th>
                      <th className="py-2 px-3 text-left">Tao luc</th>
                      <th className="py-2 px-3 w-[160px]">Thao tac</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 px-3 text-center text-slate-500">
                          Khong co don nao duoc phe duyet de khiếu nại.
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
                              Khieu nai don nay
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
                Truoc
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
                  toast.success("Da lam moi danh sach don eligible.");
                }}
                disabled={isFetchingEligibleOrders}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Lam moi
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
              Dang tao khiếu nại cho đơn <span className="font-bold">#{orderIdFromQuery}</span>
            </div>

            {isLoadingBoxes ? (
              <p className="text-sm text-slate-500">Dang tai danh sach box...</p>
            ) : boxes.length === 0 ? (
              <p className="text-sm text-slate-500">Khong co box hop le de khiếu nại cho don nay.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 items-end">
                <div className="md:col-span-2 lg:col-span-2">
                  {boxes.length === 1 ? (
                    <div className="rounded-lg border border-indigo-200 bg-white p-3">
                      <p className="text-sm font-semibold text-indigo-900">{boxes[0].boxCode}</p>
                      <p className="text-xs text-indigo-700">
                        Tối đa khiếu nại: {boxes[0].complaintableQuantity}. {boxes[0].hasPendingComplaint ? "(Da co complaint pending)" : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Chon box</label>
                      <select
                        value={selectedBoxId ?? ""}
                        onChange={(e) => setSelectedBoxId(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        {boxes.map((b) => (
                          <option key={b.boxId} value={b.boxId} disabled={b.hasPendingComplaint}>
                            {b.boxCode} (max: {b.complaintableQuantity}){b.hasPendingComplaint ? " - pending" : ""}
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
                    placeholder={selectedBox ? `So luong (max ${selectedBox.complaintableQuantity})` : "So luong khiếu nại (kg)"}
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
                  <input
                    value={customerEvidenceUrl}
                    onChange={(e) => setCustomerEvidenceUrl(e.target.value)}
                    placeholder="Evidence URL (tuy chon)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-3 lg:col-span-3">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mo ta"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-3 lg:col-span-3">
                  <button
                    type="button"
                    onClick={onCreate}
                    disabled={isCreating || !selectedBoxId || !!selectedBox?.hasPendingComplaint}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isCreating ? "Dang tao..." : "Tao khiếu nại"}
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
                  setCustomerEvidenceUrl("");
                }}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                Chon don khac
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Khiếu nại cua toi</h2>
          <button onClick={() => refetch()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Lam moi</button>
        </div>
        {isLoading ? (
          <p className="text-sm text-slate-500">Dang tai...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Ban chua co khiếu nại nao.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="py-2 px-3 text-left">ID</th>
                  <th className="py-2 px-3 text-left">Don/Box</th>
                  <th className="py-2 px-3 text-left">Loai</th>
                  <th className="py-2 px-3 text-left">Trang thai</th>
                  <th className="py-2 px-3 text-left">Tao luc</th>
                  <th className="py-2 px-3 text-left">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 px-3 font-semibold">#{r.id}</td>
                    <td className="py-2 px-3">#{r.orderId} / {r.boxCode ?? `Box#${r.boxId}`}</td>
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
                        Huy
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
