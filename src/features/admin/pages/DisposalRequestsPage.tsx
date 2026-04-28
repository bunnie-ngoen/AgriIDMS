import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useApproveDisposalRequestMutation,
  useGetDisposalRequestByIdQuery,
  useGetDisposalRequestsQuery,
  useRejectDisposalRequestMutation,
} from "../../goods-receipt/api/goods-receipt.api";

export default function DisposalRequestsPage() {
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data = [], isFetching, refetch } = useGetDisposalRequestsQuery({
    status: "Pending",
  });
  const { data: detailItem, isFetching: isFetchingDetail } = useGetDisposalRequestByIdQuery(
    detailId ?? 0,
    { skip: !detailId },
  );
  const [approveRequest, { isLoading: isApproving }] =
    useApproveDisposalRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] =
    useRejectDisposalRequestMutation();

  const pendingItems = useMemo(
    () => data.filter((x) => (x.status || "").toLowerCase() === "pending"),
    [data],
  );

  const handleApprove = async (id: number) => {
    try {
      await approveRequest({ id }).unwrap();
      toast.success("Đã duyệt yêu cầu tiêu hủy.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Duyệt yêu cầu thất bại.");
    }
  };

  const handleReject = async (id: number) => {
    const note = window.prompt("Nhập lý do từ chối (tuỳ chọn):") ?? "";
    try {
      await rejectRequest({ id, reviewNote: note }).unwrap();
      toast.success("Đã từ chối yêu cầu tiêu hủy.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Từ chối yêu cầu thất bại.");
    }
  };

  return (
    <div className="space-y-4">
      {detailId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDetailId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Chi tiết yêu cầu tiêu hủy #{detailId}
                </p>
                {detailItem && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kho: {detailItem.warehouseName} · Người gửi:{" "}
                    {detailItem.requestedByName || detailItem.requestedBy}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {isFetchingDetail || !detailItem ? (
                <p className="text-sm text-slate-500">Đang tải chi tiết...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Lý do tiêu hủy</p>
                      <p className="text-slate-800 mt-1">{detailItem.reason || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Thông tin duyệt</p>
                      <p className="text-slate-800 mt-1">
                        {detailItem.reviewedByName || detailItem.reviewedBy || "Chưa duyệt"}
                        {detailItem.reviewedAt
                          ? ` · ${new Date(detailItem.reviewedAt).toLocaleString("vi-VN")}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                    <table className="min-w-[760px] w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Hàng</th>
                          <th className="px-3 py-2 text-left">Sản phẩm</th>
                          <th className="px-3 py-2 text-left">Lô hàng</th>
                          <th className="px-3 py-2 text-left">HSD</th>
                          <th className="px-3 py-2 text-left">Vị trí</th>
                          <th className="px-3 py-2 text-right">Kg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItem.items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                              Không có dữ liệu box.
                            </td>
                          </tr>
                        ) : (
                          detailItem.items.map((box) => (
                            <tr key={box.boxId} className="border-t border-slate-100">
                              <td className="px-3 py-2 font-mono text-[11px]">{box.boxCode}</td>
                              <td className="px-3 py-2">
                                {box.productName || "—"}
                                {box.productVariantName ? ` · ${box.productVariantName}` : ""}
                              </td>
                              <td className="px-3 py-2">{box.lotCode || "—"}</td>
                              <td className="px-3 py-2">
                                {box.expiryDate
                                  ? new Date(box.expiryDate).toLocaleDateString("vi-VN")
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">{box.slotCode || "Chưa xếp"}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{box.weight}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Duyệt yêu cầu tiêu hủy hàng hóa
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Nhân viên kho có thể gửi yêu cầu tiêu hủy cả hàng chưa hết hạn. Quản lí duyệt thì hệ
          thống mới trừ tồn và ghi transaction.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Mã yêu cầu</th>
                <th className="px-3 py-2 text-left">Kho</th>
                <th className="px-3 py-2 text-left">Lý do tiêu hủy</th>
                <th className="px-3 py-2 text-right">Số box</th>
                <th className="px-3 py-2 text-left">Người gửi</th>
                <th className="px-3 py-2 text-left">Thời gian</th>
                <th className="px-3 py-2 text-center">Chi tiết</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              ) : pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                    Không có yêu cầu chờ duyệt.
                  </td>
                </tr>
              ) : (
                pendingItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-900">#{item.id}</td>
                    <td className="px-3 py-2 text-slate-700">{item.warehouseName}</td>
                    <td className="px-3 py-2 text-slate-700">{item.reason}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{item.boxCount}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.requestedByName || item.requestedBy || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {new Date(item.requestedAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => setDetailId(item.id)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Xem
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleApprove(item.id)}
                          disabled={isApproving || isRejecting}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReject(item.id)}
                          disabled={isApproving || isRejecting}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

