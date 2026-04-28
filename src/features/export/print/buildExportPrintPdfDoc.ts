import type { TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import type { ExportPrintData } from "../schemas/export.schema";

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

function formatMaSo(item: { maSo?: string; productVariantId?: number | null }): string {
  if (item.maSo && item.maSo.trim() !== "") return item.maSo.trim();
  if (item.productVariantId != null && Number.isFinite(item.productVariantId)) {
    return `PV-${String(item.productVariantId).padStart(4, "0")}`;
  }
  return "N/A";
}

function buildLineRow(
  lineNo: number | string,
  itemName: string,
  itemCode: string,
  unit: string,
  requested: string,
  actual: string,
  unitPrice: string,
  amount: string,
): TableCell[] {
  return [
    { text: String(lineNo), alignment: "center" },
    { text: itemName },
    { text: itemCode, alignment: "center" },
    { text: unit, alignment: "center" },
    { text: requested, alignment: "center" },
    { text: actual, alignment: "right" },
    { text: unitPrice, alignment: "right" },
    { text: amount, alignment: "right" },
  ];
}

export function buildExportPrintPdfDoc(d: ExportPrintData): TDocumentDefinitions {
  const dotted = ".......................................";
  const printDate = formatVnDate(d.snapshotAtUtc);
  const totalStr = formatNumber(d.totalAmount);

  const lineRows: TableCell[][] = d.lines.map((x) => {
    const requestedQty = formatNumber(x.requestedQuantity ?? x.actualQuantity);
    const actualQty = formatNumber(x.actualQuantity);
    const unitPrice = formatCurrency(x.unitPrice);
    const lineAmount = formatCurrency(x.lineAmount);
    return buildLineRow(
      x.lineNo,
      x.productName,
      formatMaSo(x),
      "kg",
      requestedQty,
      actualQty,
      unitPrice,
      lineAmount,
    );
  });

  while (lineRows.length < 5) {
    lineRows.push(buildLineRow("", "", "", "", "", "", "", ""));
  }

  return {
    pageSize: "A4",
    pageMargins: [24, 20, 24, 20],
    defaultStyle: {
      fontSize: 11,
    },
    content: [
      {
        text: "Mẫu số: 02 - VT\n(Kèm theo Thông tư số 99/2025/TT-BTC)",
        alignment: "right",
        bold: true,
        fontSize: 10,
        margin: [0, 0, 0, 8],
      },
      {
        text: "PHIẾU XUẤT KHO",
        alignment: "center",
        bold: true,
        fontSize: 24,
        margin: [0, 0, 0, 2],
      },
      { text: printDate, alignment: "center", italics: true, margin: [0, 0, 0, 10] },
      { text: `- Họ và tên người nhận hàng: ${d.recipientFullName} (${d.recipientPhone})`, margin: [0, 0, 0, 3] },
      { text: `- Lý do xuất kho: ${dotted}`, margin: [0, 0, 0, 3] },
      { text: `- Xuất tại kho: ${dotted}`, margin: [0, 0, 0, 3] },
      { text: `- Địa điểm: ${dotted}`, margin: [0, 0, 0, 6] },
      {
        table: {
          headerRows: 2,
          widths: [28, "*", 48, 34, 32, 32, 44, 56],
          body: [
            [
              { text: "STT", rowSpan: 2, alignment: "center", bold: true, margin: [0, 12, 0, 0] },
              { text: "Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hóa", rowSpan: 2, alignment: "center", bold: true, margin: [0, 4, 0, 0] },
              { text: "Mã số", rowSpan: 2, alignment: "center", bold: true, margin: [0, 12, 0, 0] },
              { text: "Đơn vị tính", rowSpan: 2, alignment: "center", bold: true, margin: [0, 6, 0, 0] },
              { text: "Số lượng", colSpan: 2, alignment: "center", bold: true },
              {},
              { text: "Đơn giá", rowSpan: 2, alignment: "center", bold: true, margin: [0, 12, 0, 0] },
              { text: "Thành tiền", rowSpan: 2, alignment: "center", bold: true, margin: [0, 12, 0, 0] },
            ],
            [{}, {}, {}, {}, { text: "Yêu cầu", alignment: "center", bold: true }, { text: "Thực xuất", alignment: "center", bold: true }, {}, {}],
            ...lineRows,
            [
              { text: "Cộng", colSpan: 2, alignment: "center", bold: true },
              {},
              { text: "x", alignment: "center", bold: true },
              { text: "x", alignment: "center", bold: true },
              { text: "x", alignment: "center", bold: true },
              { text: "x", alignment: "center", bold: true },
              { text: "x", alignment: "center", bold: true },
              { text: totalStr, alignment: "right", bold: true },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#111",
          vLineColor: () => "#111",
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 6],
      },
      { text: `- Tổng số tiền (viết bằng chữ): ${dotted}`, margin: [0, 0, 0, 14] },
      { text: printDate, alignment: "right", italics: true, margin: [0, 0, 0, 8] },
      {
        table: {
          widths: ["25%", "25%", "25%", "25%"],
          body: [
            [
              { text: "Người lập phiếu\n(Ký, họ tên)", alignment: "center", bold: true },
              { text: "Người nhận hàng\n(Ký, họ tên)", alignment: "center", bold: true },
              { text: "Quản lí\n(Ký, họ tên)", alignment: "center", bold: true },
              { text: "Giám đốc\n(Ký, họ tên)", alignment: "center", bold: true },
            ],
            [{ text: "\n\n\n" }, { text: "\n\n\n" }, { text: "\n\n\n" }, { text: "\n\n\n" }],
          ],
        },
        layout: "noBorders",
      },
    ],
  };
}

