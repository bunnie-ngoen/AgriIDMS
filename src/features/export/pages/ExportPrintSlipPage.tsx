import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { useGetExportPrintDataQuery } from "../api/export.api";
import { buildExportPrintHtml } from "../print/buildExportPrintHtml";
import { buildExportPrintPdfDoc } from "../print/buildExportPrintPdfDoc";

const pdfFontsData = pdfFonts as unknown as { pdfMake?: { vfs?: Record<string, string> }; vfs?: Record<string, string> };
const vfs = pdfFontsData?.pdfMake?.vfs ?? pdfFontsData?.vfs;
if (vfs) {
  (pdfMake as unknown as { vfs: Record<string, string> }).vfs = vfs;
}

function printErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "data" in err) {
    const d = (err as { data?: { message?: string } }).data;
    if (d?.message && typeof d.message === "string") return d.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function ExportPrintSlipPage() {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("exportId"));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const skip = !Number.isFinite(id) || id < 1;

  const { data, isLoading, isError, error } = useGetExportPrintDataQuery(id, { skip });
  const html = data ? buildExportPrintHtml(data) : "";

  const handlePrint = () => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.focus();
    w.print();
  };

  const handleSavePdf = async () => {
    if (!data) return;

    try {
      setIsSavingPdf(true);
      const docDefinition = buildExportPrintPdfDoc(data);
      const safeCode = (data?.exportCode ?? `export-${id}`).replace(/[^a-zA-Z0-9-_]/g, "-");
      pdfMake.createPdf(docDefinition).download(`phieu-xuat-${safeCode}.pdf`);
    } catch (e) {
      console.error("Save PDF failed:", e);
      window.alert("Không thể tạo PDF. Vui lòng thử lại.");
    } finally {
      setIsSavingPdf(false);
    }
  };

  if (skip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-700">
        Thiếu tham số <code className="rounded bg-slate-200 px-1">exportId</code> hợp lệ.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Đang tải phiếu xuất…
      </div>
    );
  }

  if (isError || !html) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-100 p-6 text-center text-red-700">
        <p>{printErrorMessage(error, "Không tải được dữ liệu in phiếu.")}</p>
        <p className="text-sm text-slate-600">Đóng tab và thử lại từ màn hình phiếu xuất.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700/80 px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phiếu xuất kho</p>
            <p className="text-sm text-slate-200">
              Bấm <span className="font-semibold text-white">In phiếu</span> rồi chọn máy in trong hộp thoại.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  &#128424;&#65039;
                </span>
                In phiếu / Kết nối máy in
              </button>
              <button
                type="button"
                onClick={handleSavePdf}
                disabled={isSavingPdf}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  &#128190;
                </span>
                {isSavingPdf ? "Đang tạo PDF..." : "Tải PDF"}
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 sm:text-right">
              Hoặc click vào khung phiếu rồi{" "}
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-200">Ctrl</kbd>+
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-200">P</kbd>
            </p>
          </div>
        </div>
      </header>

      <iframe
        ref={iframeRef}
        title="Phiếu xuất kho"
        srcDoc={html}
        className="h-[calc(100vh-140px)] w-full border-0 bg-slate-100"
      />
    </div>
  );
}
