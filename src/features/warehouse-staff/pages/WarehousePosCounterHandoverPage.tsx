import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, Store } from "lucide-react";
import {
  useConfirmPosCounterHandoverAsStaffMutation,
  useGetPendingPosCounterHandoverOrdersQuery,
} from "../../order/api/order.api";
import type { OrderListItem } from "../../order/schemas/order.schema";
import { orderSourceLabel, orderSourceTone } from "../../../shared/lib/orderSource";
import { orderStatusLabel, orderStatusTone } from "../../../shared/lib/orderStatusUi";
import { fulfillmentTypeLabel, fulfillmentTypeTone } from "../../../shared/lib/fulfillmentTypeUi";

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

export default function WarehousePosCounterHandoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightOrderId = Number(searchParams.get("highlightOrderId") ?? "");
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [page, setPage] = useState(1);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  const skip = (page - 1) * pageSize;
  const {
    data: rows = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetPendingPosCounterHandoverOrdersQuery({ skip, take: pageSize });

  const [confirmHandover] = useConfirmPosCounterHandoverAsStaffMutation();

  const hasNextPage = rows.length === pageSize;

  const sortedRows = useMemo(() => {
    if (!Number.isFinite(highlightOrderId) || highlightOrderId <= 0) return rows;
    const hit = rows.find((r) => r.orderId === highlightOrderId);
    if (!hit) return rows;
    return [hit, ...rows.filter((r) => r.orderId !== highlightOrderId)];
  }, [rows, highlightOrderId]);

  useEffect(() => {
    if (!Number.isFinite(highlightOrderId) || highlightOrderId <= 0) return;
    const t = window.setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => window.clearTimeout(t);
  }, [highlightOrderId, sortedRows]);

  const onConfirm = async (orderId: number) => {
    const t = toast.loading(`Đang xác nhận đơn #${orderId}...`);
    setBusyOrderId(orderId);
    try {
      await confirmHandover(orderId).unwrap();
      toast.success(`Đã xác nhận giao hàng cho khách tại quầy (đơn #${orderId}).`, { id: t });
      if (searchParams.get("highlightOrderId")) {
        searchParams.delete("highlightOrderId");
        setSearchParams(searchParams, { replace: true });
      }
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xác nhận."), { id: t });
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
            <Store size={20} aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Giao hàng tại quầy (POS)</h1>
            <p className="mt-1 text-sm text-slate-600">
              Đơn <span className="font-semibold">tạo tại quầy</span>, hình thức{" "}
              <span className="font-semibold">nhận tại quầy</span>, đã{" "}
              <span className="font-semibold">duyệt phiếu xuất</span> — kho xác nhận khi đã bàn giao hàng cho
              khách.
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
        ) : sortedRows.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
            Không có đơn POS nào đang chờ xác nhận giao tại quầy.
          </p>
        ) : (
          <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2.5 px-3">Đơn</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Nguồn / nhận hàng</th>
                  <th className="py-2.5 px-3">Khách</th>
                  <th className="py-2.5 px-3">Thành tiền</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((o: OrderListItem) => {
                  const isHi = o.orderId === highlightOrderId;
                  return (
                    <tr
                      key={o.orderId}
                      ref={isHi ? highlightRef : undefined}
                      className={`hover:bg-slate-50/80 ${isHi ? "bg-amber-50/90" : ""}`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900">#{o.orderId}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${orderStatusTone(o.status)}`}
                        >
                          {orderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${orderSourceTone(o.source)}`}
                          >
                            {orderSourceLabel(o.source)}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${fulfillmentTypeTone(o.fulfillmentType)}`}
                          >
                            {fulfillmentTypeLabel(o.fulfillmentType)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-medium text-slate-900">{o.customerName?.trim() || "—"}</div>
                        <div className="text-xs text-slate-500">{o.customerPhone?.trim() || ""}</div>
                      </td>
                      <td className="py-3 px-3 tabular-nums font-medium text-slate-900">{vnd(o.totalAmount)} ₫</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => void onConfirm(o.orderId)}
                          disabled={busyOrderId === o.orderId}
                          className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 shadow-sm hover:bg-teal-100 disabled:opacity-50"
                        >
                          {busyOrderId === o.orderId ? "Đang xử lý..." : "Đã giao cho khách tại quầy"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
