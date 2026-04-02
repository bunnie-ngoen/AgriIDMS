import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useCancelOrderMutation,
  useCancelShortageMutation,
  useConfirmDeliveredAsStaffMutation,
  useConfirmFailedDeliveryAsStaffMutation,
  useConfirmOrderMutation,
  useConfirmReturnedAsStaffMutation,
  useGetMyOrderByIdQuery,
  useWaitBackorderMutation,
} from "../../order/api/order.api";
import {
  useCancelPaymentMutation,
  useCreatePaymentMutation,
  useGetLatestPaymentByOrderQuery,
} from "../../payment/api/payment.api";
import { paymentMethodEnum } from "../../payment/schemas/payment.schema";
import { formatVietnamDate, formatVietnamTime } from "../../../shared/lib/vietnamTime";
import {
  isPaymentActive,
  isPaymentSettled,
  paymentStatusLabelVietnam,
} from "../../../shared/lib/paymentStatus";

function vnd(n: number) {
  return n.toLocaleString("vi-VN");
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const e = err as {
    data?: { message?: string; error?: string; detail?: string };
    message?: string;
  };
  return e?.data?.message || e?.data?.error || e?.data?.detail || e?.message || fallback;
}

function orderStatusLabel(status: string) {
  if (status === "PendingSaleConfirmation") return "Chờ xác nhận bán";
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

function paymentStatusLabel(status?: string | null) {
  return paymentStatusLabelVietnam(status);
}

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const valid = Number.isInteger(orderId) && orderId > 0;

  const { data: order, isLoading, isError, refetch } = useGetMyOrderByIdQuery(orderId, { skip: !valid });
  const { data: latestPayment, refetch: refetchPayment } = useGetLatestPaymentByOrderQuery(orderId, { skip: !valid });

  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();
  const [cancelPayment, { isLoading: isCancellingPayment }] = useCancelPaymentMutation();
  const [confirmOrder, { isLoading: isConfirmingOrder }] = useConfirmOrderMutation();
  const [waitBackorder, { isLoading: isWaitingBackorder }] = useWaitBackorderMutation();
  const [cancelShortage, { isLoading: isCancellingShortage }] = useCancelShortageMutation();
  const [cancelOrder, { isLoading: isCancellingOrder }] = useCancelOrderMutation();
  const [confirmDelivered, { isLoading: isConfirmingDelivered }] = useConfirmDeliveredAsStaffMutation();
  const [confirmFailedDelivery, { isLoading: isConfirmingFailed }] = useConfirmFailedDeliveryAsStaffMutation();
  const [confirmReturned, { isLoading: isConfirmingReturned }] = useConfirmReturnedAsStaffMutation();

  const [paymentMethod, setPaymentMethod] = useState<number>(paymentMethodEnum.COD);
  const [msg, setMsg] = useState("");

  const latestPaymentStatus = latestPayment?.paymentStatus;
  const isLatestPaymentPaid = isPaymentSettled(latestPaymentStatus);
  const isLatestPaymentActive = isPaymentActive(latestPaymentStatus);
  const canCreatePayment = !!order && order.status === "Confirmed" && !isLatestPaymentPaid && !isLatestPaymentActive;
  const canCancelPayment = !!latestPayment && isPaymentActive(latestPayment.paymentStatus);
  const isDelivery = order?.fulfillmentType === "Delivery";

  const fulfilledQty = useMemo(
    () => (order?.items ?? []).reduce((sum, item) => sum + Number(item.fulfilledQuantity ?? 0), 0),
    [order?.items],
  );
  const hasAnyFulfilled = fulfilledQty > 0;

  useEffect(() => {
    if (!valid || !order) return;
    const shouldPoll =
      order.status === "Confirmed" ||
      order.status === "Shipping" ||
      isPaymentActive(latestPaymentStatus);
    if (!shouldPoll) return;
    const timer = window.setInterval(() => {
      refetchPayment();
      refetch();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [valid, order, latestPaymentStatus, refetch, refetchPayment]);

  const runOrderAction = async (action: () => Promise<unknown>, okText: string, failText: string) => {
    setMsg("");
    try {
      await action();
      setMsg(okText);
      await refetch();
      await refetchPayment();
    } catch (err) {
      setMsg(getApiErrorMessage(err, failText));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link to="/sales/orders/sale-confirm" className="text-sm font-medium text-slate-600 hover:text-[#1a5f2a]">
          ← Quay lại danh sách đơn của Sales
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Chi tiết đơn POS / Sales</h1>
        <p className="mt-1 text-sm text-slate-600">
          Màn này bám theo endpoint backend để xử lý các bước: giữ hàng, thanh toán, backorder và giao hàng.
        </p>
      </div>

      {!valid ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Mã đơn không hợp lệ.</div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">Đang tải chi tiết đơn...</div>
      ) : isError || !order ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-rose-700">Không tải được chi tiết đơn. Có thể bạn không phải người tạo đơn này.</p>
          <button onClick={() => refetch()} className="mt-2 text-sm font-semibold text-rose-700 hover:underline">
            Tải lại
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xl font-bold text-slate-900">Đơn #{order.orderId}</p>
              <p className="mt-2 text-sm text-slate-700">
                Trạng thái đơn: <span className="font-semibold">{orderStatusLabel(order.status)}</span>
              </p>
              <p className="text-sm text-slate-700">
                Trạng thái thanh toán: <span className="font-semibold">{paymentStatusLabel(latestPaymentStatus)}</span>
              </p>
              <p className="text-sm text-slate-700">
                Nguồn đơn: <span className="font-semibold">{order.source}</span> · Tạo lúc:{" "}
                <span className="font-semibold">{formatVietnamDate(order.createdAt)} {formatVietnamTime(order.createdAt)}</span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Thành tiền: <span className="font-semibold">{vnd(order.totalAmount)} ₫</span>
              </p>
            </div>

            {order.items.map((i, idx) => (
              <div key={`${i.productVariantId}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{i.productName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {i.isPartial ? "Hộp lẻ" : "Hộp đầy"} · {i.boxWeight}kg · {i.grade}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Số lượng: <span className="font-semibold">{i.quantity}</span> · Đơn giá:{" "}
                  <span className="font-semibold">{vnd(i.unitPrice)} ₫</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Đã giữ: {i.fulfilledQuantity} · Thiếu: {i.shortageQuantity}
                </p>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Thao tác theo luồng backend</h2>

            <div className="mt-3 space-y-2">
              {isDelivery && order.status === "AwaitingAllocation" && (
                <button
                  type="button"
                  onClick={() => runOrderAction(() => confirmOrder(orderId).unwrap(), "Đã xác nhận đơn để giữ hàng.", "Không thể xác nhận giữ hàng.")}
                  disabled={isConfirmingOrder}
                  className="w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                >
                  {isConfirmingOrder ? "Đang xử lý..." : "Xác nhận giữ hàng"}
                </button>
              )}

              {isDelivery && order.status === "PartiallyAllocated" && (
                <>
                  <button
                    type="button"
                    onClick={() => runOrderAction(() => waitBackorder(orderId).unwrap(), "Đã chuyển sang chờ backorder.", "Không thể chuyển sang chờ backorder.")}
                    disabled={isWaitingBackorder}
                    className="w-full rounded-lg border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                  >
                    {isWaitingBackorder ? "Đang xử lý..." : "Chờ backorder"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      runOrderAction(
                        () => (hasAnyFulfilled ? cancelShortage(orderId).unwrap() : cancelOrder(orderId).unwrap()),
                        hasAnyFulfilled ? "Đã hủy phần thiếu." : "Đã hủy toàn bộ đơn.",
                        hasAnyFulfilled ? "Không thể hủy phần thiếu." : "Không thể hủy đơn.",
                      )
                    }
                    disabled={isCancellingShortage || isCancellingOrder}
                    className="w-full rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {isCancellingShortage || isCancellingOrder
                      ? "Đang xử lý..."
                      : hasAnyFulfilled
                        ? "Hủy phần thiếu"
                        : "Hủy cả đơn"}
                  </button>
                </>
              )}

              {isDelivery && (order.status === "Shipping" || order.status === "FailedDelivery") && (
                <>
                  {order.status === "Shipping" && (
                    <>
                      <button
                        type="button"
                        onClick={() => runOrderAction(() => confirmDelivered(orderId).unwrap(), "Đã xác nhận giao thành công.", "Không thể xác nhận đã giao.")}
                        disabled={isConfirmingDelivered}
                        className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        {isConfirmingDelivered ? "Đang xử lý..." : "Xác nhận giao thành công"}
                      </button>
                      <button
                        type="button"
                        onClick={() => runOrderAction(() => confirmFailedDelivery(orderId).unwrap(), "Đã đánh dấu giao thất bại.", "Không thể cập nhật giao thất bại.")}
                        disabled={isConfirmingFailed}
                        className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        {isConfirmingFailed ? "Đang xử lý..." : "Xác nhận giao thất bại"}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => runOrderAction(() => confirmReturned(orderId).unwrap(), "Đã xác nhận hoàn hàng.", "Không thể xác nhận hoàn hàng.")}
                    disabled={isConfirmingReturned}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {isConfirmingReturned ? "Đang xử lý..." : "Xác nhận hoàn hàng"}
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <label className="text-xs font-medium text-slate-700">Phương thức thanh toán</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(Number(e.target.value))}
                disabled={!canCreatePayment || isCreatingPayment}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
              >
                <option value={paymentMethodEnum.COD}>COD (0)</option>
                <option value={paymentMethodEnum.BANKING}>Chuyển khoản/PayOS (3)</option>
              </select>

              <button
                type="button"
                onClick={() =>
                  runOrderAction(
                    () => createPayment({ orderId, paymentMethod }).unwrap(),
                    "Đã tạo thanh toán mới.",
                    "Không thể tạo thanh toán. Đơn cần ở trạng thái Confirmed và không có payment đang chờ.",
                  )
                }
                disabled={!canCreatePayment || isCreatingPayment}
                className="mt-2 w-full rounded-lg bg-[#1a5f2a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#145026] disabled:opacity-60"
              >
                {isCreatingPayment ? "Đang tạo thanh toán..." : "Tạo thanh toán"}
              </button>

              {latestPayment && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <p>Payment #{latestPayment.id}</p>
                  <p>Trạng thái: <span className="font-semibold">{paymentStatusLabel(latestPayment.paymentStatus)}</span></p>
                  {latestPayment.checkoutUrl && (
                    <a href={latestPayment.checkoutUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#1a5f2a] hover:underline">
                      Mở link thanh toán
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => runOrderAction(() => cancelPayment(latestPayment.id).unwrap(), "Đã hủy thanh toán.", "Không thể hủy thanh toán.")}
                    disabled={!canCancelPayment || isCancellingPayment}
                    className="mt-2 w-full rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {isCancellingPayment ? "Đang hủy..." : "Hủy thanh toán"}
                  </button>
                </div>
              )}
            </div>

            {!!msg && <p className="mt-3 text-xs text-slate-700">{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

