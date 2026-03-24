import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useConfirmAllocationAsStaffMutation,
  useGetAllocationProposalsByOrderIdQuery,
} from "../../order/api/order.api";
import type { AllocationConfirmResponse } from "../../order/schemas/order.schema";

function vnd(n: number) {
  return n.toLocaleString("vi-VN");
}

function allocationStatusLabel(status: string) {
  if (status === "Proposed") return "Đã đề xuất";
  if (status === "Confirmed") return "Đã xác nhận";
  if (status === "Cancelled") return "Đã hủy";
  if (status === "PartiallyAllocated") return "Giữ hàng một phần";
  if (status === "PendingWarehouseConfirm") return "Chờ kho xác nhận";
  return status;
}

export default function WarehouseAllocationProposalPage() {
  const { orderId } = useParams();
  const id = Number(orderId);
  const valid = Number.isInteger(id) && id > 0;
  const { data, isLoading, isError, error, refetch } = useGetAllocationProposalsByOrderIdQuery(id, {
    skip: !valid,
  });
  const proposalErrorMessage =
    ((error as { data?: { error?: string; message?: string } })?.data?.error) ||
    ((error as { data?: { error?: string; message?: string } })?.data?.message) ||
    "Không tải được chi tiết phân bổ đề xuất.";

  const [confirmAllocation, { isLoading: isConfirming }] =
    useConfirmAllocationAsStaffMutation();
  const [confirmResultMessage, setConfirmResultMessage] = useState<string>("");
  const [confirmResult, setConfirmResult] = useState<AllocationConfirmResponse | null>(null);

  const shortageTone = useMemo(() => {
    if (!data) return "text-slate-700";
    return data.totalShortageBoxes > 0 ? "text-rose-700" : "text-emerald-700";
  }, [data]);

  const onConfirmAllocation = async () => {
    if (!valid) return;
    const t = toast.loading(`Đang xác nhận phân bổ cho đơn #${id}...`);
    setConfirmResultMessage("");
    setConfirmResult(null);
    try {
      const result = await confirmAllocation(id).unwrap();
      const message =
        result.message ||
        (result.status === "PartiallyAllocated"
          ? "Đơn thiếu hàng sau xác nhận kho, cần khách quyết định."
          : "Kho xác nhận phân bổ thành công.");
      toast.success(message, { id: t });
      setConfirmResultMessage(message);
      setConfirmResult(result);
    } catch {
      toast.error("Kho xác nhận phân bổ thất bại.", { id: t });
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to="/warehouse/orders"
        className="inline-flex text-sm text-slate-600 hover:text-slate-900"
      >
        ← Quay lại hàng đợi kho
      </Link>

      {!valid ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Mã đơn hàng không hợp lệ.
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Đang tải đề xuất FEFO...
        </div>
      ) : isError || !data ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {proposalErrorMessage}
          <p className="mt-1 text-xs text-rose-700">
            Đơn có thể đã đổi trạng thái. Hãy quay lại hàng đợi kho và tải lại danh sách.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-2 underline"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                Đề xuất phân bổ FEFO - Đơn #{data.orderId}
              </h1>
              <span className="text-sm font-semibold text-slate-700">
                Tổng đề xuất: {vnd(data.totalProposedBoxes)} / {vnd(data.totalRequestedBoxes)} thùng
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Yêu cầu</p>
                <p className="text-2xl font-bold text-slate-900">{data.totalRequestedBoxes}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-700">Đề xuất</p>
                <p className="text-2xl font-bold text-blue-700">{data.totalProposedBoxes}</p>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs text-rose-700">Thiếu</p>
                <p className="text-2xl font-bold text-rose-700">{data.totalShortageBoxes}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Đủ hàng?</p>
                <p className={`text-2xl font-bold ${shortageTone}`}>
                  {data.isFullyProposed ? "Đủ" : "Chưa đủ"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Chi tiết sản phẩm</h2>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 text-left">Sản phẩm</th>
                    <th className="py-2 pr-3 text-right">Yêu cầu</th>
                    <th className="py-2 pr-3 text-right">Đề xuất</th>
                    <th className="py-2 pr-3 text-right">Thiếu</th>
                    <th className="py-2 pr-3 text-right">Trọng lượng</th>
                    <th className="py-2 pr-3 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.details.map((d) => (
                    <tr key={d.orderDetailId} className="border-b border-slate-100">
                      <td className="py-2 pr-3">
                        <p className="font-medium text-slate-900">{d.productName}</p>
                        <p className="text-xs text-slate-500">
                          Hạng {d.grade} · {d.isPartial ? "Mua lẻ" : "Nguyên thùng"}
                        </p>
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold">{d.requestedQuantity}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-blue-700">{d.proposedQuantity}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-rose-700">{d.shortageQuantity}</td>
                      <td className="py-2 pr-3 text-right">{d.boxWeight}kg</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${d.isSufficient ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {d.isSufficient ? "Đủ hàng" : "Thiếu một phần"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Danh sách box đề xuất</h2>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 text-left">Mã phân bổ</th>
                    <th className="py-2 pr-3 text-left">Box code</th>
                    <th className="py-2 pr-3 text-left">HSD</th>
                    <th className="py-2 pr-3 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.proposals.map((p) => (
                    <tr key={p.allocationId} className="border-b border-slate-100">
                      <td className="py-2 pr-3">#{p.allocationId}</td>
                      <td className="py-2 pr-3 font-semibold text-slate-900">{p.boxCode}</td>
                      <td className="py-2 pr-3">
                        {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                          {allocationStatusLabel(p.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={onConfirmAllocation}
              disabled={isConfirming}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isConfirming ? "Đang xác nhận..." : "Xác nhận phân bổ"}
            </button>
            {!!confirmResultMessage && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {confirmResultMessage}
              </p>
            )}
            {confirmResult && (
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Đã xuất</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {confirmResult.fulfilledQuantity ?? 0} thùng
                    </p>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="text-xs text-rose-700">Còn thiếu</p>
                    <p className="text-2xl font-bold text-rose-700">
                      {confirmResult.shortageQuantity ?? 0} thùng
                    </p>
                  </div>
                </div>
                {confirmResult.customerActionRequired && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-800">Cần khách hàng quyết định</p>
                    <p className="mt-1 text-xs text-amber-700">
                      Đơn đang ở trạng thái {allocationStatusLabel(confirmResult.status)}.
                      Vui lòng để khách chọn chờ backorder hoặc hủy phần thiếu.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

