import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Truck } from "lucide-react";
import {
  shippingStatusApiValue,
  useGetApprovedExportOrdersQuery,
  useUpdateShippingStatusAsStaffMutation,
} from "../../order/api/order.api";
import type { OrderListItem } from "../../order/schemas/order.schema";
import { orderSourceLabel, orderSourceTone } from "../../../shared/lib/orderSource";
import { orderStatusLabel, orderStatusTone } from "../../../shared/lib/orderStatusUi";

function vnd(n: number) {
  return n.toLocaleString("vi-VN");
}

/** Giao hàng (Delivery) — hiển thị nhãn tiếng Việt. */
function shippingStatusLabelVi(status?: string | null) {
  if (!status || status === "None") return "—";
  if (status === "ShippingPendingPickup") return "Chờ lấy hàng";
  if (status === "ShippingInProgress") return "Đang giao hàng";
  if (status === "DeliveredShip") return "Đã giao";
  if (status === "ShippingFailed") return "Giao thất bại";
  return status;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const e = err as {
    data?: { message?: string; error?: string; detail?: string };
    message?: string;
  };
  return e?.data?.message || e?.data?.error || e?.data?.detail || e?.message || fallback;
}

/** Đơn đã duyệt xuất, chờ lấy hàng — đủ điều kiện PATCH → ShippingInProgress. */
function isPendingStartShipping(o: OrderListItem): boolean {
  if (o.status !== "ApprovedExport") return false;
  const s = o.shippingStatus;
  return s === "ShippingPendingPickup" || s == null || s === "";
}

export default function WarehouseStartShippingPage() {
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [page, setPage] = useState(1);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  const skip = (page - 1) * pageSize;
  const {
    data: rows = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetApprovedExportOrdersQuery({ skip, take: pageSize });

  const [updateShippingStatus] = useUpdateShippingStatusAsStaffMutation();

  const pendingRows = useMemo(() => rows.filter(isPendingStartShipping), [rows]);

  const hasNextPage = rows.length === pageSize;

  const onStartShipping = async (orderId: number) => {
    const t = toast.loading(`Đang chuyển đơn #${orderId} sang đang giao...`);
    setBusyOrderId(orderId);
    try {
      await updateShippingStatus({
        id: orderId,
        shippingStatus: shippingStatusApiValue.shippingInProgress,
      }).unwrap();
      toast.success(`Đã chuyển đơn #${orderId} sang đang giao hàng.`, { id: t });
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể cập nhật trạng thái giao hàng."), { id: t });
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
            <Truck size={20} aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Xác nhận shipper đã lấy hàng</h1>
            <p className="mt-1 text-sm text-slate-600">
              Đơn <span className="font-semibold">Đã duyệt xuất</span> và{" "}
              <span className="font-semibold">chờ lấy hàng</span> — xác nhận khi shipper đã lấy hàng và đi giao.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Số dòng / trang</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as 20 | 50 | 100);
                setPage(1);
              }}
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>

        {isLoading || isFetching ? (
          <div className="mt-6 flex items-center justify-center gap-2 py-12 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <span className="text-sm font-medium">Đang tải...</span>
          </div>
        ) : pendingRows.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
            Không có đơn nào chờ xác nhận shipper đã lấy hàng.
          </p>
        ) : (
          <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2.5 px-3">Đơn</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Giao hàng</th>
                  <th className="py-2.5 px-3">Nguồn</th>
                  <th className="py-2.5 px-3">Thành tiền</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRows.map((o) => (
                  <tr key={o.orderId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-semibold text-slate-900">#{o.orderId}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${orderStatusTone(o.status)}`}
                      >
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{shippingStatusLabelVi(o.shippingStatus)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${orderSourceTone(o.source)}`}
                      >
                        {orderSourceLabel(o.source)}
                      </span>
                    </td>
                    <td className="py-3 px-3 tabular-nums font-medium text-slate-900">{vnd(o.totalAmount)} ₫</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => void onStartShipping(o.orderId)}
                        disabled={busyOrderId === o.orderId}
                        className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900 shadow-sm hover:bg-sky-100 disabled:opacity-50"
                      >
                        {busyOrderId === o.orderId ? "Đang xử lý..." : "Xác nhận shipper đã lấy hàng"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm font-semibold tabular-nums text-slate-700">Trang {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
