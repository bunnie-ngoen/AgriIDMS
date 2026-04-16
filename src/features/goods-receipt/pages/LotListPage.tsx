import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, QrCode, Eye, FileDown } from "lucide-react";
import toast from "react-hot-toast";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";
import { useGetAllLotsQuery, useUpdateLotQrImageMutation } from "../api/goods-receipt.api";
import { uploadQrPayloadToCloudinary } from "../../../shared/lib/qrImageCloudinary";

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

export default function LotListPage() {
  const navigate = useNavigate();
  const { isManager, isWarehouseStaff } = useRoleGuard();
  const lotBasePath = isWarehouseStaff()
    ? "/warehouse/lots"
    : isManager()
      ? "/manager/lots"
      : "/admin/lots";

  const { data: lots = [], isLoading, isError, refetch } = useGetAllLotsQuery();
  const [updateLotQrImage] = useUpdateLotQrImageMutation();
  const [, setIsBackfillingQr] = useState(false);
  const attemptedLotIdsRef = useRef<Set<number>>(new Set());
  const backfillInFlightRef = useRef(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Blocked" | "Expired">("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [qrFilter, setQrFilter] = useState<"ALL" | "HAS_QR" | "NO_QR">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const exportLotQrToPdf = (lot: (typeof lots)[number]) => {
    const ts = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "-")
      .slice(0, 13);
    const lotCode = lot.lotCode || `#${lot.lotId}`;
    const fileName = `qr-lo-${lotCode}-${ts}.pdf`;
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
      <h1 class="title">QR lô hàng</h1>
      <p class="code">${escHtml(lotCode)}</p>
      ${
        lot.qrImageUrl
          ? `<img class="qr" src="${escHtml(lot.qrImageUrl)}" alt="QR ${escHtml(
              lot.lotCode || String(lot.lotId),
            )}" />`
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

  const warehouseOptions = useMemo(() => {
    const map = new Map<string, string>();
    lots.forEach((l) => {
      if (!l.warehouseName) return;
      map.set(l.warehouseName, l.warehouseName);
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [lots]);

  const filteredLots = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return lots.filter((l) => {
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
      if (warehouseFilter !== "ALL" && l.warehouseName !== warehouseFilter) return false;
      if (qrFilter === "HAS_QR" && !l.qrImageUrl) return false;
      if (qrFilter === "NO_QR" && !!l.qrImageUrl) return false;

      if (!keyword) return true;
      const haystack = [
        l.lotCode,
        l.productName,
        l.productVariantName,
        l.warehouseName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [lots, searchText, statusFilter, warehouseFilter, qrFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLots.length / pageSize));
  const pagedLots = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLots.slice(start, start + pageSize);
  }, [filteredLots, currentPage, pageSize]);

  useEffect(() => {
    const missingLots = lots
      .filter((l) => l.lotCode && !l.qrImageUrl)
      .filter((l) => !attemptedLotIdsRef.current.has(l.lotId))
      .slice(0, 20);

    if (missingLots.length === 0 || backfillInFlightRef.current) return;

    let cancelled = false;

    const run = async () => {
      backfillInFlightRef.current = true;
      setIsBackfillingQr(true);
      missingLots.forEach((l) => attemptedLotIdsRef.current.add(l.lotId));
      const toastId = "lot-qr-backfill";
      toast.loading(`Đang tự bổ sung ảnh QR cho ${missingLots.length} lot mới...`, {
        id: toastId,
      });

      let success = 0;
      let failed = 0;
      const queue = [...missingLots];
      const concurrency = Math.min(4, queue.length);

      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          while (queue.length > 0) {
            const current = queue.shift();
            if (!current) break;
            try {
              const url = await uploadQrPayloadToCloudinary(current.lotCode, {
                folder: "products/lots",
              });
              await updateLotQrImage({
                lotId: current.lotId,
                qrImageUrl: url,
              }).unwrap();
              success++;
            } catch {
              failed++;
            }
          }
        }),
      );

      if (!cancelled) {
        if (failed === 0) {
          toast.success(`Đã bổ sung QR lot: ${success}/${missingLots.length}.`, {
            id: toastId,
          });
        } else if (success > 0) {
          toast.error(
            `Đã bổ sung QR lot: ${success}/${missingLots.length}. ${failed} lot lỗi.`,
            { id: toastId },
          );
        } else {
          toast.error("Không thể tự bổ sung QR lot lúc này.", { id: toastId });
        }
        await refetch();
      }

      setIsBackfillingQr(false);
      backfillInFlightRef.current = false;
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [lots, updateLotQrImage, refetch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, warehouseFilter, qrFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 py-6">
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <QrCode size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Danh sách lot đã nhập
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Hiển thị lot kèm ảnh QR và lọc nhanh theo kho, trạng thái.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Tìm kiếm
              </label>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Lot code, sản phẩm, biến thể..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Active">Đang hoạt động</option>
                <option value="Blocked">Tạm khóa</option>
                <option value="Expired">Hết hạn</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Kho
              </label>
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value="ALL">Tất cả kho</option>
                {warehouseOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Ảnh QR
              </label>
              <select
                value={qrFilter}
                onChange={(e) => setQrFilter(e.target.value as typeof qrFilter)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value="ALL">Tất cả</option>
                <option value="HAS_QR">Có ảnh QR</option>
                <option value="NO_QR">Chưa có ảnh QR</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-slate-400" />
            </div>
          ) : isError ? (
            <div className="py-6 px-6">
              <p className="text-red-500 text-sm">
                Không tải được danh sách lot.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm text-emerald-700 font-medium hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : filteredLots.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">
              Không có lot nào phù hợp bộ lọc.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Lot
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Sản phẩm / biến thể
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Kho
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ngày nhập / HSD
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      QR
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLots.map((lot) => (
                    <tr key={lot.lotId} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {lot.lotCode}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <p className="font-medium">{lot.productName || "—"}</p>
                        <p className="text-xs text-slate-500">{lot.productVariantName || "—"}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{lot.warehouseName || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <p>{lot.receivedDate ? new Date(lot.receivedDate).toLocaleDateString("vi-VN") : "—"}</p>
                        <p className="text-xs">{lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString("vi-VN") : "—"}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {lot.qrImageUrl ? (
                          <a href={lot.qrImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                            <img
                              src={lot.qrImageUrl}
                              alt={`QR ${lot.lotCode}`}
                              className="h-10 w-10 rounded border border-slate-200 bg-white object-contain"
                            />
                            <span className="text-xs font-medium text-emerald-700">Xem QR</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Chưa có ảnh QR</span>
                        )}
                      </td>
                      <td className={`px-5 py-3.5 font-medium ${toStatusTone(lot.status)}`}>
                        {toVietnameseLotStatus(lot.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => exportLotQrToPdf(lot)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:border-sky-200"
                          >
                            <FileDown size={14} className="text-sky-600" />
                            Xuất PDF QR
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`${lotBasePath}/${lot.lotId}`)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                          >
                            <Eye size={14} className="text-emerald-600" />
                            Xem chi tiết lot
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && !isError && filteredLots.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Hiển thị{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * pageSize + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * pageSize, filteredLots.length)}
                </span>{" "}
                / <span className="font-semibold text-slate-700">{filteredLots.length}</span> lot
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
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
          )}
        </div>
      </div>
    </div>
  );
}
