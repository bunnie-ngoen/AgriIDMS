import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";
import {
  useGetDamagedBoxesQuery,
  useGetExpiredBoxesByWarehouseQuery,
  useDisposeExpiredBoxesMutation,
  useGetUnassignedBoxesByWarehouseQuery,
} from "../../goods-receipt/api/goods-receipt.api";

function formatKg(value?: number | null) {
  const n = typeof value === "number" ? value : 0;
  return n.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export default function UnassignedInventoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const putawayBasePath = location.pathname.startsWith("/warehouse")
    ? "/warehouse/putaway"
    : "/manager/putaway";
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const {
    data: unassignedBoxes = [],
    isFetching,
    error,
    refetch: refetchUnassignedBoxes,
  } = useGetUnassignedBoxesByWarehouseQuery(warehouseId > 0 ? warehouseId : 0, {
    skip: warehouseId <= 0,
  });
  const [disposeExpiredBoxes, { isLoading: isDisposing }] = useDisposeExpiredBoxesMutation();
  // Backward-compatible fallback for older deployments where /Boxes/unassigned
  // still excludes some statuses (e.g. expired/damaged).
  const { data: damagedBoxes = [] } = useGetDamagedBoxesQuery(
    warehouseId > 0 ? warehouseId : undefined,
  );
  const {
    data: expiredBoxes = [],
    refetch: refetchExpiredBoxes,
  } = useGetExpiredBoxesByWarehouseQuery(
    warehouseId > 0 ? warehouseId : 0,
    { skip: warehouseId <= 0 },
  );

  const effectiveUnassignedBoxes = useMemo(() => {
    const merged = [...unassignedBoxes, ...damagedBoxes, ...expiredBoxes];
    const byId = new Map<number, (typeof merged)[number]>();
    for (const box of merged) {
      const id = Number(box.id ?? 0);
      if (id <= 0) continue;
      if (box.slotId != null && box.slotId > 0) continue;
      if ((box.weight ?? 0) <= 0) continue;
      const status = (box.status ?? "").toLowerCase();
      if (status === "exported" || status === "disposed") continue;
      byId.set(id, box);
    }
    return Array.from(byId.values());
  }, [unassignedBoxes, damagedBoxes, expiredBoxes]);

  const groupedByLot = useMemo(() => {
    const map = new Map<
      number,
      {
        lotId: number;
        lotCode: string;
        warehouseName: string;
        productName: string;
        productVariantName: string;
        boxCount: number;
        totalWeight: number;
        expiredBoxCount: number;
        boxIds: number[];
      }
    >();

    for (const box of effectiveUnassignedBoxes) {
      const lotId = Number(box.lotId || 0);
      if (lotId <= 0) continue;
      const current = map.get(lotId);
      const boxId = Number(box.id || 0);
      const expiryDate = box.expiryDate ? new Date(box.expiryDate) : null;
      const isExpired =
        expiryDate != null &&
        !Number.isNaN(expiryDate.getTime()) &&
        expiryDate.getTime() < Date.now();
      if (!current) {
        map.set(lotId, {
          lotId,
          lotCode: box.lotCode ?? `Lot #${lotId}`,
          warehouseName: box.warehouseName ?? "—",
          productName: box.productName ?? "—",
          productVariantName: box.productVariantName ?? "",
          boxCount: 1,
          totalWeight: Number(box.weight ?? 0),
          expiredBoxCount: isExpired ? 1 : 0,
          boxIds: boxId > 0 ? [boxId] : [],
        });
      } else {
        current.boxCount += 1;
        current.totalWeight += Number(box.weight ?? 0);
        if (isExpired) current.expiredBoxCount += 1;
        if (boxId > 0 && !current.boxIds.includes(boxId)) current.boxIds.push(boxId);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const aExpired = a.expiredBoxCount > 0 ? 1 : 0;
      const bExpired = b.expiredBoxCount > 0 ? 1 : 0;
      if (aExpired !== bExpired) return bExpired - aExpired;
      return b.boxCount - a.boxCount;
    });
  }, [effectiveUnassignedBoxes]);

  const handleDisposeExpiredByLot = async (lotId: number, boxIds: number[]) => {
    if (!boxIds.length) {
      toast.error("Không có box hợp lệ để tiêu hủy.");
      return;
    }
    const toastId = toast.loading("Đang tiêu hủy box hết hạn...");
    try {
      const result = await disposeExpiredBoxes({ boxIds }).unwrap();
      await Promise.all([refetchUnassignedBoxes(), refetchExpiredBoxes()]);
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
        `Tiêu hủy lô #${lotId} thất bại.`;
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-sky-700" />
          <h2 className="text-lg font-semibold text-slate-900">Hàng chưa xếp vị trí</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Xem chi tiết các box chưa được xếp slot và đi thẳng đến màn xếp vị trí theo từng lô.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Kho</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              <option value={0}>Chọn kho</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-xs text-sky-700">Tổng box chưa xếp</p>
            <p className="text-2xl font-bold text-sky-800">
              {warehouseId <= 0 ? "—" : isFetching ? "..." : effectiveUnassignedBoxes.length}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            Không tải được dữ liệu box chưa xếp vị trí.
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">
            Danh sách chưa xếp (group theo lô)
          </div>
          <button
            type="button"
            onClick={() => navigate(putawayBasePath)}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
          >
            Mở màn xếp vị trí
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Lô hàng</th>
                <th className="px-3 py-2 text-left">Sản phẩm</th>
                <th className="px-3 py-2 text-left">Kho</th>
                <th className="px-3 py-2 text-right">Số box chưa xếp</th>
                <th className="px-3 py-2 text-right">Khối lượng</th>
                <th className="px-3 py-2 text-center">Trạng thái</th>
                <th className="px-3 py-2 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {warehouseId <= 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={7}>
                    Vui lòng chọn kho để xem dữ liệu.
                  </td>
                </tr>
              ) : groupedByLot.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={7}>
                    Kho này không có box chưa xếp vị trí.
                  </td>
                </tr>
              ) : (
                groupedByLot.map((row) => (
                  <tr key={row.lotId} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-900">{row.lotCode}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {row.productName}
                      {row.productVariantName ? ` · ${row.productVariantName}` : ""}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{row.warehouseName}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{row.boxCount}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatKg(row.totalWeight)} kg</td>
                    <td className="px-3 py-2 text-center">
                      {row.expiredBoxCount > 0 ? (
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-rose-100 text-rose-700">
                          Có {row.expiredBoxCount} box hết hạn
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                          Bình thường
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`${putawayBasePath}?lotId=${row.lotId}`)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Đi xếp ngay
                        </button>
                        {row.expiredBoxCount > 0 ? (
                          <button
                            type="button"
                            disabled={isDisposing}
                            onClick={() => handleDisposeExpiredByLot(row.lotId, row.boxIds)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Tiêu hủy
                          </button>
                        ) : null}
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

