import toast from "react-hot-toast";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImageUp, Loader2, QrCode, X } from "lucide-react";
import { decodeQrFromImageFile } from "../../../shared/lib/decodeQrFromImage";
import QrCameraScannerModal from "../../../shared/components/QrCameraScannerModal";
import {
  useGetRacksQuery,
  useGetSlotsQuery,
  useGetWarehousesQuery,
  useGetZonesQuery,
} from "../../admin/api/create-user.api";
import { useLazyGetBoxByQrQuery } from "../../goods-receipt/api/goods-receipt.api";
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

type SpotBoxItem = {
  id: number;
  boxCode: string;
  qrCode?: string | null;
  warehouseId?: number | null;
};

export default function WarehouseStockCheckCreatePage() {
  const navigate = useNavigate();
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useGetWarehousesQuery();
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [checkType, setCheckType] = useState<number>(CHECK_TYPE.Full);
  const [zoneId, setZoneId] = useState<number>(0);
  const [rackId, setRackId] = useState<number>(0);
  const [slotId, setSlotId] = useState<number>(0);
  const [boxIdsText, setBoxIdsText] = useState<string>("");
  const [boxQrInput, setBoxQrInput] = useState<string>("");
  const [spotBoxes, setSpotBoxes] = useState<SpotBoxItem[]>([]);
  const [isBoxQrCameraOpen, setIsBoxQrCameraOpen] = useState(false);
  const boxQrImageRef = useRef<HTMLInputElement | null>(null);

  const [createStockCheck, { isLoading: isCreating }] = useCreateStockCheckMutation();
  const [triggerBoxByQr, { isFetching: isFindingBoxByQr }] = useLazyGetBoxByQrQuery();
  const { data: zones = [] } = useGetZonesQuery(warehouseId, { skip: warehouseId <= 0 });
  const { data: racks = [] } = useGetRacksQuery(zoneId, { skip: zoneId <= 0 });
  const { data: slots = [] } = useGetSlotsQuery(rackId, { skip: rackId <= 0 });

  const isCycle = checkType === CHECK_TYPE.Cycle;

  const manualSpotIds = useMemo(() => parseBoxIds(boxIdsText), [boxIdsText]);
  const effectiveSpotIds = useMemo(() => {
    const merged = [...spotBoxes.map((b) => b.id)];
    for (const id of manualSpotIds) {
      if (!merged.includes(id)) merged.push(id);
    }
    return merged;
  }, [manualSpotIds, spotBoxes]);

  const canCreate = useMemo(() => {
    if (warehouseId <= 0) return false;
    if (checkType === CHECK_TYPE.Cycle) {
      return zoneId > 0 || rackId > 0 || slotId > 0;
    }
    if (checkType === CHECK_TYPE.Spot) {
      return effectiveSpotIds.length > 0;
    }
    return true;
  }, [warehouseId, checkType, effectiveSpotIds.length, zoneId, rackId, slotId]);

  const handleAddSpotBoxByQr = async (qrOverride?: string) => {
    const qr = (qrOverride ?? boxQrInput).trim();
    if (!qr) {
      toast.error("Vui lòng nhập/quét mã QR thùng.");
      return;
    }
    try {
      const box = await triggerBoxByQr(qr).unwrap();
      if (warehouseId > 0 && box.warehouseId && box.warehouseId !== warehouseId) {
        toast.error("Thùng không thuộc kho đã chọn.");
        return;
      }
      if (warehouseId <= 0 && box.warehouseId && box.warehouseId > 0) {
        setWarehouseId(box.warehouseId);
      }

      let isDuplicate = false;
      setSpotBoxes((prev) => {
        if (prev.some((it) => it.id === box.id)) {
          isDuplicate = true;
          return prev;
        }
        return [
          ...prev,
          {
            id: box.id,
            boxCode: box.boxCode,
            qrCode: box.qrCode,
            warehouseId: box.warehouseId,
          },
        ];
      });

      if (isDuplicate) {
        toast("Thùng này đã có trong danh sách.");
      } else {
        toast.success(`Đã thêm thùng ${box.boxCode}`);
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không tìm thấy thùng theo QR.";
      toast.error(msg);
    }
  };

  const handleSpotQrFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const loading = toast.loading("Đang đọc QR từ ảnh...");
    try {
      const text = await decodeQrFromImageFile(file);
      if (!text) {
        toast.error("Không tìm thấy QR trong ảnh.", { id: loading });
        return;
      }
      setBoxQrInput(text);
      await handleAddSpotBoxByQr(text);
      toast.success("Đã đọc QR từ ảnh.", { id: loading });
    } catch {
      toast.error("Không đọc được QR từ ảnh.", { id: loading });
    }
  };

  const handleSubmit = async () => {
    if (warehouseId <= 0) {
      toast.error("Vui lòng chọn kho");
      return;
    }
    if (checkType === CHECK_TYPE.Cycle && zoneId <= 0 && rackId <= 0 && slotId <= 0) {
      toast.error("Kiểm kê theo chu kỳ cần chọn phạm vi: Khu hoặc Dãy kệ hoặc Ô kệ.");
      return;
    }

    const boxIds = checkType === CHECK_TYPE.Spot ? effectiveSpotIds : null;

    if (checkType === CHECK_TYPE.Spot && (!boxIds || boxIds.length === 0)) {
      toast.error("Kiểm kê đột xuất cần danh sách ID thùng (cách nhau bởi dấu ,)");
      return;
    }

    try {
      const res = await createStockCheck({
        warehouseId,
        checkType,
        boxIds,
        zoneId: checkType === CHECK_TYPE.Cycle ? (zoneId > 0 ? zoneId : null) : null,
        rackId: checkType === CHECK_TYPE.Cycle ? (rackId > 0 ? rackId : null) : null,
        slotId: checkType === CHECK_TYPE.Cycle ? (slotId > 0 ? slotId : null) : null,
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
          Tạo phiếu kiểm kê (Nhân viên kho)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Toàn phần: tất cả thùng trong kho. Theo chu kỳ: kiểm kê theo phạm vi khu/kệ/ô. Đột xuất: tự chọn danh sách thùng.
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
                onChange={(e) => {
                  const nextWarehouseId = Number(e.target.value);
                  setWarehouseId(nextWarehouseId);
                  setZoneId(0);
                  setRackId(0);
                  setSlotId(0);
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value={0}>Chọn kho...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.titleWarehouse === "Cold" ? "Kho lạnh" : "Kho thường"})
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
                onChange={(e) => {
                  const nextType = Number(e.target.value);
                  setCheckType(nextType);
                  if (nextType !== CHECK_TYPE.Cycle) {
                    setZoneId(0);
                    setRackId(0);
                    setSlotId(0);
                  }
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value={CHECK_TYPE.Full}>Toàn phần</option>
                <option value={CHECK_TYPE.Cycle}>Theo chu kỳ</option>
                <option value={CHECK_TYPE.Spot}>Đột xuất</option>
              </select>
            </div>

            {isCycle ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                <div className="text-sm font-medium text-slate-800">
                  Phạm vi kiểm kê theo chu kỳ
                </div>
                <p className="text-xs text-slate-500">
                  Chọn một trong các mức: Khu, Dãy kệ hoặc Ô kệ. Nếu chọn ô kệ, hệ thống chỉ kiểm kê các thùng trong ô đó.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Khu</label>
                    <select
                      value={zoneId}
                      onChange={(e) => {
                        const nextZoneId = Number(e.target.value);
                        setZoneId(nextZoneId);
                        setRackId(0);
                        setSlotId(0);
                      }}
                      disabled={warehouseId <= 0}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100"
                    >
                      <option value={0}>-- Chọn khu --</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Dãy kệ</label>
                    <select
                      value={rackId}
                      onChange={(e) => {
                        const nextRackId = Number(e.target.value);
                        setRackId(nextRackId);
                        setSlotId(0);
                      }}
                      disabled={zoneId <= 0}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100"
                    >
                      <option value={0}>-- Chọn dãy kệ --</option>
                      {racks.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Ô kệ</label>
                    <select
                      value={slotId}
                      onChange={(e) => setSlotId(Number(e.target.value))}
                      disabled={rackId <= 0}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100"
                    >
                      <option value={0}>-- Chọn ô kệ --</option>
                      {slots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {checkType === CHECK_TYPE.Spot ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-medium text-slate-800 inline-flex items-center gap-2">
                    <QrCode size={16} />
                    Quét QR để thêm thùng vào kiểm kê đột xuất
                  </div>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={boxQrInput}
                      onChange={(e) => setBoxQrInput(e.target.value)}
                      placeholder="Dán hoặc quét mã QR thùng"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddSpotBoxByQr()}
                      disabled={isFindingBoxByQr}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    >
                      {isFindingBoxByQr ? <Loader2 size={14} className="animate-spin" /> : null}
                      Thêm thùng
                    </button>
                    <button
                      type="button"
                      onClick={() => boxQrImageRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ImageUp size={14} />
                      Ảnh QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBoxQrCameraOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Camera size={14} />
                      Máy ảnh
                    </button>
                    <input
                      ref={boxQrImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSpotQrFromImage}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Mỗi lần quét sẽ tự thêm 1 thùng vào danh sách.
                  </p>
                </div>

                {spotBoxes.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-sm font-medium text-slate-800">
                      Đã thêm từ QR: {spotBoxes.length} thùng
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {spotBoxes.map((box) => (
                        <span
                          key={box.id}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                        >
                          {box.boxCode} (ID: {box.id})
                          <button
                            type="button"
                            onClick={() =>
                              setSpotBoxes((prev) => prev.filter((it) => it.id !== box.id))
                            }
                            className="inline-flex items-center justify-center rounded-full text-slate-500 hover:text-rose-600"
                            aria-label={`Xoá ${box.boxCode}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="text-sm font-medium text-slate-800">
                    ID thùng nhập tay (tuỳ chọn, cách nhau bởi dấu `,`)
                  </label>
                  <input
                    type="text"
                    value={boxIdsText}
                    onChange={(e) => setBoxIdsText(e.target.value)}
                    placeholder="vd: 12, 13, 14"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Hệ thống sẽ gộp danh sách quét QR và danh sách nhập tay (không trùng ID).
                  </p>
                </div>

                <div className="text-xs text-slate-600">
                  Tổng thùng sẽ kiểm kê đột xuất:{" "}
                  <span className="font-semibold text-slate-900">{effectiveSpotIds.length}</span>
                </div>
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

      <QrCameraScannerModal
        open={isBoxQrCameraOpen}
        title="Quét QR thùng kiểm kê đột xuất"
        onClose={() => setIsBoxQrCameraOpen(false)}
        onDetected={(value) => {
          setBoxQrInput(value);
          void handleAddSpotBoxByQr(value);
        }}
      />
    </div>
  );
}

