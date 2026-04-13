import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetConfirmedAllocationOrdersQuery,
  useGetPendingAllocationOrdersQuery,
  useGetPendingWarehouseConfirmOrdersQuery,
} from "../../order/api/order.api";
import type { OrderListItem } from "../../order/schemas/order.schema";
import { formatVietnamDate, formatVietnamTime } from "../../../shared/lib/vietnamTime";
import { isPaymentSettled } from "../../../shared/lib/paymentStatus";
import { orderStatusLabel, orderStatusTone } from "../../../shared/lib/orderStatusUi";
import SalesStaffPageShell from "../components/SalesStaffPageShell";

const STATUS_PILL =
  "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold";

function queueLabelTone(label: string): string {
  if (label.includes("Đã giữ")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (label.includes("Chờ giữ")) return "bg-sky-100 text-sky-800 border-sky-200";
  if (label.includes("kho")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

type UnpaidPosRow = {
  orderId: number;
  status: string;
  latestPaymentStatus?: string | null;
  createdAt: string;
  source: string;
  fulfillmentType?: string | null;
  paymentTiming?: string | null;
  queueLabels: string[];
};

export default function SalesPosUnpaidOrdersPage() {
  const navigate = useNavigate();
  const [orderIdQuery, setOrderIdQuery] = useState("");

  const params = { source: "POS", skip: 0, take: 200 };
  const { data: pendingAllocation = [], isLoading: isLoadingPendingAllocation } = useGetPendingAllocationOrdersQuery(params);
  const { data: pendingWarehouseConfirm = [], isLoading: isLoadingPendingWarehouseConfirm } =
    useGetPendingWarehouseConfirmOrdersQuery(params);
  const { data: allocationCompleted = [], isLoading: isLoadingAllocationCompleted } = useGetConfirmedAllocationOrdersQuery(params);

  const isLoading =
    isLoadingPendingAllocation ||
    isLoadingPendingWarehouseConfirm ||
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
          fulfillmentType: order.fulfillmentType ?? null,
          paymentTiming: order.paymentTiming ?? null,
          queueLabels: [queueLabel],
        });
        return;
      }
      existed.status = order.status || existed.status;
      existed.latestPaymentStatus = order.latestPaymentStatus ?? existed.latestPaymentStatus;
      existed.fulfillmentType = order.fulfillmentType ?? existed.fulfillmentType;
      existed.paymentTiming = order.paymentTiming ?? existed.paymentTiming;
      if (!existed.queueLabels.includes(queueLabel)) existed.queueLabels.push(queueLabel);
      if (new Date(order.createdAt).getTime() > new Date(existed.createdAt).getTime()) {
        existed.createdAt = order.createdAt;
      }
    };

    allocationCompleted.forEach((o) => upsert(o, "Đã giữ hàng"));
    pendingAllocation.forEach((o) => upsert(o, "Chờ giữ hàng"));
    pendingWarehouseConfirm.forEach((o) => upsert(o, "Chờ kho xác nhận"));

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
    orderIdQuery,
  ]);

  return (
    <SalesStaffPageShell>
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Đơn mua tại quầy chưa thanh toán</h1>
        <p className="mt-1 text-sm text-slate-600">
          Danh sách đặt tại quầy chưa hoàn tất thanh toán. Mở chi tiết đơn để tạo hoặc theo dõi thanh toán.
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
          <p className="text-sm text-slate-500">Đang tải danh sách đơn mua tại quầy chưa thanh toán...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Không có đơn mua tại quầy chưa thanh toán phù hợp bộ lọc.</p>
        ) : (
          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[920px] bg-white">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2">Mã đơn</th>
                  <th className="px-3 py-2">Tiến độ xử lý</th>
                  <th className="px-3 py-2">Trạng thái đơn</th>
                  <th className="px-3 py-2">Ngày tạo</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  return (
                    <tr key={row.orderId} className="border-t border-slate-200 text-sm text-slate-700">
                      <td className="px-3 py-2 font-semibold">#{row.orderId}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {row.queueLabels.map((label) => (
                            <span
                              key={label}
                              className={`${STATUS_PILL} ${queueLabelTone(label)}`}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`${STATUS_PILL} ${orderStatusTone(row.status)}`}>
                          {orderStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {formatVietnamDate(row.createdAt)} {formatVietnamTime(row.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/sales/orders/${row.orderId}`)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Xử lý đơn
                          </button>
                        </div>
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
    </SalesStaffPageShell>
  );
}

