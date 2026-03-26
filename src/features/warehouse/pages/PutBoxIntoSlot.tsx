import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  QrCode,
  Package,
  MapPin,
  ImageUp,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { decodeQrFromImageFile } from "../../../shared/lib/decodeQrFromImage";
import QrCameraScannerModal from "../../../shared/components/QrCameraScannerModal";
import {
  useLazyGetBoxByQrQuery,
  useLazyGetSlotByQrQuery,
  useAssignBoxToSlotMutation,
  useTransferBoxToSlotMutation,
} from "../../goods-receipt/api/goods-receipt.api";
import {
  useGetWarehousesQuery,
  useGetZonesQuery,
  useGetRacksQuery,
  useGetSlotsQuery,
} from "../../admin/api/create-user.api";

export default function PutBoxIntoSlot() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [boxQrInput, setBoxQrInput] = useState("");
  const [slotQrInput, setSlotQrInput] = useState("");

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(0);
  const [selectedZoneId, setSelectedZoneId] = useState<number>(0);
  const [selectedRackId, setSelectedRackId] = useState<number>(0);
  const [selectedSlotId, setSelectedSlotId] = useState<number>(0);

  const boxInputRef = useRef<HTMLInputElement | null>(null);
  const slotInputRef = useRef<HTMLInputElement | null>(null);
  const boxQrFileGalleryRef = useRef<HTMLInputElement | null>(null);
  const slotQrFileGalleryRef = useRef<HTMLInputElement | null>(null);
  const [isBoxCameraOpen, setIsBoxCameraOpen] = useState(false);
  const [isSlotCameraOpen, setIsSlotCameraOpen] = useState(false);

  const [triggerBoxByQr, boxByQr] = useLazyGetBoxByQrQuery();
  const [triggerSlotByQr, slotByQr] = useLazyGetSlotByQrQuery();
  const [assignBoxToSlot, { isLoading: isAssigning }] =
    useAssignBoxToSlotMutation();
  const [transferBoxToSlot, { isLoading: isTransferring }] =
    useTransferBoxToSlotMutation();

  const { data: warehouses = [], isLoading: isLoadingWarehouses } =
    useGetWarehousesQuery();

  const { data: zones = [], isLoading: isLoadingZones } = useGetZonesQuery(
    selectedWarehouseId,
    { skip: !selectedWarehouseId }
  );
  const { data: racks = [], isLoading: isLoadingRacks } = useGetRacksQuery(
    selectedZoneId,
    { skip: !selectedZoneId }
  );
  const { data: slots = [], isLoading: isLoadingSlots } = useGetSlotsQuery(
    selectedRackId,
    { skip: !selectedRackId }
  );

  const box = boxByQr.data;
  const slot = slotByQr.data;

  // Nếu đi từ sơ đồ kho qua (bấm "Chuyển"), tự fill QR box
  useEffect(() => {
    const prefillQr = (searchParams.get("boxQr") || "").trim();

    if (prefillQr) {
      setBoxQrInput(prefillQr);
      triggerBoxByQr(prefillQr)
        .unwrap()
        .then(() => {
          setTimeout(() => slotInputRef.current?.focus(), 50);
        })
        .catch(() => {
          // ignore toast ở đây để user tự xử lý
        });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (box?.warehouseId && box.warehouseId > 0) {
      setSelectedWarehouseId(box.warehouseId);
      setSelectedZoneId(0);
      setSelectedRackId(0);
      setSelectedSlotId(0);
    }
  }, [box?.warehouseId]);

  useEffect(() => {
    if (slot?.rackId && slot.rackId > 0) {
      setSelectedRackId(slot.rackId);
      setSelectedSlotId(slot.id);
    }
  }, [slot?.id, slot?.rackId]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((w) => w.id === selectedWarehouseId),
    [warehouses, selectedWarehouseId]
  );
  const selectedSlot = useMemo(() => {
    if (selectedSlotId > 0) return slots.find((s) => s.id === selectedSlotId);
    return undefined;
  }, [slots, selectedSlotId]);

  const slotCapacity = selectedSlot?.capacity ?? slot?.capacity ?? 0;
  const slotCurrent = selectedSlot?.currentCapacity ?? slot?.currentCapacity ?? 0;
  const slotRemaining = Math.max(0, slotCapacity - slotCurrent);
  const lockWarehouse = Boolean(box?.warehouseId && box.warehouseId > 0);

  const handleLoadBox = async (qrOverride?: string) => {
    const qr = (qrOverride ?? boxQrInput).trim();
    if (!qr) {
      toast.error("Vui lòng quét/nhập QR box hoặc chọn ảnh có mã QR.");
      return;
    }
    try {
      await triggerBoxByQr(qr).unwrap();
      toast.success("Đã tải thông tin box.");
      setTimeout(() => slotInputRef.current?.focus(), 50);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không tìm thấy box theo QR.";
      toast.error(msg);
    }
  };

  const handleBoxQrFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const loading = toast.loading("Đang đọc QR từ ảnh...");
    try {
      const text = await decodeQrFromImageFile(file);
      if (!text) {
        toast.error(
          "Không tìm thấy mã QR trong ảnh. Thử ảnh rõ hơn, đủ sáng hoặc crop sát mã QR.",
          { id: loading },
        );
        return;
      }
      setBoxQrInput(text);
      await triggerBoxByQr(text).unwrap();
      toast.success("Đã tải thông tin box từ ảnh.", { id: loading });
      setTimeout(() => slotInputRef.current?.focus(), 50);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không tìm thấy box theo QR trong ảnh.";
      toast.error(msg, { id: loading });
    }
  };

  const handleLoadSlot = async (qrOverride?: string) => {
    const qr = (qrOverride ?? slotQrInput).trim();
    if (!qr) {
      toast.error("Vui lòng quét/nhập QR slot hoặc chọn ảnh có mã QR.");
      return;
    }
    try {
      const loaded = await triggerSlotByQr(qr).unwrap();
      setSelectedSlotId(loaded.id);
      toast.success("Đã tải thông tin slot.");
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không tìm thấy slot theo QR.";
      toast.error(msg);
    }
  };

  const handleSlotQrFromImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const loading = toast.loading("Đang đọc QR từ ảnh...");
    try {
      const text = await decodeQrFromImageFile(file);
      if (!text) {
        toast.error(
          "Không tìm thấy mã QR trong ảnh. Thử ảnh rõ hơn hoặc crop sát mã QR.",
          { id: loading },
        );
        return;
      }
      setSlotQrInput(text);
      const loaded = await triggerSlotByQr(text).unwrap();
      setSelectedSlotId(loaded.id);
      toast.success("Đã tải slot từ ảnh.", { id: loading });
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không tìm thấy slot theo QR trong ảnh.";
      toast.error(msg, { id: loading });
    }
  };

  const handleAssign = async () => {
    const effectiveBoxId = box?.id && box.id > 0 ? box.id : 0;

    if (!effectiveBoxId || effectiveBoxId <= 0) {
      toast.error(
        "Vui lòng tải box bằng QR (máy quét, dán mã, hoặc ảnh có QR).",
      );
      return;
    }
    if (!selectedSlotId || selectedSlotId <= 0) {
      toast.error("Vui lòng chọn slot (quét QR slot hoặc chọn theo danh sách).");
      return;
    }

    const toastId = toast.loading("Đang xếp box vào slot...");
    try {
      const isTransfer =
        box?.id &&
        box.id === effectiveBoxId &&
        box.slotId != null &&
        box.slotId > 0 &&
        box.slotId !== selectedSlotId;

      const res = isTransfer
        ? await transferBoxToSlot({
            boxId: effectiveBoxId,
            toSlotId: selectedSlotId,
          }).unwrap()
        : await assignBoxToSlot({
            boxId: effectiveBoxId,
            slotId: selectedSlotId,
          }).unwrap();
      toast.success(res?.message || "Xếp box vào slot thành công.", {
        id: toastId,
      });

      setBoxQrInput("");
      setSlotQrInput("");
      setSelectedZoneId(0);
      setSelectedRackId(0);
      setSelectedSlotId(0);
      boxInputRef.current?.focus();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Xếp box vào slot thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  const disableAssign =
    isAssigning ||
    isTransferring ||
    !box?.id ||
    selectedSlotId <= 0 ||
    isLoadingWarehouses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-4 mb-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Kho · Xếp box vào slot
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              QR box / slot: máy quét, dán mã, hoặc chọn & chụp ảnh có mã QR. Slot
              có thể chọn thêm theo danh sách kho.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Box scan */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-emerald-700" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Bước 1 · Quét QR box
                </h2>
              </div>
              {boxByQr.isFetching && (
                <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Đang tải...
                </span>
              )}
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    QR box
                  </label>
                  <input
                    ref={boxInputRef}
                    value={boxQrInput}
                    onChange={(e) => setBoxQrInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLoadBox();
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    placeholder="Quét QR trên box (hoặc dán mã QR)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleLoadBox()}
                  disabled={boxByQr.isFetching}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-xs font-semibold text-white px-4 py-2 disabled:opacity-60"
                >
                  <QrCode size={14} />
                  Tải box
                </button>
              </div>

              <input
                ref={boxQrFileGalleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBoxQrFromImage}
              />
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] font-medium text-slate-600 mb-2">
                  Ảnh có mã QR box
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => boxQrFileGalleryRef.current?.click()}
                    disabled={boxByQr.isFetching}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ImageUp size={14} />
                    Chọn ảnh từ máy
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBoxCameraOpen(true)}
                    disabled={boxByQr.isFetching}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <Camera size={14} />
                    Chụp ảnh QR
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Hỗ trợ ảnh chụp tem nhãn / màn hình có QR hoặc quét camera trực tiếp.
                </p>
              </div>

              <QrCameraScannerModal
                open={isBoxCameraOpen}
                title="Quét QR box bằng camera"
                onClose={() => setIsBoxCameraOpen(false)}
                onDetected={(value) => {
                  setBoxQrInput(value);
                  void handleLoadBox(value);
                }}
              />

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm">
                {!box ? (
                  <p className="text-slate-500">
                    Chưa có thông tin box. Vui lòng quét QR.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Box
                      </p>
                      <p className="font-semibold text-slate-900">
                        #{box.id} · {box.boxCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Khối lượng (kg)
                      </p>
                      <p className="font-semibold text-slate-900">
                        {box.weight}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Trạng thái
                      </p>
                      <p className="font-semibold text-slate-900">{box.status}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Slot hiện tại
                      </p>
                      <p className="font-semibold text-slate-900">
                        {box.slotId ? `#${box.slotId}` : "Chưa xếp"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] font-medium text-slate-500">
                        Kho của box
                      </p>
                      <p className="font-semibold text-slate-900">
                        {box.warehouseId
                          ? `#${box.warehouseId}`
                          : "Không xác định"}
                        {selectedWarehouse ? (
                          <span className="text-slate-500 font-medium">
                            {" "}
                            · {selectedWarehouse.name}
                          </span>
                        ) : null}
                      </p>
                      {box.warehouseId &&
                        selectedWarehouseId > 0 &&
                        box.warehouseId !== selectedWarehouseId && (
                          <p className="text-xs text-amber-600 mt-1">
                            Lưu ý: Kho đang chọn không khớp với kho của box. BE
                            sẽ từ chối nếu khác kho.
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Slot select */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-700" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Bước 2 · Chọn slot
                </h2>
              </div>
              {slotByQr.isFetching && (
                <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Đang tải...
                </span>
              )}
            </div>

            <div className="px-6 py-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    QR slot (ưu tiên)
                  </label>
                  <input
                    value={slotQrInput}
                    onChange={(e) => setSlotQrInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLoadSlot();
                      }
                    }}
                    ref={slotInputRef}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    placeholder="Quét QR dán trên slot"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleLoadSlot()}
                  disabled={slotByQr.isFetching}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-xs font-semibold text-white px-4 py-2 disabled:opacity-60"
                >
                  <QrCode size={14} />
                  Tải slot
                </button>
              </div>

              <input
                ref={slotQrFileGalleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSlotQrFromImage}
              />
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] font-medium text-slate-600 mb-2">
                  Ảnh có mã QR slot
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => slotQrFileGalleryRef.current?.click()}
                    disabled={slotByQr.isFetching}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ImageUp size={14} />
                    Chọn ảnh từ máy
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSlotCameraOpen(true)}
                    disabled={slotByQr.isFetching}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <Camera size={14} />
                    Chụp ảnh QR
                  </button>
                </div>
              </div>

              <QrCameraScannerModal
                open={isSlotCameraOpen}
                title="Quét QR slot bằng camera"
                onClose={() => setIsSlotCameraOpen(false)}
                onDetected={(value) => {
                  setSlotQrInput(value);
                  void handleLoadSlot(value);
                }}
              />

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[11px] text-slate-400">hoặc chọn kho</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Kho
                  </label>
                  <select
                    value={selectedWarehouseId || ""}
                    onChange={(e) => {
                      const id = Number(e.target.value || 0);
                      setSelectedWarehouseId(id);
                      setSelectedZoneId(0);
                      setSelectedRackId(0);
                      setSelectedSlotId(0);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    disabled={isLoadingWarehouses || lockWarehouse}
                  >
                    <option value="">
                      {isLoadingWarehouses ? "Đang tải kho..." : "Chọn kho"}
                    </option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        #{w.id} · {w.name}
                      </option>
                    ))}
                  </select>
                  {lockWarehouse && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kho được tự động lấy theo box, không thể đổi kho khi chuyển slot.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Zone
                  </label>
                  <select
                    value={selectedZoneId || ""}
                    onChange={(e) => {
                      const id = Number(e.target.value || 0);
                      setSelectedZoneId(id);
                      setSelectedRackId(0);
                      setSelectedSlotId(0);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    disabled={!selectedWarehouseId || isLoadingZones}
                  >
                    <option value="">
                      {!selectedWarehouseId
                        ? "Chọn kho trước"
                        : isLoadingZones
                          ? "Đang tải zone..."
                          : "Chọn zone"}
                    </option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        #{z.id} · {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Rack
                  </label>
                  <select
                    value={selectedRackId || ""}
                    onChange={(e) => {
                      const id = Number(e.target.value || 0);
                      setSelectedRackId(id);
                      setSelectedSlotId(0);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    disabled={!selectedZoneId || isLoadingRacks}
                  >
                    <option value="">
                      {!selectedZoneId
                        ? "Chọn zone trước"
                        : isLoadingRacks
                          ? "Đang tải rack..."
                          : "Chọn rack"}
                    </option>
                    {racks.map((r) => (
                      <option key={r.id} value={r.id}>
                        #{r.id} · {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Slot
                  </label>
                  <select
                    value={selectedSlotId || ""}
                    onChange={(e) => setSelectedSlotId(Number(e.target.value || 0))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    disabled={!selectedRackId || isLoadingSlots}
                  >
                    <option value="">
                      {!selectedRackId
                        ? "Chọn rack trước"
                        : isLoadingSlots
                          ? "Đang tải slot..."
                          : "Chọn slot"}
                    </option>
                    {slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} · {s.code} · còn{" "}
                        {Math.max(0, s.capacity - s.currentCapacity)} kg
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm">
                {selectedSlotId <= 0 ? (
                  <p className="text-slate-500">
                    Chưa chọn slot. Bạn có thể quét QR slot hoặc chọn theo danh sách.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Slot
                      </p>
                      <p className="font-semibold text-slate-900">
                        #{selectedSlotId} ·{" "}
                        {selectedSlot?.code ?? slot?.code ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Dung lượng trống (kg)
                      </p>
                      <p className="font-semibold text-slate-900">
                        {slotRemaining}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] font-medium text-slate-500">
                        Dung lượng
                      </p>
                      <p className="font-semibold text-slate-900">
                        {slotCurrent} / {slotCapacity} kg
                      </p>
                      {box?.weight != null && box.weight > 0 && slotCapacity > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Box nặng {box.weight} kg ·{" "}
                          {box.weight > slotRemaining ? (
                            <span className="text-rose-600 font-semibold">
                              Slot có thể không đủ dung lượng (BE sẽ kiểm tra).
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">
                              Dung lượng có vẻ đủ.
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Bước 3</span> · Xếp
              box vào slot
            </p>
            <button
              type="button"
              onClick={handleAssign}
              disabled={disableAssign}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white px-5 py-3 disabled:opacity-60"
            >
              {isAssigning && <Loader2 size={16} className="animate-spin" />}
              Xếp vào slot
            </button>
          </div>
          <div className="px-6 pb-5">
            <p className="text-xs text-slate-500">
              Gợi ý: máy quét QR gõ thẳng vào ô (Enter = Tải); ảnh chụp tem nhãn
              dùng nút “Chọn ảnh” / “Chụp ảnh QR”.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

