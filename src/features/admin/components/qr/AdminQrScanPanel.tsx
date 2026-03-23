import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layers,
  Box,
  QrCode,
  Upload,
  Camera,
  Search,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { decodeQrFromImageFile } from "../../../../shared/lib/decodeQrFromImage";
import {
  useLazyGetBoxByQrQuery,
  useLazyGetLotByQrQuery,
  useLazyGetSlotByQrQuery,
} from "../../../goods-receipt/api/goods-receipt.api";
import { useGetSlotContentsQuery } from "../../api/create-user.api";

type ScanMode = "lot" | "box" | "slot";

function formatDateVi(input: string | Date | undefined | null): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function AdminQrScanPanel() {
  const [mode, setMode] = useState<ScanMode>("lot");
  const [qrInput, setQrInput] = useState("");
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [slotBoxDetail, setSlotBoxDetail] = useState<any>(null);
  const [isLoadingSlotBoxDetail, setIsLoadingSlotBoxDetail] = useState(false);

  const [triggerLot, lotState] = useLazyGetLotByQrQuery();
  const [triggerBox, boxState] = useLazyGetBoxByQrQuery();
  const [triggerSlot, slotState] = useLazyGetSlotByQrQuery();

  const { data: slotContents, isFetching: isFetchingSlotContents } =
    useGetSlotContentsQuery(activeSlotId ?? 0, {
      skip: activeSlotId == null,
    });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mode !== "slot") return;
    const slotId = slotState.data?.id;
    if (slotId) setActiveSlotId(slotId);
    setSlotBoxDetail(null);
  }, [mode, slotState.data?.id]);

  useEffect(() => {
    // đổi mode thì xóa chi tiết slot cũ để tránh hiển thị sai
    if (mode !== "slot") {
      setActiveSlotId(null);
      setSlotBoxDetail(null);
    }
  }, [mode]);

  const isAnyFetching =
    mode === "lot"
      ? lotState.isFetching
      : mode === "box"
        ? boxState.isFetching
        : slotState.isFetching;

  const currentResult = useMemo(() => {
    if (mode === "lot") return lotState.data ?? null;
    if (mode === "box") return boxState.data ?? null;
    return slotState.data ?? null;
  }, [mode, lotState.data, boxState.data, slotState.data]);

  const runScan = async (payload: string) => {
    const trimmed = payload.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập hoặc chọn ảnh có mã QR.");
      return;
    }

    try {
      if (mode === "lot") {
      setActiveSlotId(null);
        await triggerLot(trimmed).unwrap();
        toast.success("Đã tra cứu Lot.");
        return;
      }

      if (mode === "box") {
        setActiveSlotId(null);
        await triggerBox(trimmed).unwrap();
        toast.success("Đã tra cứu Box.");
        return;
      }

      setActiveSlotId(null);
      await triggerSlot(trimmed).unwrap();
      toast.success("Đã tra cứu Slot.");
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không tìm thấy dữ liệu theo QR.";
      toast.error(msg);
    }
  };

  const onPickFile = async (file: File) => {
    const t = toast.loading("Đang đọc QR từ ảnh...");
    try {
      const decoded = await decodeQrFromImageFile(file);
      if (!decoded) {
        toast.error("Không đọc được QR từ ảnh.", { id: t });
        return;
      }

      setQrInput(decoded);
      toast.success("Đã đọc QR.", { id: t });
      await runScan(decoded);
    } catch (e) {
      toast.error("Đọc QR từ ảnh thất bại.", { id: t });
    }
  };

  const handleClickBoxInSlot = async (box: any) => {
    const payload = (box?.qrCode ?? box?.boxCode ?? "").toString().trim();
    if (!payload) {
      toast.error("Box không có QR để tra cứu.");
      return;
    }

    setIsLoadingSlotBoxDetail(true);
    setSlotBoxDetail(null);
    try {
      const detail = await triggerBox(payload).unwrap();
      setSlotBoxDetail(detail);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không tìm thấy box theo QR.";
      toast.error(msg);
      setSlotBoxDetail(null);
    } finally {
      setIsLoadingSlotBoxDetail(false);
    }
  };

  const renderResult = () => {
    if (isAnyFetching) {
      return (
        <div className="mt-2 rounded-lg border border-slate-700 bg-[#1f2d3a] p-3 text-slate-200">
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Đang tra cứu...
          </div>
        </div>
      );
    }

    if (!currentResult) {
      return (
        <div className="mt-2 rounded-lg border border-slate-700 bg-[#1f2d3a] p-3 text-slate-400">
          Chưa có dữ liệu. Quét QR để hiển thị chi tiết.
        </div>
      );
    }

    if (mode === "lot") {
      const lot = currentResult as any;
      return (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">
                LOT: {lot.lotCode ?? "—"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Mã: {lot.id ?? "—"} · Trạng thái: {lot.status ?? "—"}
              </div>
            </div>
            {lot.qrImageUrl ? (
              <img
                src={String(lot.qrImageUrl)}
                alt="QR lot"
                className="h-12 w-12 rounded border border-slate-200 object-contain bg-white"
              />
            ) : null}
          </div>

          <div className="mt-2 text-xs text-slate-700 space-y-1">
            <div>HSD: {formatDateVi(lot.expiryDate)}</div>
            <div>Ngày nhập: {formatDateVi(lot.receivedDate)}</div>
            <div>
              Khối lượng: {lot.totalQuantity ?? 0} · Còn:{" "}
              {lot.remainingQuantity ?? 0}
            </div>
            <div>
              Sản phẩm: {lot.productName ?? "—"} · Biến thể:{" "}
              {lot.productVariantName ?? "—"}
            </div>
          </div>
        </div>
      );
    }

    if (mode === "box") {
      const box = currentResult as any;
      return (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-sm font-bold text-slate-900">
            BOX: {box.boxCode ?? "—"}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Tình trạng: {box.status ?? "—"}
          </div>

          <div className="mt-2 text-xs text-slate-700 space-y-1">
            <div>Khối lượng (KG): {box.weight ?? 0}</div>
            <div>
              Warehouse: {box.warehouseName ?? box.warehouseId ?? "—"}
            </div>
            <div>
              Code slot: {box.slotCode ?? box.slotId ?? "—"}
            </div>
            <div>
              Lot code: {box.lotCode ?? box.lotId ?? "—"}
            </div>
            <div>
              Sản phẩm: {box.productName ?? "—"} · Biến thể:{" "}
              {box.productVariantName ?? "—"}
            </div>
          </div>

          {box.qrImageUrl ? (
            <div className="mt-3">
              <img
                src={String(box.qrImageUrl)}
                alt="QR box"
                className="h-20 w-20 rounded border border-slate-200 object-contain bg-white"
              />
            </div>
          ) : null}
        </div>
      );
    }

    const slot = currentResult as any;
    return (
      <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
        <div className="text-sm font-bold text-slate-900">
          SLOT: {slot.code ?? slot.qrCode ?? "—"}
        </div>
        <div className="mt-1 text-xs text-slate-600">
          Rack: {slot.rackName ?? slot.rackId ?? "—"}
        </div>

        <div className="mt-2 text-xs text-slate-700 space-y-1">
          <div>KL (kg): {slot.currentCapacity ?? 0}</div>
          <div>Sức chứa (kg): {slot.capacity ?? 0}</div>
        </div>

        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-900">
              Slot đang chứa gì
            </div>
            {isFetchingSlotContents ? (
              <div className="text-xs text-slate-500">Đang tải...</div>
            ) : (
              <div className="text-xs text-slate-500">
                {slotContents?.boxCount ?? 0} box
              </div>
            )}
          </div>

          {slotContents ? (
            <div className="mt-2">
              <div className="text-xs text-slate-700">
                Sản phẩm: {slotContents.productName ?? "—"} · Biến thể:{" "}
                {slotContents.variantName ?? "—"}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Còn sức chứa: {slotContents.remainingCapacity ?? 0}
              </div>

              <div className="mt-2 max-h-40 overflow-y-auto">
                <div className="space-y-1">
                  {slotContents.boxes.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => void handleClickBoxInSlot(b)}
                      className="w-full text-left rounded border border-slate-200 px-2 py-1 hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-xs font-semibold text-slate-900">
                        {b.boxCode}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">
                        Lot: {b.lotCode ?? "—"} · HSD:{" "}
                        {formatDateVi(b.expiryDate)}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Khối lượng: {b.weight ?? 0}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingSlotBoxDetail ? (
                <div className="mt-2 text-xs text-slate-500">
                  Đang tải chi tiết box...
                </div>
              ) : slotBoxDetail ? (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    BOX: {slotBoxDetail.boxCode ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Trạng thái: {slotBoxDetail.status ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Khối lượng: {slotBoxDetail.weight ?? 0} kg
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Warehouse:{" "}
                    {slotBoxDetail.warehouseName ??
                      slotBoxDetail.warehouseId ??
                      "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Code slot:{" "}
                    {slotBoxDetail.slotCode ?? slotBoxDetail.slotId ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Lot: {slotBoxDetail.lotCode ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-700 mt-2">
                    Sản phẩm: {slotBoxDetail.productName ?? "—"} · Biến thể:{" "}
                    {slotBoxDetail.productVariantName ?? "—"}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-xs text-slate-500 mt-2">Chưa có box.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pb-4 pt-3 bg-[#222d32]">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("lot")}
          className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold border ${
            mode === "lot"
              ? "border-sky-400 bg-[#1a2530] text-sky-300"
              : "border-slate-700 bg-[#1f2d3a] text-slate-300 hover:bg-[#1b2225]"
          }`}
        >
          <span className="inline-flex items-center gap-1 justify-center">
            <Layers size={12} /> Lot
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("box")}
          className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold border ${
            mode === "box"
              ? "border-sky-400 bg-[#1a2530] text-sky-300"
              : "border-slate-700 bg-[#1f2d3a] text-slate-300 hover:bg-[#1b2225]"
          }`}
        >
          <span className="inline-flex items-center gap-1 justify-center">
            <Box size={12} /> Box
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("slot")}
          className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold border ${
            mode === "slot"
              ? "border-sky-400 bg-[#1a2530] text-sky-300"
              : "border-slate-700 bg-[#1f2d3a] text-slate-300 hover:bg-[#1b2225]"
          }`}
        >
          <span className="inline-flex items-center gap-1 justify-center">
            <QrCode size={12} /> Slot
          </span>
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Nhập mã QR..."
            className="flex-1 rounded-lg bg-[#1f2d3a] border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") runScan(qrInput);
            }}
          />
          <button
            type="button"
            onClick={() => runScan(qrInput)}
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 text-white px-3 py-2 text-xs font-semibold hover:bg-sky-600"
            title="Tra cứu"
          >
            <Search size={14} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#1f2d3a] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2225]"
          >
            <Upload size={14} />
            Chọn ảnh
          </button>
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#1f2d3a] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2225]"
            title="Chụp ảnh QR"
          >
            <Camera size={14} />
            Chụp ảnh
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickFile(file);
              // reset để lần sau chọn file giống vẫn trigger được
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {renderResult()}
    </div>
  );
}

