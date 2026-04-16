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

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function AdminQrScanPanel() {
  const [mode, setMode] = useState<ScanMode>("lot");
  const [qrInput, setQrInput] = useState("");
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [slotBoxDetail, setSlotBoxDetail] = useState<any>(null);
  const [isLoadingSlotBoxDetail, setIsLoadingSlotBoxDetail] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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
        toast.success("Đã tra cứu lô.");
        return;
      }

      if (mode === "box") {
        setActiveSlotId(null);
        await triggerBox(trimmed).unwrap();
        toast.success("Đã tra cứu thùng.");
        return;
      }

      setActiveSlotId(null);
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
    } catch (e) {
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
                LÔ: {lot.lotCode ?? "—"}
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
            THÙNG: {box.boxCode ?? "—"}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Tình trạng: {box.status ?? "—"}
          </div>

          <div className="mt-2 text-xs text-slate-700 space-y-1">
            <div>Khối lượng (KG): {box.weight ?? 0}</div>
            <div>
              Kho: {box.warehouseName ?? box.warehouseId ?? "—"}
            </div>
            <div>
              Mã vị trí: {box.slotCode ?? box.slotId ?? "—"}
            </div>
            <div>
              Mã lô: {box.lotCode ?? box.lotId ?? "—"}
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
          VỊ TRÍ: {slot.code ?? slot.qrCode ?? "—"}
        </div>
        <div className="mt-1 text-xs text-slate-600">
          Kệ: {slot.rackName ?? slot.rackId ?? "—"}
        </div>

        <div className="mt-2 text-xs text-slate-700 space-y-1">
          <div>KL (kg): {slot.currentCapacity ?? 0}</div>
          <div>Sức chứa (kg): {slot.capacity ?? 0}</div>
        </div>

        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-900">
              Vị trí đang chứa gì
            </div>
            {isFetchingSlotContents ? (
              <div className="text-xs text-slate-500">Đang tải...</div>
            ) : (
              <div className="text-xs text-slate-500">
                {slotContents?.boxCount ?? 0} thùng
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
                        Lô: {b.lotCode ?? "—"} · HSD:{" "}
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
                  Đang tải chi tiết thùng...
                </div>
              ) : slotBoxDetail ? (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    THÙNG: {slotBoxDetail.boxCode ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Trạng thái: {slotBoxDetail.status ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Khối lượng: {slotBoxDetail.weight ?? 0} kg
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Kho:{" "}
                    {slotBoxDetail.warehouseName ??
                      slotBoxDetail.warehouseId ??
                      "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Mã vị trí:{" "}
                    {slotBoxDetail.slotCode ?? slotBoxDetail.slotId ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Lô: {slotBoxDetail.lotCode ?? "—"}
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

  const handleExportQrPdf = () => {
    if (!currentResult) {
      toast.error("Chưa có dữ liệu QR để xuất.");
      return;
    }

    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

    let fileBase = "qr";
    let title = "Thông tin QR";
    let qrImageUrl = "";
    let rows: Array<{ label: string; value: string }> = [];

    if (mode === "lot") {
      const lot = currentResult as any;
      fileBase = `qr-lo-${lot.lotCode ?? lot.id ?? "unknown"}`;
      title = "QR Lô hàng";
      qrImageUrl = String(lot.qrImageUrl ?? "");
      rows = [
        { label: "Loại", value: "Lô" },
        { label: "Mã lô", value: lot.lotCode ?? "—" },
        { label: "ID lô", value: lot.id ?? "—" },
        { label: "Mã QR", value: lot.lotCode ?? "—" },
        { label: "Mã thùng", value: "—" },
        { label: "Mã vị trí", value: "—" },
      ];
    } else if (mode === "box") {
      const box = currentResult as any;
      fileBase = `qr-thung-${box.boxCode ?? box.id ?? "unknown"}`;
      title = "QR Thùng";
      qrImageUrl = String(box.qrImageUrl ?? "");
      rows = [
        { label: "Loại", value: "Thùng" },
        { label: "Mã thùng", value: box.boxCode ?? "—" },
        { label: "Mã QR", value: box.qrCode ?? box.boxCode ?? "—" },
        { label: "Mã lô", value: box.lotCode ?? box.lotId ?? "—" },
        { label: "Mã vị trí", value: box.slotCode ?? box.slotId ?? "—" },
      ];
    } else {
      const slot = currentResult as any;
      fileBase = `qr-vi-tri-${slot.code ?? slot.id ?? "unknown"}`;
      title = "QR Vị trí";
      qrImageUrl = String(slot.qrImageUrl ?? "");
      const firstBox = slotContents?.boxes?.[0];
      rows = [
        { label: "Loại", value: "Vị trí (slot)" },
        { label: "Mã vị trí", value: slot.code ?? slot.id ?? "—" },
        { label: "Mã QR", value: slot.qrCode ?? slot.code ?? "—" },
        { label: "Mã thùng (đầu tiên)", value: firstBox?.boxCode ?? "—" },
        { label: "Mã lô (đầu tiên)", value: firstBox?.lotCode ?? "—" },
      ];
    }

    const rowHtml = rows
      .map(
        (r) =>
          `<tr><td class="lbl">${escHtml(r.label)}</td><td class="val">${escHtml(r.value)}</td></tr>`,
      )
      .join("");

    const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${escHtml(fileBase)}-${ts}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: Arial, sans-serif; color: #0f172a; }
      .wrap { border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; }
      h1 { margin: 0 0 12px; font-size: 20px; }
      .grid { display: grid; grid-template-columns: 1fr 180px; gap: 12px; align-items: start; }
      .qr { width: 180px; height: 180px; border: 1px solid #cbd5e1; object-fit: contain; background: white; }
      table { width: 100%; border-collapse: collapse; }
      .lbl, .val { border: 1px solid #e2e8f0; padding: 8px; font-size: 13px; vertical-align: top; }
      .lbl { width: 180px; background: #f8fafc; font-weight: 600; }
      .meta { margin-top: 10px; font-size: 12px; color: #475569; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>${escHtml(title)}</h1>
      <div class="grid">
        <table>${rowHtml}</table>
        ${
          qrImageUrl
            ? `<img class="qr" src="${escHtml(qrImageUrl)}" alt="QR" />`
            : `<div class="qr" style="display:flex;align-items:center;justify-content:center;font-size:12px;color:#64748b">Chưa có ảnh QR</div>`
        }
      </div>
      <div class="meta">Tên PDF gợi ý: ${escHtml(fileBase)}-${ts}.pdf</div>
    </div>
    <script>window.onload = () => window.print();</script>
  </body>
</html>`;

    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!w) {
      toast.error("Trình duyệt đã chặn popup. Vui lòng cho phép mở tab mới.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
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
            <Layers size={12} /> Lô
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
            <Box size={12} /> Thùng
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
            <QrCode size={12} /> Vị trí
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
              setIsCameraOpen(true);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#1f2d3a] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2225]"
            title="Chụp ảnh QR"
          >
            <Camera size={14} />
            Chụp ảnh
          </button>
          <button
            type="button"
            onClick={handleExportQrPdf}
            disabled={!currentResult}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#1f2d3a] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2225] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Xuất PDF QR"
          >
            <QrCode size={14} />
            Xuất PDF QR
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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

      <QrCameraScannerModal
        open={isCameraOpen}
        title="Quét QR bằng camera"
        onClose={() => setIsCameraOpen(false)}
        onDetected={(value) => {
          setQrInput(value);
          void runScan(value);
        }}
      />

      {renderResult()}
    </div>
  );
}

