import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetConfirmedAllocationOrdersQuery,
  useGetPendingAllocationOrdersQuery,
  useGetPendingCustomerDecisionOrdersQuery,
  useGetPendingWarehouseConfirmOrdersQuery,
} from "../../order/api/order.api";
import { useCreatePaymentMutation } from "../../payment/api/payment.api";
import { paymentMethodEnum } from "../../payment/schemas/payment.schema";
import type { OrderListItem } from "../../order/schemas/order.schema";
import { formatVietnamDate, formatVietnamTime } from "../../../shared/lib/vietnamTime";
import {
  isPaymentActive,
  isPaymentSettled,
  paymentStatusLabelVietnam,
} from "../../../shared/lib/paymentStatus";

type UnpaidPosRow = {
  orderId: number;
  status: string;
  latestPaymentStatus?: string | null;
  createdAt: string;
  source: string;
  queueLabels: string[];
};

function paymentStatusLabel(status?: string | null) {
  return paymentStatusLabelVietnam(status);
}

function orderStatusLabel(status: string) {
  if (status === "AwaitingAllocation") return "Chờ giữ hàng";
  if (status === "PendingWarehouseConfirm") return "Chờ kho xác nhận";
  if (status === "PartiallyAllocated") return "Giữ hàng một phần";
  if (status === "BackorderWaiting") return "Chờ backorder";
  if (status === "Confirmed") return "Đã xác nhận";
  if (status === "Shipping") return "Đang giao";
  if (status === "Delivered") return "Đã giao hàng";
  if (status === "FailedDelivery") return "Giao thất bại";
  if (status === "Returned") return "Hoàn hàng";
  if (status === "Completed") return "Hoàn thành";
  if (status === "Cancelled") return "Đã hủy";
  return status;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const e = err as {
    data?: { message?: string; error?: string; detail?: string };
    message?: string;
  };
  return e?.data?.message || e?.data?.error || e?.data?.detail || e?.message || fallback;
}

export default function SalesPosUnpaidOrdersPage() {
  const navigate = useNavigate();
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(null);
  const [createPayment] = useCreatePaymentMutation();

  const params = { source: "POS", skip: 0, take: 200 };
  const { data: pendingAllocation = [], isLoading: isLoadingPendingAllocation, refetch: refetchPendingAllocation } =
    useGetPendingAllocationOrdersQuery(params);
  const { data: pendingWarehouseConfirm = [], isLoading: isLoadingPendingWarehouseConfirm, refetch: refetchPendingWarehouseConfirm } =
    useGetPendingWarehouseConfirmOrdersQuery(params);
  const { data: pendingCustomerDecision = [], isLoading: isLoadingPendingCustomerDecision, refetch: refetchPendingCustomerDecision } =
    useGetPendingCustomerDecisionOrdersQuery(params);
  const { data: allocationCompleted = [], isLoading: isLoadingAllocationCompleted, refetch: refetchAllocationCompleted } =
    useGetConfirmedAllocationOrdersQuery(params);

  const isLoading =
    isLoadingPendingAllocation ||
    isLoadingPendingWarehouseConfirm ||
    isLoadingPendingCustomerDecision ||
    isLoadingAllocationCompleted;

  const rows = useMemo<UnpaidPosRow[]>(() => {
    const map = new Map<number, UnpaidPosRow>();

    const upsert = (order: OrderListItem, queueLabel: string) => {
      const existed = map.get(order.orderId);
      if (!existed) {
        map.set(order.orderId, {
          orderId: order.orderId,
          status: order.status,
          latestPaymentStatus: order.latestPaymentStatus,
          createdAt: order.createdAt,
          source: order.source,
          queueLabels: [queueLabel],
        });
        return;
      }
      existed.status = order.status || existed.status;
      existed.latestPaymentStatus = order.latestPaymentStatus ?? existed.latestPaymentStatus;
      if (!existed.queueLabels.includes(queueLabel)) existed.queueLabels.push(queueLabel);
      if (new Date(order.createdAt).getTime() > new Date(existed.createdAt).getTime()) {
        existed.createdAt = order.createdAt;
      }
    };

    allocationCompleted.forEach((o) => upsert(o, "Đã giữ hàng"));
    pendingAllocation.forEach((o) => upsert(o, "Chờ giữ hàng"));
    pendingWarehouseConfirm.forEach((o) => upsert(o, "Chờ kho xác nhận"));
    pendingCustomerDecision.forEach((o) => upsert(o, "Chờ chốt thiếu hàng"));

    const query = orderIdQuery.trim();
    return Array.from(map.values())
      .filter((row) => row.source === "POS")
      .filter((row) => !isPaymentSettled(row.latestPaymentStatus))
      .filter((row) => (query ? String(row.orderId).includes(query) : true))
      .sort((a, b) => b.orderId - a.orderId);
  }, [
    allocationCompleted,
    pendingAllocation,
    pendingWarehouseConfirm,
    pendingCustomerDecision,
    orderIdQuery,
  ]);

  const onCreatePayment = async (orderId: number, paymentMethod: number) => {
    setSubmittingOrderId(orderId);
    const t = toast.loading(`Đang tạo thanh toán cho đơn #${orderId}...`);
    try {
      const res = await createPayment({ orderId, paymentMethod }).unwrap();
      toast.success(`Đã tạo thanh toán #${res.id} cho đơn #${orderId}.`, { id: t });
      if (res.checkoutUrl) {
        window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
      }
      await Promise.all([
        refetchAllocationCompleted(),
        refetchPendingAllocation(),
        refetchPendingWarehouseConfirm(),
        refetchPendingCustomerDecision(),
      ]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tạo thanh toán cho đơn này."), { id: t });
    } finally {
      setSubmittingOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Đơn POS chưa thanh toán</h1>
        <p className="mt-1 text-sm text-slate-600">
          Staff vào đây để tạo thanh toán cho đơn mua tại quầy chưa có trạng thái Paid.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="order-id-query" className="text-sm font-semibold text-slate-800">
          Lọc theo mã đơn
        </label>
        <input
          id="order-id-query"
          type="text"
          value={orderIdQuery}
          onChange={(e) => setOrderIdQuery(e.target.value)}
          placeholder="Nhập mã đơn, ví dụ: 73"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-500">Đang tải danh sách đơn POS chưa thanh toán...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Không có đơn POS chưa thanh toán phù hợp bộ lọc.</p>
        ) : (
          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[1080px] bg-white">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2">Mã đơn</th>
                  <th className="px-3 py-2">Hàng đợi</th>
                  <th className="px-3 py-2">Trạng thái đơn</th>
                  <th className="px-3 py-2">Trạng thái thanh toán</th>
                  <th className="px-3 py-2">Ngày tạo</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const paymentStatus = row.latestPaymentStatus;
                  const canCreatePayment =
                    !isPaymentSettled(paymentStatus) &&
                    !isPaymentActive(paymentStatus);
                  const isSubmitting = submittingOrderId === row.orderId;

                  return (
                    <tr key={row.orderId} className="border-t border-slate-200 text-sm text-slate-700">
                      <td className="px-3 py-2 font-semibold">#{row.orderId}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {row.queueLabels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">{orderStatusLabel(row.status)}</td>
                      <td className="px-3 py-2">{paymentStatusLabel(row.latestPaymentStatus)}</td>
                      <td className="px-3 py-2">
                        {formatVietnamDate(row.createdAt)} {formatVietnamTime(row.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onCreatePayment(row.orderId, paymentMethodEnum.COD)}
                            disabled={!canCreatePayment || isSubmitting}
                            className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Tạo COD
                          </button>
                          <button
                            type="button"
                            onClick={() => onCreatePayment(row.orderId, paymentMethodEnum.BANKING)}
                            disabled={!canCreatePayment || isSubmitting}
                            className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Tạo chuyển khoản
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/sales/orders/${row.orderId}`)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Xử lý đơn
                          </button>
                        </div>
                        {!canCreatePayment && (
                          <p className="mt-1 text-right text-[11px] text-amber-700">
                            Đơn đã có payment đang chờ hoặc đã thanh toán.
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

