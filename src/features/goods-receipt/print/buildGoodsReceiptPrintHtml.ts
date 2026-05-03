import type { GoodsReceiptPrintData } from "../types/goods-receipt.type";
import { parseApiDateInput, VIETNAM_TIME_ZONE } from "../../../shared/lib/vietnamTime";

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateVi(dateInput?: string | null): string {
  if (!dateInput) return "—";
  const d = parseApiDateInput(dateInput);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { timeZone: VIETNAM_TIME_ZONE });
}

function dateLongVi(dateInput?: string | null): string {
  if (!dateInput) return "ngày ... tháng ... năm ...";
  const d = parseApiDateInput(dateInput);
  if (Number.isNaN(d.getTime())) return "ngày ... tháng ... năm ...";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `ngày ${day} tháng ${month} năm ${year}`;
}

export function buildGoodsReceiptPrintHtml(d: GoodsReceiptPrintData): string {
  const received = formatDateVi(d.receivedDate);
  const receivedLong = dateLongVi(d.receivedDate);
  const footerDate = dateLongVi(d.approvedAtUtc ?? d.receivedDate);
  const totalAmountFromLines = d.lines.reduce(
    (sum, x) => sum + Number(x.lineTotal ?? 0),
    0,
  );
  const totalAmount = d.totalAmount ?? totalAmountFromLines;
  const totalReceivedWeight = d.lines.reduce(
    (sum, x) => sum + Number(x.receivedWeightKg ?? 0),
    0,
  );
  const estimatedUnitPrice =
    totalAmount > 0 && totalReceivedWeight > 0
      ? totalAmount / totalReceivedWeight
      : null;
  const amountInWords = d.amountInWords ?? "........................................";

  const bodyRows = d.lines
    .map((x, idx) => {
      const unit = x.unit || "kg";
      const itemCode = x.itemCode || String(x.detailId || idx + 1);
      const lineQty = Number(x.receivedWeightKg ?? 0);
      const unitPrice = x.unitPrice ?? estimatedUnitPrice;
      const lineTotal =
        x.lineTotal ??
        (unitPrice != null && lineQty > 0
          ? unitPrice * lineQty
          : null);
      return `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${escHtml(x.productName)}${x.grade ? ` (${escHtml(x.grade)})` : ""}</td>
        <td class="center">${escHtml(itemCode)}</td>
        <td class="center">${escHtml(unit)}</td>
        <td class="right">${Number(x.orderedWeightKg ?? x.receivedWeightKg ?? 0).toLocaleString("vi-VN")}</td>
        <td class="right">${Number(x.receivedWeightKg ?? 0).toLocaleString("vi-VN")}</td>
        <td class="right">${unitPrice != null ? Number(unitPrice).toLocaleString("vi-VN") : "—"}</td>
        <td class="right">${lineTotal != null ? Number(lineTotal).toLocaleString("vi-VN") : "—"}</td>
      </tr>`;
    })
    .join("");

  const minRows = 6;
  const emptyRows = Math.max(0, minRows - d.lines.length);
  const fillerRows = Array.from({ length: emptyRows })
    .map(
      () => `
      <tr>
        <td class="center">&nbsp;</td>
        <td></td>
        <td class="center"></td>
        <td class="center"></td>
        <td class="right"></td>
        <td class="right"></td>
        <td class="right"></td>
        <td class="right"></td>
      </tr>`,
    )
    .join("");

  const warningBanner = d.printWarningMessage
    ? `<div class="warn"><span class="bold">Lưu ý:</span> ${escHtml(d.printWarningMessage)}</div>`
    : "";

  const sourceWarehouseLine =
    d.sourceWarehouseName || d.sourceWarehouseAddress
      ? `${escHtml(d.sourceWarehouseName || "—")} - Địa điểm: ${escHtml(d.sourceWarehouseAddress || "—")}`
      : `${escHtml(d.warehouseName)} - Địa điểm: ........................................`;

  const reason = d.nonPoReason || "........................................";
  const deliverer = d.supplierName || "........................................";

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Phiếu nhập kho - ${escHtml(d.receiptCode)}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 13px; margin: 0; }
      .page { width: 190mm; margin: 0 auto; padding: 10mm 8mm; background: #fff; }
      .center { text-align: center; }
      .right { text-align: right; }
      .bold { font-weight: 700; }
      .italic { font-style: italic; }
      .small { font-size: 12px; }
      .title { font-size: 30px; font-weight: 700; letter-spacing: 0.4px; margin: 6px 0; text-align: center; }
      .meta-block { text-align: center; line-height: 1.35; margin-bottom: 12px; }
      .meta-row { margin: 8px 0; }
      .bullet { margin: 5px 0; }
      .warn { margin: 10px 0; border: 1px solid #f3c26b; background: #fff4db; padding: 8px; border-radius: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #222; padding: 5px 6px; vertical-align: middle; }
      th { font-weight: 700; }
      .signature { margin-top: 24px; }
      .signature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; }
      .sign-space { height: 58px; }
      @media print {
        @page { size: A4 portrait; margin: 8mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
        .page { padding: 0; width: auto; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="meta-block">
        <div class="bold" style="font-size: 16px;">Mẫu số: 02 - VT</div>
        <div class="italic">(Kèm theo Thông tư số 99/2025/TT-BTC<br/>ngày 27 tháng 10 năm 2025 của Bộ trưởng Bộ Tài chính)</div>
      </div>

      <div class="title">PHIẾU NHẬP KHO</div>
      <div class="center italic small">${receivedLong}</div>

      <div style="margin-top: 14px;">
        <div class="bullet">- Họ và tên người giao hàng: ${escHtml(deliverer)}</div>
        <div class="bullet">- Lý do nhập kho: ${escHtml(reason)}</div>
        <div class="bullet">- Nhập tại kho: ${sourceWarehouseLine}</div>
      </div>

      ${warningBanner}

      <table>
        <thead>
          <tr>
            <th rowspan="2" class="center" style="width: 7%;">STT</th>
            <th rowspan="2" class="center" style="width: 33%;">Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hóa</th>
            <th rowspan="2" class="center" style="width: 8%;">Mã số</th>
            <th rowspan="2" class="center" style="width: 8%;">Đơn vị tính</th>
            <th colspan="2" class="center" style="width: 18%;">Số lượng</th>
            <th rowspan="2" class="center" style="width: 13%;">Đơn giá</th>
            <th rowspan="2" class="center" style="width: 13%;">Thành tiền</th>
          </tr>
          <tr>
            <th class="center">Yêu cầu</th>
            <th class="center">Thực nhập</th>
          </tr>
          <tr>
            <td class="center">A</td>
            <td class="center">B</td>
            <td class="center">C</td>
            <td class="center">D</td>
            <td class="center">1</td>
            <td class="center">2</td>
            <td class="center">3</td>
            <td class="center">4</td>
          </tr>
        </thead>
        <tbody>
          ${bodyRows || ""}
          ${fillerRows}
          <tr>
            <td colspan="2" class="center bold">Cộng</td>
            <td class="center bold">x</td>
            <td class="center bold">x</td>
            <td class="center bold">x</td>
            <td class="center bold">x</td>
            <td class="center bold">x</td>
            <td class="right bold">${totalAmount > 0 ? Number(totalAmount).toLocaleString("vi-VN") : "—"}</td>
          </tr>
        </tbody>
      </table>

      <div class="meta-row">- Tổng số tiền (viết bằng chữ): ${escHtml(amountInWords)}</div>
      <div class="small" style="margin-top: 6px;">
        Mã phiếu: <span class="bold">${escHtml(d.receiptCode)}</span> · Kho nhập: <span class="bold">${escHtml(d.warehouseName)}</span> · Biển số xe: <span class="bold">${escHtml(d.vehicleNumber || "—")}</span> · Ngày nhận: <span class="bold">${escHtml(received)}</span>
      </div>

      <section class="signature">
        <div class="right italic" style="margin-bottom: 4px;">${footerDate}</div>
        <div class="signature-grid">
          <div>
            <div class="bold">Người lập phiếu</div>
            <div class="italic">(Ký, họ tên)</div>
            <div class="sign-space"></div>
          </div>
          <div>
            <div class="bold">Người giao hàng</div>
            <div class="italic">(Ký, họ tên)</div>
            <div class="sign-space"></div>
          </div>
          <div>
            <div class="bold">Quản lí</div>
            <div class="italic">(Ký, họ tên)</div>
            <div class="sign-space"></div>
          </div>
          <div>
            <div class="bold">Giám đốc</div>
            <div class="italic">(Ký, họ tên)</div>
            <div class="sign-space"></div>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

