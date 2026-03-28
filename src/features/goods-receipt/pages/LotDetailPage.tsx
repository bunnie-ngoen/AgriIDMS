import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Package, X } from "lucide-react";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";
import { useGetLotDetailByIdQuery } from "../api/goods-receipt.api";
import type { LotBoxItem } from "../types/goods-receipt.type";

function toVietnameseLotStatus(status: string): string {
  if (status === "Active") return "Đang hoạt động";
  if (status === "Blocked") return "Tạm khóa";
  if (status === "Expired") return "Hết hạn";
  return status;
}

function toStatusTone(status: string): string {
  if (status === "Active") return "text-emerald-600";
  if (status === "Blocked") return "text-amber-600";
  if (status === "Expired") return "text-rose-600";
  return "text-slate-600";
}

export default function LotDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const lotId = Number(id);
  const { isManager, isWarehouseStaff } = useRoleGuard();
  const lotBasePath = isWarehouseStaff()
    ? "/warehouse/lots"
    : isManager()
      ? "/manager/lots"
      : "/admin/lots";

  const { data, isLoading, isError, refetch } = useGetLotDetailByIdQuery(lotId, {
    skip: !lotId || Number.isNaN(lotId),
  });

  const boxes = useMemo(() => data?.boxes ?? [], [data?.boxes]);
  const [selectedBox, setSelectedBox] = useState<LotBoxItem | null>(null);

  if (!lotId || Number.isNaN(lotId)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 py-6">
      <div className="w-full max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(lotBasePath)}
              className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Chi tiết lot
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Thông tin lot và danh sách box được tạo từ lot này.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-14 flex justify-center">
            <Loader2 size={32} className="animate-spin text-slate-400" />
          </div>
        ) : isError || !data ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-10 px-6">
            <p className="text-sm text-rose-600">Không tải được chi tiết lot.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm text-emerald-700 font-medium hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Lot code
                </p>
                <p className="text-slate-900 font-semibold mt-1">{data.lotCode}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Sản phẩm / biến thể
                </p>
                <p className="text-slate-900 font-semibold mt-1">
                  {data.productName || "—"}
                </p>
                <p className="text-xs text-slate-500">{data.productVariantName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Kho
                </p>
                <p className="text-slate-900 font-semibold mt-1">{data.warehouseName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Trạng thái
                </p>
                <p className={`font-semibold mt-1 ${toStatusTone(data.status)}`}>
                  {toVietnameseLotStatus(data.status)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Ngày nhập
                </p>
                <p className="text-slate-900 font-semibold mt-1">
                  {data.receivedDate
                    ? new Date(data.receivedDate).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  HSD
                </p>
                <p className="text-slate-900 font-semibold mt-1">
                  {data.expiryDate
                    ? new Date(data.expiryDate).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Còn lại / tổng (kg)
                </p>
                <p className="text-slate-900 font-semibold mt-1">
                  {data.remainingQuantity} / {data.totalQuantity}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Số box tạo từ lot
                </p>
                <p className="text-slate-900 font-semibold mt-1">{boxes.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Package size={16} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Danh sách box thuộc lot này
                </h2>
              </div>

              {boxes.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">
                  Chưa có box nào được tạo từ lot này.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Box code
                        </th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          KL (kg)
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Trạng thái
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Slot
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          QR
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Ngày tạo
                        </th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {boxes.map((b) => (
                        <tr
                          key={b.boxId}
                          className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {b.boxCode}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-700">
                            {b.weight}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">{b.status}</td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {b.slotCode || "Chưa xếp slot"}
                          </td>
                          <td className="px-5 py-3.5">
                            {b.qrImageUrl ? (
                              <a
                                href={b.qrImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2"
                              >
                                <img
                                  src={b.qrImageUrl}
                                  alt={`QR ${b.boxCode}`}
                                  className="h-9 w-9 rounded border border-slate-200 bg-white object-contain"
                                />
                                <span className="text-xs font-medium text-emerald-700">
                                  Xem QR
                                </span>
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">Chưa có ảnh QR</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {b.createdAt
                              ? new Date(b.createdAt).toLocaleDateString("vi-VN")
                              : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedBox(b)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedBox ? (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Chi tiết box
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedBox.boxCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBox(null)}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Box code
                      </p>
                      <p className="mt-1 font-medium text-slate-900">{selectedBox.boxCode}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Trạng thái
                      </p>
                      <p className="mt-1 font-medium text-slate-900">{selectedBox.status}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Khối lượng (kg)
                      </p>
                      <p className="mt-1 font-medium text-slate-900">{selectedBox.weight}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Slot
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedBox.slotCode || "Chưa xếp slot"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        QR Code
                      </p>
                      <p className="mt-1 font-medium text-slate-900 break-all">
                        {selectedBox.qrCode || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Ngày tạo
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedBox.createdAt
                          ? new Date(selectedBox.createdAt).toLocaleString("vi-VN")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Sản phẩm
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {data.productName || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Biến thể
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {data.productVariantName || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    {selectedBox.qrImageUrl ? (
                      <a
                        href={selectedBox.qrImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3"
                      >
                        <img
                          src={selectedBox.qrImageUrl}
                          alt={`QR ${selectedBox.boxCode}`}
                          className="h-24 w-24 rounded border border-slate-200 bg-white object-contain"
                        />
                        <span className="text-sm font-medium text-emerald-700">Mở ảnh QR</span>
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">Box chưa có ảnh QR.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
