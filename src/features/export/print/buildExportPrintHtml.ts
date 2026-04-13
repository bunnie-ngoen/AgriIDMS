import type { ExportPrintData } from "../schemas/export.schema";
import { boxTypeLabel } from "../../../shared/lib/boxTypeUi";
import { fulfillmentTypeLabel } from "../../../shared/lib/fulfillmentTypeUi";
import { orderSourceLabel } from "../../../shared/lib/orderSource";
import { orderStatusLabel } from "../../../shared/lib/orderStatusUi";

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function exportReceiptStatusVi(status: string): string {
  if (status === "PendingPick") return "Chờ lấy hàng";
  if (status === "ReadyToExport") return "Sẵn sàng xuất";
  if (status === "Approved") return "Đã duyệt xuất";
  if (status === "Cancelled") return "Đã hủy";
  return status;
}

/** HTML độc lập (iframe srcdoc): Tailwind CDN; thanh nút in do trang React bọc ngoài. */
export function buildExportPrintHtml(d: ExportPrintData): string {
  const created = new Date(d.snapshotAtUtc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const totalStr = Number(d.totalAmount).toLocaleString("vi-VN");
  const stExport = escHtml(exportReceiptStatusVi(d.exportStatus));
  const stOrder = escHtml(orderStatusLabel(d.orderStatus));
  const src = escHtml(orderSourceLabel(d.orderSource));
  const fulfill = escHtml(fulfillmentTypeLabel(d.fulfillmentType));

  const previewBanner = d.isPreview
    ? `<div class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:border-amber-300">
        <span class="font-semibold">Xem trước:</span> Phiếu đang chờ lấy hàng — dữ liệu có thể thay đổi trước khi chốt in.
      </div>`
    : "";

  const rows = d.lines
    .map(
      (x) => `
        <tr class="border-b border-slate-200 bg-white print:border-slate-300">
          <td class="whitespace-nowrap px-3 py-2.5 text-center text-sm text-slate-600">${x.lineNo}</td>
          <td class="px-3 py-2.5 text-sm font-medium text-slate-900">${escHtml(x.boxCode)}</td>
          <td class="max-w-[140px] break-words px-3 py-2.5 text-sm text-slate-700">${escHtml(x.lotCode)}</td>
          <td class="max-w-[220px] break-words px-3 py-2.5 text-sm text-slate-800">${escHtml(x.productName)}</td>
          <td class="whitespace-nowrap px-3 py-2.5 text-center text-sm text-slate-700">${escHtml(x.grade)}</td>
          <td class="whitespace-nowrap px-3 py-2.5 text-right text-sm tabular-nums text-slate-800">${Number(x.boxWeightKg).toLocaleString("vi-VN")}</td>
          <td class="whitespace-nowrap px-3 py-2.5 text-right text-sm font-semibold tabular-nums text-slate-900">${Number(x.actualQuantity).toLocaleString("vi-VN")}</td>
          <td class="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">${escHtml(boxTypeLabel(x.boxType))}</td>
          <td class="px-3 py-2.5 text-center text-sm text-slate-600">${x.isPartial ? "Có" : "—"}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Phiếu xuất kho — ${escHtml(d.exportCode)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] }
          }
        }
      };
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      @media print {
        @page { size: A4 landscape; margin: 10mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body class="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased print:bg-white print:p-0">
    <main class="mx-auto max-w-6xl px-4 py-8 print:max-w-none print:px-4 print:py-4">
      <div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-6 print:border-slate-200">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 print:text-xl">Phiếu xuất kho</h1>
          <p class="mt-1 text-sm text-slate-500">Thời điểm snapshot · <span class="font-medium text-slate-700">${escHtml(created)}</span></p>
        </div>

        <div class="space-y-4 p-6 print:p-4">
          ${previewBanner}

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-5 print:border-slate-300">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Mã phiếu</p>
              <p class="mt-1 text-lg font-bold text-slate-900">${escHtml(d.exportCode)}</p>
              <p class="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Trạng thái phiếu</p>
              <p class="mt-1 inline-flex rounded-lg bg-indigo-100 px-2.5 py-1 text-sm font-semibold text-indigo-800 print:border print:border-indigo-300 print:bg-white">${stExport}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-5 print:border-slate-300">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Đơn hàng</p>
              <p class="mt-1 text-lg font-bold text-slate-900">#${d.orderId}</p>
              <p class="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Đơn · Nguồn · Giao hàng</p>
              <p class="mt-1 text-sm leading-relaxed text-slate-800">${stOrder} <span class="text-slate-400">·</span> ${src} <span class="text-slate-400">·</span> ${fulfill}</p>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:border-slate-300 print:shadow-none">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Người nhận</p>
            <p class="mt-1 text-base font-semibold text-slate-900">${escHtml(d.recipientFullName)} <span class="font-normal text-slate-500">—</span> ${escHtml(d.recipientPhone)}</p>
            <p class="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Địa chỉ giao</p>
            <p class="mt-1 text-sm text-slate-800">${escHtml(d.recipientAddress)}</p>
            <div class="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-100 pt-4 print:border-slate-200">
              <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Tổng tiền đơn (VND)</span>
              <span class="text-xl font-bold tabular-nums text-emerald-700 print:text-slate-900">${totalStr}</span>
            </div>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200 print:border-slate-300">
            <table class="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-100 print:bg-slate-50">
                  <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">STT</th>
                  <th class="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Mã thùng</th>
                  <th class="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Lô</th>
                  <th class="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Sản phẩm</th>
                  <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Phân hạng</th>
                  <th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">KL thùng (kg)</th>
                  <th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">SL xuất</th>
                  <th class="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Loại thùng</th>
                  <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Một phần</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </body>
</html>`;
}
