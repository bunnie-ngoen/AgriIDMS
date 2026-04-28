import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, PackageX } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";
import {
  useDisposeExpiredBoxesMutation,
  useGetDamagedBoxesQuery,
  useLazyGetLotDetailByIdQuery,
  useGetNearExpiryDashboardQuery,
} from "../../goods-receipt/api/goods-receipt.api";
import { formatNearExpiryProductLines } from "../utils/nearExpiryProductDisplay";

function formatDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString("vi-VN");
}

function formatKg(value?: number | null) {
  const n = typeof value === "number" ? value : 0;
  return n.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function formatExpiryLeadTime(daysLeft: number, status: string) {
  const isExpired = status === "Expired";
  const days = Math.abs(daysLeft);
  return isExpired ? `Quá hạn ${days} ngày` : `Còn ${days} ngày`;
}

export default function InventoryIssueManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isWarehouseRoute = location.pathname.startsWith("/warehouse");
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [days, setDays] = useState<number>(3);

  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: damagedBoxes = [], isFetching: isFetchingDamaged, error: damagedError } =
    useGetDamagedBoxesQuery(warehouseId > 0 ? warehouseId : undefined);
  const { data: nearExpiry, isFetching: isFetchingNearExpiry, error: nearExpiryError } =
    useGetNearExpiryDashboardQuery({
      days,
      warehouseId: warehouseId > 0 ? warehouseId : undefined,
    });
  const [loadLotDetail, { isFetching: isFetchingLotDetail }] = useLazyGetLotDetailByIdQuery();
  const [disposeExpiredBoxes, { isLoading: isDisposingExpired }] =
    useDisposeExpiredBoxesMutation();

  const expiredLots = useMemo(
    () => (nearExpiry?.lots ?? []).filter((l) => l.status === "Expired"),
    [nearExpiry?.lots],
  );

  const nearExpiryLots = useMemo(
    () => (nearExpiry?.lots ?? []).filter((l) => l.status !== "Expired"),
    [nearExpiry?.lots],
  );

  const handleDirectDisposeExpiredLot = async (lotId: number, lotCode: string) => {
    const ok = window.confirm(
      `Xác nhận tiêu hủy ngay toàn bộ box hết hạn của lô ${lotCode}?`,
    );
    if (!ok) return;
    const toastId = toast.loading(`Đang tiêu hủy hàng hết hạn của lô ${lotCode}...`);
    try {
      const lotDetail = await loadLotDetail(lotId).unwrap();
      const candidateBoxIds = (lotDetail.boxes ?? [])
        .filter((b) => {
          const st = (b.status ?? "").toLowerCase();
          return st !== "disposed" && st !== "exported";
        })
        .map((b) => b.boxId);
      if (candidateBoxIds.length === 0) {
        toast.error("Không có box hợp lệ để tiêu hủy trong lô này.", { id: toastId });
        return;
      }
      const result = await disposeExpiredBoxes({ boxIds: candidateBoxIds }).unwrap();
      toast.success(
        `${result.message}. Đã tiêu hủy ${result.disposedCount}/${result.requestedCount} box.`,
        { id: toastId },
      );
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Tiêu hủy hàng hết hạn thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Quản lý hàng hư hỏng và quá hạn
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Theo dõi hàng hư hỏng và lô hàng sắp hết hạn/hết hạn để xử lý kịp thời.
            </p>
          </div>
          {isWarehouseRoute ? (
            <button
              type="button"
              onClick={() => navigate("/warehouse/damage-reports/new")}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Tạo phiếu báo hỏng
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Kho</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              <option value={0}>Tất cả kho</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Ngưỡng cảnh báo sắp hết hạn (ngày)
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              {[1, 3, 5, 7, 14].map((d) => (
                <option key={d} value={d}>
                  {d} ngày
                </option>
              ))}
            </select>
          </div>
        </div>

        {damagedError || nearExpiryError ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            Không tải được dữ liệu hư hỏng/quá hạn. Vui lòng thử lại.
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
            <PackageX size={16} />
          </div>
          <div className="mt-2 text-xs text-rose-700">Hàng hư hỏng</div>
          <div className="text-2xl font-bold text-rose-800">
            {isFetchingDamaged ? "..." : damagedBoxes.length}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle size={16} />
          </div>
          <div className="mt-2 text-xs text-amber-700">Lô hàng sắp hết hạn</div>
          <div className="text-2xl font-bold text-amber-800">
            {isFetchingNearExpiry ? "..." : nearExpiryLots.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
            <CalendarClock size={16} />
          </div>
          <div className="mt-2 text-xs text-slate-700">Lô hàng đã quá hạn</div>
          <div className="text-2xl font-bold text-slate-900">
            {isFetchingNearExpiry ? "..." : expiredLots.length}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">
          Danh sách hàng hư hỏng
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Hàng</th>
                <th className="px-3 py-2 text-left">Lô hàng</th>
                <th className="px-3 py-2 text-left">Sản phẩm</th>
                <th className="px-3 py-2 text-left">Kho</th>
                <th className="px-3 py-2 text-right">Khối lượng</th>
                <th className="px-3 py-2 text-left">Vị trí</th>
                {isWarehouseRoute ? (
                  <th className="px-3 py-2 text-right">Thao tác</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {damagedBoxes.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={isWarehouseRoute ? 7 : 6}>
                    Không có hàng hư hỏng.
                  </td>
                </tr>
              ) : (
                damagedBoxes.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-900">{b.boxCode}</td>
                    <td className="px-3 py-2 text-slate-700">{b.lotCode ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {b.productName ?? "—"}
                      {b.productVariantName ? ` · ${b.productVariantName}` : ""}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{b.warehouseName ?? "—"}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatKg(b.weight)} kg</td>
                    <td className="px-3 py-2 text-slate-700">{b.slotCode ?? "Chưa xếp"}</td>
                    {isWarehouseRoute ? (
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/warehouse/damage-reports/new?qr=${encodeURIComponent(
                                b.boxCode,
                              )}`,
                            )
                          }
                          className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Báo hỏng thùng này
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">
          Danh sách lô hàng sắp hết hạn / quá hạn
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[1120px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Lô hàng</th>
                <th className="px-3 py-2 text-left">Sản phẩm</th>
                <th className="px-3 py-2 text-left">Kho</th>
                <th className="px-3 py-2 text-right">Còn lại</th>
                <th className="px-3 py-2 text-left">Hạn dùng</th>
                <th className="px-3 py-2 text-right">Tiến độ hạn dùng</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
                {isWarehouseRoute ? (
                  <th className="px-3 py-2 text-right">Xử lý</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {(nearExpiry?.lots ?? []).length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={isWarehouseRoute ? 8 : 7}>
                    Không có lô hàng trong ngưỡng cảnh báo.
                  </td>
                </tr>
              ) : (
                (nearExpiry?.lots ?? []).map((l) => {
                  const { title, subtitle } = formatNearExpiryProductLines(l);
                  return (
                  <tr key={l.lotId} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-900">{l.lotCode}</td>
                    <td className="px-3 py-2 text-slate-700">
                      <div>
                        <div className="font-medium text-slate-900">{title}</div>
                        {subtitle ? (
                          <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{l.warehouseName || "—"}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatKg(l.remainingQuantity)} kg
                    </td>
                    <td className="px-3 py-2 text-slate-700">{formatDate(l.expiryDate)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatExpiryLeadTime(l.daysLeft, l.status)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          l.status === "Expired"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {l.status === "Expired" ? "Quá hạn" : "Sắp hết hạn"}
                      </span>
                    </td>
                    {isWarehouseRoute ? (
                      <td className="px-3 py-2 text-right">
                        {l.status === "Expired" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDirectDisposeExpiredLot(l.lotId, l.lotCode)
                            }
                            disabled={isDisposingExpired || isFetchingLotDetail}
                            className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            {isDisposingExpired || isFetchingLotDetail
                              ? "Đang tiêu hủy..."
                              : "Tiêu hủy ngay"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Theo dõi</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
