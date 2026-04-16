import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetGoodsReceiptPrintDataQuery } from "../api/goods-receipt.api";
import { buildGoodsReceiptPrintHtml } from "../print/buildGoodsReceiptPrintHtml";

function printErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "data" in err) {
    const d = (err as { data?: { message?: string } }).data;
    if (d?.message && typeof d.message === "string") return d.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function GoodsReceiptPrintSlipPage() {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("receiptId"));
  const phase = searchParams.get("phase") || undefined;
  const previewRaw = searchParams.get("preview");
  const preview =
    previewRaw == null ? undefined : previewRaw.toLowerCase() === "true";
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const skip = !Number.isFinite(id) || id < 1;
  const { data, isLoading, isError, error } = useGetGoodsReceiptPrintDataQuery(
    { id, phase, preview },
    { skip },
  );
  const html = data ? buildGoodsReceiptPrintHtml(data) : "";

  const handlePrint = () => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.focus();
    w.print();
  };

  if (skip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-700">
        Thiếu tham số{" "}
        <code className="rounded bg-slate-200 px-1">receiptId</code> hợp lệ.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Đang tải phiếu nhập...
      </div>
    );
  }

  if (isError || !html) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-100 p-6 text-center text-red-700">
        <p>{printErrorMessage(error, "Không tải được dữ liệu in phiếu nhập.")}</p>
        <p className="text-sm text-slate-600">
          Đóng tab và thử lại từ màn hình chi tiết phiếu nhập.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700/80 px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Phiếu nhập kho
            </p>
            <p className="text-sm text-slate-200">
              Bấm <span className="font-semibold text-white">In phiếu</span> rồi
              chọn máy in trong hộp thoại.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            In phiếu / Kết nối máy in
          </button>
        </div>
      </header>

      <iframe
        ref={iframeRef}
        title="Phiếu nhập kho"
        srcDoc={html}
        className="h-[calc(100vh-92px)] w-full border-0 bg-slate-100"
      />
    </div>
  );
}

