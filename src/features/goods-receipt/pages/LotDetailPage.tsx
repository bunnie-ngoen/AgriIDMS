import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileDown, Loader2, Package, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";
import { useGetLotDetailByIdQuery } from "../api/goods-receipt.api";
import type { LotBoxItem } from "../types/goods-receipt.type";
import { boxStatusLabelVietnam } from "../../../shared/lib/boxStatusUi";

function toVietnameseLotStatus(status: string): string {
  if (status === "Active") return "Đang hoạt động";
  if (status === "Blocked") return "Tạm khóa";
  if (status === "Expired") return "Hết hạn";
  return status;
}

function toStatusTone(status: string): string {
  if (status === "Active") return "text-emerald-600";
  if (status === "Blocked") return "text-amber-600";
  if (status === "Expired") return "text-rose-600";
  return "text-slate-600";
}

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function LotDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const lotId = Number(id);
  const { isManager, isWarehouseStaff } = useRoleGuard();
  const lotBasePath = isWarehouseStaff()
    ? "/warehouse/lots"
    : isManager()
      ? "/manager/lots"
      : "/admin/lots";

  const { data, isLoading, isError, refetch } = useGetLotDetailByIdQuery(lotId, {
    skip: !lotId || Number.isNaN(lotId),
  });

  const boxes = useMemo(() => data?.boxes ?? [], [data?.boxes]);
  const [selectedBox, setSelectedBox] = useState<LotBoxItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(boxes.length / pageSize));
  const pagedBoxes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return boxes.slice(start, start + pageSize);
  }, [boxes, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const exportBoxQrToPdf = (box: LotBoxItem) => {
    const ts = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "-")
      .slice(0, 13);
    const boxCode = box.boxCode || `#${box.boxId}`;
    const fileName = `qr-box-${boxCode}-${ts}.pdf`;
    const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${escHtml(fileName)}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; }
      .sheet {
        min-height: calc(100vh - 24mm);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .title { font-size: 22px; font-weight: 700; margin: 0; }
      .code { font-size: 18px; font-weight: 600; margin: 0; }
      .qr {
        width: 300px;
        height: 300px;
        border: 1px solid #cbd5e1;
        object-fit: contain;
        background: #fff;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <h1 class="title">QR thùng hàng</h1>
      <p class="code">${escHtml(boxCode)}</p>
      ${
        box.qrImageUrl
          ? `<img class="qr" src="${escHtml(box.qrImageUrl)}" alt="QR ${escHtml(boxCode)}" />`
          : `<div class="qr" style="display:flex;align-items:center;justify-content:center;font-size:12px;color:#64748b">Chưa có ảnh QR</div>`
      }
    </div>
    <script>window.onload = () => window.print();</script>
  </body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const printDoc = iframe.contentDocument;
    const printWin = iframe.contentWindow;
    if (!printDoc || !printWin) {
      document.body.removeChild(iframe);
      toast.error("Không thể mở trình in lúc này.");
      return;
    }

    printDoc.open();
    printDoc.write(html);
    printDoc.close();

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    };

    printWin.onafterprint = cleanup;
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 100);
  };

  const exportAllBoxQrsInLot = () => {
    const printableBoxes = boxes.filter((b) => b.qrImageUrl);
    if (printableBoxes.length === 0) {
      toast.error("Lô này chưa có ảnh QR của thùng để in.");
      return;
    }

    const missingCount = boxes.length - printableBoxes.length;
    const ts = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "-")
      .slice(0, 13);
    const fileName = `qr-thung-lo-${data?.lotCode || lotId}-${ts}.pdf`;
    const cards = printableBoxes
      .map((b) => {
        const code = escHtml(b.boxCode || `#${b.boxId}`);
        const src = escHtml(b.qrImageUrl || "");
        return `
          <div class="card">
            <img class="qr" src="${src}" alt="QR ${code}" />
            <p class="code">${code}</p>
          </div>
        `;
      })
      .join("");

    const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${escHtml(fileName)}</title>
    <style>
      @page { size: A4 portrait; margin: 8mm; }
      body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; }
      .head { margin-bottom: 8px; text-align: center; }
      .title { margin: 0; font-size: 16px; font-weight: 700; }
      .subtitle { margin: 2px 0 0; font-size: 12px; color: #334155; }
      .grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6mm 4mm;
      }
      .card {
        border: 1px dashed #cbd5e1;
        border-radius: 4px;
        padding: 3mm 2mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        break-inside: avoid;
      }
      .qr {
        width: 30mm;
        height: 30mm;
        object-fit: contain;
        background: #fff;
      }
      .code {
        margin: 2mm 0 0;
        font-size: 10px;
        font-weight: 600;
        text-align: center;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <div class="head">
      <h1 class="title">QR thùng - Lô ${escHtml(data?.lotCode || String(lotId))}</h1>
      <p class="subtitle">Tổng tem in: ${printableBoxes.length}</p>
    </div>
    <div class="grid">${cards}</div>
    <script>window.onload = () => window.print();</script>
  </body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const printDoc = iframe.contentDocument;
    const printWin = iframe.contentWindow;
    if (!printDoc || !printWin) {
      document.body.removeChild(iframe);
      toast.error("Không thể mở trình in lúc này.");
      return;
    }

    printDoc.open();
    printDoc.write(html);
    printDoc.close();

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    };

    printWin.onafterprint = cleanup;
    setTimeout(() => {
      printWin.focus();
      printWin.print();
      if (missingCount > 0) {
        toast(`Đã bỏ qua ${missingCount} thùng chưa có ảnh QR.`, { icon: "ℹ️" });
      }
    }, 120);
  };

  if (!lotId || Number.isNaN(lotId)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 py-6">
      <div className="w-full max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(lotBasePath)}
              className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Chi tiết lô
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Thông tin lô và danh sách thùng được tạo từ lô này.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-14 flex justify-center">
            <Loader2 size={32} className="animate-spin text-slate-400" />
          </div>
        ) : isError || !data ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-10 px-6">
            <p className="text-sm text-rose-600">Không tải được chi tiết lô.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm text-emerald-700 font-medium hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Mã lô
                </p>
                <p className="text-slate-900 font-semibold mt-1">{data.lotCode}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Sản phẩm / biến thể
                </p>
                <p className="text-slate-900 font-semibold mt-1">
                  {data.productName || "—"}
                </p>
                <p className="text-xs text-slate-500">{data.productVariantName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Kho
                </p>
                <p className="text-slate-900 font-semibold mt-1">{data.warehouseName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Trạng thái
                </p>
                <p className={`font-semibold mt-1 ${toStatusTone(data.status)}`}>
                  {toVietnameseLotStatus(data.status)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Ngày nhập
                </p>
                <p className="text-slate-900 font-semibold mt-1">
                  {data.receivedDate
                    ? new Date(data.receivedDate).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  HSD
                </p>
                <p className="text-slate-900 font-semibold mt-1">
                  {data.expiryDate
                    ? new Date(data.expiryDate).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Còn lại / tổng (kg)
                </p>
                <p className="text-slate-900 font-semibold mt-1">
                  {data.remainingQuantity} / {data.totalQuantity}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Số thùng tạo từ lô
                </p>
                <p className="text-slate-900 font-semibold mt-1">{boxes.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Package size={16} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Danh sách thùng thuộc lô này
                </h2>
                <div className="ml-auto">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportAllBoxQrsInLot}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:border-sky-200"
                    >
                      <FileDown size={14} className="text-sky-600" />
                      In loạt QR thùng của lô
                    </button>
                  </div>
                </div>
              </div>

              {boxes.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-slate-500 text-sm">
                    Chưa có thùng nào được tạo từ lô này.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Mã thùng
                        </th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          KL (kg)
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Trạng thái
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Ô chứa
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          QR
                        </th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Ngày tạo
                        </th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedBoxes.map((b) => (
                        <tr
                          key={b.boxId}
                          className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {b.boxCode}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-700">
                            {b.weight}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {boxStatusLabelVietnam(b.status)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {b.slotCode || "Chưa xếp slot"}
                          </td>
                          <td className="px-5 py-3.5">
                            {b.qrImageUrl ? (
                              <a
                                href={b.qrImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2"
                              >
                                <img
                                  src={b.qrImageUrl}
                                  alt={`QR ${b.boxCode}`}
                                  className="h-9 w-9 rounded border border-slate-200 bg-white object-contain"
                                />
                                <span className="text-xs font-medium text-emerald-700">
                                  Xem QR
                                </span>
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">Chưa có ảnh QR</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {b.createdAt
                              ? new Date(b.createdAt).toLocaleDateString("vi-VN")
                              : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => exportBoxQrToPdf(b)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:border-sky-200"
                              >
                                <FileDown size={14} className="text-sky-600" />
                                In PDF QR
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedBox(b)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {boxes.length > 0 ? (
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Hiển thị{" "}
                    <span className="font-semibold text-slate-700">
                      {(currentPage - 1) * pageSize + 1}
                    </span>
                    {" - "}
                    <span className="font-semibold text-slate-700">
                      {Math.min(currentPage * pageSize, boxes.length)}
                    </span>{" "}
                    / <span className="font-semibold text-slate-700">{boxes.length}</span> thùng
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                    >
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <span className="text-xs text-slate-600">
                      Trang {currentPage}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {selectedBox ? (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Chi tiết thùng
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedBox.boxCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBox(null)}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Mã thùng
                      </p>
                      <p className="mt-1 font-medium text-slate-900">{selectedBox.boxCode}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Trạng thái
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {boxStatusLabelVietnam(selectedBox.status)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Khối lượng (kg)
                      </p>
                      <p className="mt-1 font-medium text-slate-900">{selectedBox.weight}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Ô chứa
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedBox.slotCode || "Chưa xếp slot"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Mã QR
                      </p>
                      <p className="mt-1 font-medium text-slate-900 break-all">
                        {selectedBox.qrCode || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Ngày tạo
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedBox.createdAt
                          ? new Date(selectedBox.createdAt).toLocaleString("vi-VN")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Sản phẩm
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {data.productName || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400">
                        Biến thể
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {data.productVariantName || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    {selectedBox.qrImageUrl ? (
                      <a
                        href={selectedBox.qrImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3"
                      >
                        <img
                          src={selectedBox.qrImageUrl}
                          alt={`QR ${selectedBox.boxCode}`}
                          className="h-24 w-24 rounded border border-slate-200 bg-white object-contain"
                        />
                        <span className="text-sm font-medium text-emerald-700">Mở ảnh QR</span>
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">Thùng chưa có ảnh QR.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
