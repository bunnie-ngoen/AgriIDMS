import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, QrCode, Search, Upload, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { decodeQrFromImageFile } from "../../../../shared/lib/decodeQrFromImage";
import QrCameraScannerModal from "../../../../shared/components/QrCameraScannerModal";
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

export default function AdminHeaderQrMiniScan() {
  const [mode, setMode] = useState<ScanMode>("box");
  const [qrInput, setQrInput] = useState("");
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [slotBoxDetail, setSlotBoxDetail] = useState<any>(null);
  const [isLoadingSlotBoxDetail, setIsLoadingSlotBoxDetail] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isResultPanelOpen, setIsResultPanelOpen] = useState(true);

  const [triggerLot, lotState] = useLazyGetLotByQrQuery();
  const [triggerBox, boxState] = useLazyGetBoxByQrQuery();
  const [triggerSlot, slotState] = useLazyGetSlotByQrQuery();

  const { data: slotContents, isFetching: isFetchingSlotContents } =
    useGetSlotContentsQuery(activeSlotId ?? 0, {
      skip: activeSlotId == null,
    });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // khi vừa scan slot, set slotId để load "slot đang chứa gì"
    if (mode !== "slot") return;
    const slotId = slotState.data?.id;
    setActiveSlotId(slotId ? Number(slotId) : null);
    setSlotBoxDetail(null);
  }, [mode, slotState.data?.id]);

  useEffect(() => {
    // chuyển mode thì xóa slot contents để tránh hiển thị sai
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
      toast.error("Vui lòng nhập mã QR.");
      return;
    }
    setIsResultPanelOpen(true);

    try {
      if (mode === "lot") {
        await triggerLot(trimmed).unwrap();
        toast.success("Đã tra cứu lô.");
        return;
      }
      if (mode === "box") {
        await triggerBox(trimmed).unwrap();
        toast.success("Đã tra cứu thùng.");
        return;
      }
      await triggerSlot(trimmed).unwrap();
      toast.success("Đã tra cứu vị trí.");
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
    } catch {
      toast.error("Đọc QR từ ảnh thất bại.", { id: t });
    }
  };

  const handleClickBoxInSlot = async (box: any) => {
    const payload = (box?.qrCode ?? box?.boxCode ?? "").toString().trim();
    if (!payload) {
      toast.error("Thùng không có QR để tra cứu.");
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
    } finally {
      setIsLoadingSlotBoxDetail(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as ScanMode)}
        className="border border-gray-200 p-2 rounded-lg bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-950"
        title="Chọn loại QR"
      >
        <option value="lot">Lô hàng</option>
        <option value="box">Mặt hàng</option>
        <option value="slot">Vị trí</option>
      </select>

      <div className="flex items-center gap-2">
        <input
          type="text"
          className="border border-gray-200 p-2 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-950 w-[120px] sm:w-[170px] lg:w-[200px]"
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          placeholder="Nhập/quét QR..."
          onKeyDown={(e) => {
            if (e.key === "Enter") runScan(qrInput);
          }}
        />

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white p-2 hover:bg-emerald-700"
          title="Tra cứu"
          onClick={() => runScan(qrInput)}
          disabled={isAnyFetching}
        >
          {isAnyFetching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onPickFile(file);
          }}
        />

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50"
          title="Chọn ảnh có QR"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50"
          title="Quét bằng camera"
          onClick={() => setIsCameraOpen(true)}
        >
          <Camera size={16} />
        </button>
      </div>

      <QrCameraScannerModal
        open={isCameraOpen}
        title="Quét QR bằng camera"
        onClose={() => setIsCameraOpen(false)}
        onDetected={(value) => {
          setQrInput(value);
          void runScan(value);
        }}
      />

      {/* Dropdown kết quả */}
      {isResultPanelOpen && (currentResult || isAnyFetching) ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(360px,92vw)] bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <button
            type="button"
            onClick={() => setIsResultPanelOpen(false)}
            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Đóng"
          >
            <X size={14} />
          </button>
          {isAnyFetching ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 size={16} className="animate-spin" />
              Đang tra cứu...
            </div>
          ) : mode === "lot" ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    LÔ: {(currentResult as any)?.lotCode ?? "—"}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Mã: {(currentResult as any)?.id ?? "—"} · Trạng thái:{" "}
                    {(currentResult as any)?.status ?? "—"}
                  </div>
                </div>
                {Boolean((currentResult as any)?.qrImageUrl) ? (
                  <img
                    src={(currentResult as any)?.qrImageUrl}
                    alt="QR lot"
                    className="h-14 w-14 rounded border object-contain bg-white"
                  />
                ) : (
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded border bg-gray-50">
                    <QrCode size={18} className="text-gray-500" />
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-700 space-y-1">
                <div>HSD: {formatDateVi((currentResult as any)?.expiryDate)}</div>
                <div>Ngày nhập: {formatDateVi((currentResult as any)?.receivedDate)}</div>
                <div>
                  Khối lượng (KG): {(currentResult as any)?.totalQuantity ?? 0} ·{" "}
                  Còn (KG): {(currentResult as any)?.remainingQuantity ?? 0}
                </div>
                <div>
                  Sản phẩm: {(currentResult as any)?.productName ?? "—"} · Biến thể:{" "}
                  {(currentResult as any)?.productVariantName ?? "—"}
                </div>
              </div>
            </div>
          ) : mode === "box" ? (
            <div>
              <div className="text-sm font-semibold text-gray-900">
                THÙNG: {(currentResult as any)?.boxCode ?? "—"}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Trạng thái: {(currentResult as any)?.status ?? "—"}
              </div>
              <div className="mt-2 text-xs text-gray-700 space-y-1">
                <div>Khối lượng (KG): {(currentResult as any)?.weight ?? 0}</div>
                <div>
                  Kho: {(currentResult as any)?.warehouseName ??
                    (currentResult as any)?.warehouseId ??
                    "—"}
                </div>
                <div>
                  Mã vị trí: {(currentResult as any)?.slotCode ?? (currentResult as any)?.slotId ?? "—"}
                </div>
                <div>
                  Mã lô: {(currentResult as any)?.lotCode ?? (currentResult as any)?.lotId ?? "—"}
                </div>
                <div>
                  Sản phẩm: {(currentResult as any)?.productName ?? "—"} · Biến thể:{" "}
                  {(currentResult as any)?.productVariantName ?? "—"}
                </div>
              </div>

              {Boolean((currentResult as any)?.qrImageUrl) ? (
                <div className="mt-2">
                  <img
                    src={(currentResult as any)?.qrImageUrl}
                    alt="QR box"
                    className="h-28 w-28 rounded border object-contain bg-white"
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold text-gray-900">
                VỊ TRÍ: {(currentResult as any)?.code ?? (currentResult as any)?.qrCode ?? "—"}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Kệ:{" "}
                {(currentResult as any)?.rackName ??
                  (currentResult as any)?.rackId ??
                  "—"}
              </div>

              <div className="mt-2 text-xs text-gray-700 space-y-1">
                <div>KL (kg): {(currentResult as any)?.currentCapacity ?? 0}</div>
                <div>Sức chứa (kg): {(currentResult as any)?.capacity ?? 0}</div>
              </div>

              <div className="mt-3 border-t pt-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-gray-900">
                    Vị trí đang chứa gì
                  </div>
                  {isFetchingSlotContents ? (
                    <div className="text-xs text-gray-500">Đang tải...</div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {(slotContents as any)?.boxCount ?? (slotContents as any)?.boxes?.length ?? 0} thùng
                    </div>
                  )}
                </div>

                {slotContents ? (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                    <div className="text-xs text-gray-700">
                      Sản phẩm: {(slotContents as any)?.productName ?? "—"} · Biến thể:{" "}
                      {(slotContents as any)?.variantName ?? "—"}
                    </div>
                    {(slotContents as any)?.boxes?.map((b: any) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => void handleClickBoxInSlot(b)}
                        className="w-full text-left rounded border border-gray-200 px-2 py-1 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-xs font-semibold text-gray-900">
                          {b.boxCode}
                        </div>
                        <div className="text-[11px] text-gray-600 truncate">
                          Lô: {b.lotCode ?? "—"} · HSD: {formatDateVi(b.expiryDate)}
                        </div>
                        <div className="text-[11px] text-gray-600">
                          Khối lượng: {b.weight ?? 0}
                        </div>
                      </button>
                    ))}
                    {(slotContents as any)?.boxes?.length === 0 ? (
                      <div className="text-xs text-gray-500">Chưa có thùng.</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-2">Chưa có nội dung.</div>
                )}

                {slotContents && (slotContents as any)?.boxes?.length > 0 ? (
                  isLoadingSlotBoxDetail ? (
                    <div className="mt-2 text-xs text-gray-500">
                      Đang tải chi tiết thùng...
                    </div>
                  ) : slotBoxDetail ? (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <div className="text-xs font-semibold text-gray-900 truncate">
                        THÙNG: {slotBoxDetail.boxCode ?? "—"}
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        Trạng thái: {slotBoxDetail.status ?? "—"}
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        Khối lượng: {slotBoxDetail.weight ?? 0} kg
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        Kho:{" "}
                        {slotBoxDetail.warehouseName ??
                          slotBoxDetail.warehouseId ??
                          "—"}
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        Mã vị trí:{" "}
                        {slotBoxDetail.slotCode ?? slotBoxDetail.slotId ?? "—"}
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        Lô: {slotBoxDetail.lotCode ?? "—"}
                      </div>
                      <div className="text-[11px] text-gray-700 mt-2">
                        Sản phẩm: {slotBoxDetail.productName ?? "—"} · Biến thể:{" "}
                        {slotBoxDetail.productVariantName ?? "—"}
                      </div>
                    </div>
                  ) : null
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

