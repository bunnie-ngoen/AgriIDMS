import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";
import { useCreateStockCheckMutation } from "../api/stock-check.api";

const CHECK_TYPE = {
  Full: 1,
  Cycle: 2,
  Spot: 3,
} as const;

function parseBoxIds(text: string): number[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export default function WarehouseStockCheckCreatePage() {
  const navigate = useNavigate();
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useGetWarehousesQuery();
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [checkType, setCheckType] = useState<number>(CHECK_TYPE.Full);
  const [boxIdsText, setBoxIdsText] = useState<string>("");

  const [createStockCheck, { isLoading: isCreating }] = useCreateStockCheckMutation();

  const canCreate = useMemo(() => {
    if (warehouseId <= 0) return false;
    if (checkType === CHECK_TYPE.Spot) {
      const boxIds = parseBoxIds(boxIdsText);
      return boxIds.length > 0;
    }
    return true;
  }, [warehouseId, checkType, boxIdsText]);

  const handleSubmit = async () => {
    if (warehouseId <= 0) {
      toast.error("Vui lòng chọn kho");
      return;
    }

    const boxIds =
      checkType === CHECK_TYPE.Spot ? parseBoxIds(boxIdsText) : null;

    if (checkType === CHECK_TYPE.Spot && (!boxIds || boxIds.length === 0)) {
      toast.error("Spot cần danh sách BoxIds (cách nhau bởi dấu ,)");
      return;
    }

    try {
      const res = await createStockCheck({
        warehouseId,
        checkType,
        boxIds,
      }).unwrap();

      toast.success("Tạo phiếu kiểm kê thành công");
      navigate(`/warehouse/stock-checks/${res.stockCheckId}`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể tạo phiếu kiểm kê");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Tạo phiếu kiểm kê (WarehouseStaff)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Toàn phần: tất cả box trong kho. Đột xuất: bạn tự chọn danh sách BoxIds.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {isLoadingWarehouses ? (
          <div className="text-center text-slate-500 py-8">Đang tải kho...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-800">
                Kho
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value={0}>Chọn kho...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.titleWarehouse})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800">
                Kiểu kiểm kê
              </label>
              <select
                value={checkType}
                onChange={(e) => setCheckType(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value={CHECK_TYPE.Full}>Toàn phần</option>
                <option value={CHECK_TYPE.Cycle}>Theo chu kỳ</option>
                <option value={CHECK_TYPE.Spot}>Đột xuất</option>
              </select>
            </div>

            {checkType === CHECK_TYPE.Spot ? (
              <div>
                <label className="text-sm font-medium text-slate-800">
                  BoxIds (Spot)
                </label>
                <input
                  type="text"
                  value={boxIdsText}
                  onChange={(e) => setBoxIdsText(e.target.value)}
                  placeholder="vd: 12, 13, 14"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Nhập danh sách BoxId cách nhau bởi dấu `,`.
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => navigate("/warehouse/stock-checks")}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!canCreate || isCreating}
                onClick={() => void handleSubmit()}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
              >
                {isCreating ? "Đang tạo..." : "Tạo phiếu"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

