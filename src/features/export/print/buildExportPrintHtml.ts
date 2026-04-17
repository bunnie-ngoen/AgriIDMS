import type { ExportPrintData } from "../schemas/export.schema";

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatVnDate(input: string): string {
  const dt = new Date(input);
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `Ngày ${day} tháng ${month} năm ${year}`;
}

function formatNumber(value: number): string {
  return Number(value).toLocaleString("vi-VN");
}

function formatCurrency(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return "";
  return formatNumber(value);
}

function getBoxCodeSuffix(boxCode: string): string {
  const match = boxCode.match(/-(\d+)$/);
  return match ? match[1] : boxCode;
}

function padRows(rowsHtml: string[], minRows = 5): string {
  if (rowsHtml.length >= minRows) return rowsHtml.join("");
  const padded = [...rowsHtml];
  while (padded.length < minRows) {
    padded.push(`
      <tr>
        <td class="border border-black p-1 text-center">&nbsp;</td>
        <td class="border border-black p-1">&nbsp;</td>
        <td class="border border-black p-1 text-center">&nbsp;</td>
        <td class="border border-black p-1 text-center">&nbsp;</td>
        <td class="border border-black p-1 text-center">&nbsp;</td>
        <td class="border border-black p-1 text-right">&nbsp;</td>
        <td class="border border-black p-1 text-right">&nbsp;</td>
        <td class="border border-black p-1 text-right">&nbsp;</td>
      </tr>`);
  }
  return padded.join("");
}

/** In theo mẫu 02-VT: field backend chưa có thì để trống. */
export function buildExportPrintHtml(d: ExportPrintData): string {
  const dotted = ".......................................";
  const printDate = formatVnDate(d.snapshotAtUtc);
  const totalStr = formatNumber(d.totalAmount);
  const rows = d.lines.map((x) => {
    const itemName = escHtml(x.productName);
    const itemCode = escHtml(getBoxCodeSuffix(x.boxCode));
    const unit = "kg";
    const requestedQty = formatNumber(x.requestedQuantity ?? x.actualQuantity);
    const actualQty = formatNumber(x.actualQuantity);
    const unitPrice = formatCurrency(x.unitPrice);
    const lineAmount = formatCurrency(x.lineAmount);
    return `
      <tr>
        <td class="border border-black p-1 text-center">${x.lineNo}</td>
        <td class="border border-black p-1 item-cell">${itemName}</td>
        <td class="border border-black p-1 text-center code-cell">${itemCode}</td>
        <td class="border border-black p-1 text-center">${unit}</td>
        <td class="border border-black p-1 text-center">${requestedQty}</td>
        <td class="border border-black p-1 text-right">${actualQty}</td>
        <td class="border border-black p-1 text-right">${unitPrice}</td>
        <td class="border border-black p-1 text-right">${lineAmount}</td>
      </tr>`;
  });

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Phiếu xuất kho — ${escHtml(d.exportCode)}</title>
    <style>
      body { font-family: "Times New Roman", serif; font-size: 16px; color: #111; margin: 0; }
      .page { width: 190mm; margin: 0 auto; background: #fff; padding: 8mm 10mm; box-sizing: border-box; }
      .center { text-align: center; }
      .right { text-align: right; }
      .small { font-size: 14px; }
      .xs { font-size: 13px; }
      .mt8 { margin-top: 6px; }
      .mt12 { margin-top: 10px; }
      .mt20 { margin-top: 14px; }
      .mt28 { margin-top: 20px; }
      .w100 { width: 100%; border-collapse: collapse; table-layout: fixed; box-sizing: border-box; }
      .border { border: 1px solid #111; }
      .border-black { border-color: #111; }
      .p-1 { padding: 3px 4px; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      th, td { vertical-align: middle; line-height: 1.2; }
      .voucher-table th { vertical-align: middle; padding-top: 2px; padding-bottom: 2px; }
      .voucher-table td { vertical-align: middle; padding-top: 2px; padding-bottom: 2px; }
      .voucher-table { width: calc(100% - 1px); margin-right: 1px; border: 1px solid #111; border-right: 1px solid #111; }
      .voucher-table th:last-child, .voucher-table td:last-child { border-right: 1px solid #111 !important; }
      .item-col { width: 37%; }
      .code-col { width: 12%; }
      .unit-col { width: 7%; }
      .qty-col { width: 8%; }
      .price-col { width: 9.5%; }
      .amount-col { width: 10.5%; }
      .item-cell { white-space: normal; word-break: break-word; }
      .code-cell { white-space: normal; word-break: break-word; overflow-wrap: anywhere; }
      .voucher-table .item-cell,
      .voucher-table .code-cell { vertical-align: top; }
      .voucher-table .total-row td {
        vertical-align: middle;
        padding: 0;
        height: 28px;
      }
      .total-cell {
        height: 28px;
        line-height: 28px;
        text-align: center;
        display: block;
        font-weight: 700;
      }
      .total-cell-right {
        text-align: right;
        padding-right: 6px;
      }
      /* Khi xuất PDF qua html2canvas: nới line-height/padding để tránh lệch baseline chữ trong ô. */
      .pdf-export-mode .voucher-table th,
      .pdf-export-mode .voucher-table td {
        line-height: 1.35;
        padding-top: 3px;
        padding-bottom: 3px;
      }
      .pdf-export-mode .voucher-table .xs td {
        line-height: 1.2;
      }
      /* Ép cứng canh giữa dòng Cộng khi render PDF bằng html2canvas */
      .pdf-export-mode .voucher-table .total-row td {
        height: 28px;
        padding: 0 !important;
        vertical-align: middle !important;
      }
      .pdf-export-mode .total-cell {
        height: 28px;
        line-height: 28px;
      }
      .sign td { vertical-align: top; text-align: center; width: 25%; padding-top: 8px; }
      .sign-space { height: 80px; }
      .sign td { border: none !important; }
      @media print {
        @page { size: A4 portrait; margin: 10mm; }
        body { margin: 0; }
        .page { width: auto; padding: 0; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="right">
        <div><strong>Mẫu số: 02 - VT</strong></div>
        <div class="small"><em>(Kèm theo Thông tư số 99/2025/TT-BTC)</em></div>
      </div>

      <h1 class="center mt20" style="font-size: 26px; margin-bottom: 0;">PHIẾU XUẤT KHO</h1>
      <div class="center mt8"><em>${escHtml(printDate)}</em></div>

      <div class="mt20">- Họ và tên người nhận hàng: ${escHtml(d.recipientFullName)} (${escHtml(d.recipientPhone)})</div>
      <div class="mt8">- Lý do xuất kho: ${dotted}</div>
      <div class="mt8">- Xuất tại kho: ${dotted}</div>
      <div class="mt8">- Địa điểm: ${dotted}</div>

      <table class="w100 mt12 voucher-table">
        <colgroup>
          <col style="width: 8%;" />
          <col class="item-col" />
          <col class="code-col" />
          <col class="unit-col" />
          <col class="qty-col" />
          <col class="qty-col" />
          <col class="price-col" />
          <col class="amount-col" />
        </colgroup>
        <thead>
          <tr>
            <th class="border border-black p-1" rowspan="2">STT</th>
            <th class="border border-black p-1" rowspan="2">Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hóa</th>
            <th class="border border-black p-1" rowspan="2">Mã số</th>
            <th class="border border-black p-1" rowspan="2">Đơn vị tính</th>
            <th class="border border-black p-1 center" colspan="2">Số lượng</th>
            <th class="border border-black p-1" rowspan="2">Đơn giá</th>
            <th class="border border-black p-1" rowspan="2">Thành tiền</th>
          </tr>
          <tr>
            <th class="border border-black p-1">Yêu cầu</th>
            <th class="border border-black p-1">Thực xuất</th>
          </tr>
        </thead>
        <tbody>
          ${padRows(rows)}
          <tr class="total-row">
            <td class="border border-black" colspan="2"><div class="total-cell">Cộng</div></td>
            <td class="border border-black"><div class="total-cell">x</div></td>
            <td class="border border-black"><div class="total-cell">x</div></td>
            <td class="border border-black"><div class="total-cell">x</div></td>
            <td class="border border-black"><div class="total-cell">x</div></td>
            <td class="border border-black"><div class="total-cell">x</div></td>
            <td class="border border-black"><div class="total-cell total-cell-right">${totalStr}</div></td>
          </tr>
        </tbody>
      </table>

      <div class="mt8">- Tổng số tiền (viết bằng chữ): ${dotted}</div>

      <div class="right mt28"><em>${escHtml(printDate)}</em></div>
      <table class="w100 sign mt8" style="border: none;">
        <tr>
          <td><strong>Người lập phiếu</strong><br/><em>(Ký, họ tên)</em></td>
          <td><strong>Người nhận hàng</strong><br/><em>(Ký, họ tên)</em></td>
          <td><strong>Quản lí</strong><br/><em>(Ký, họ tên)</em></td>
          <td><strong>Giám đốc</strong><br/><em>(Ký, họ tên)</em></td>
        </tr>
        <tr>
          <td class="sign-space">&nbsp;</td>
          <td class="sign-space">&nbsp;</td>
          <td class="sign-space">&nbsp;</td>
          <td class="sign-space">&nbsp;</td>
        </tr>
      </table>
    </main>
  </body>
</html>`;
}
