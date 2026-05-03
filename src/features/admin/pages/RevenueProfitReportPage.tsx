import { useEffect, useMemo, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  revenueReportApi,
  useGetRevenueProfitSpecificReportQuery,
  type RevenueLossByLot,
  type RevenueProfitReportRow,
} from "../api/revenue-report.api";
import { useAppDispatch } from "../../../app/hook";
import { useGetWarehousesQuery } from "../api/create-user.api";
import { useGetProductsQuery } from "../../product/api/product.api";
import { useGetProductVariantsQuery } from "../../product/api/product-variant.api";
import { useGetAllLotsQuery } from "../../goods-receipt/api/goods-receipt.api";
import type { LotListItem } from "../../goods-receipt/types/goods-receipt.type";

type LotProfitAggregateRow = {
  lotId: number;
  lotCode: string;
  supplierName: string;
  warehouseName: string;
  productLabel: string;
  totalKg: number;
  soldKg: number;
  unsoldKg: number;
  disposedKg: number;
  stockAdjustmentLossKg: number;
  revenue: number;
  cost: number;
  profit: number;
};

const aggregateLotProfitRowsFromExports = (
  source: RevenueProfitReportRow[],
  lossByLots: RevenueLossByLot[],
  lotsCatalog: LotListItem[],
): LotProfitAggregateRow[] => {
  const lossByLotId = new Map<number, { disposedKg: number; stockAdjustmentLossKg: number }>();
  const lossByLotCode = new Map<string, { disposedKg: number; stockAdjustmentLossKg: number }>();
  lossByLots.forEach((item) => {
    const payload = {
      disposedKg: Number(item.disposedKg ?? 0),
      stockAdjustmentLossKg: Number(item.stockAdjustmentLossKg ?? 0),
    };
    if (item.lotId > 0) lossByLotId.set(item.lotId, payload);
    if (item.lotCode) lossByLotCode.set(item.lotCode, payload);
  });
  const lotRemainingById = new Map<number, number>();
  const lotRemainingByCode = new Map<string, number>();
  lotsCatalog.forEach((lot) => {
    if (lot.lotId > 0) {
      lotRemainingById.set(lot.lotId, Number(lot.remainingQuantity ?? 0));
    }
    if (lot.lotCode) {
      lotRemainingByCode.set(lot.lotCode, Number(lot.remainingQuantity ?? 0));
    }
  });

  const map = new Map<string, LotProfitAggregateRow>();

  source.forEach((row) => {
    const lotCode = row.lotCode || `LÔ-#${row.boxId}`;
    const lotId = Number(row.lotId ?? 0);
    const lotKey = lotId > 0 ? `ID-${lotId}` : lotCode;
    const productLabel =
      [row.productName?.trim(), row.variantName?.trim()].filter(Boolean).join(" · ") || "—";
    const current = map.get(lotKey);
    if (current) {
      current.totalKg += row.quantityKg;
      current.soldKg += row.quantityKg;
      current.revenue += row.revenue;
      current.cost += row.cost;
      current.profit += row.profit;
      if (current.productLabel === "—" && productLabel !== "—") {
        current.productLabel = productLabel;
      }
    } else {
      const unsoldKg =
        lotId > 0
          ? Number(lotRemainingById.get(lotId) ?? 0)
          : Number(lotRemainingByCode.get(lotCode) ?? 0);
      map.set(lotKey, {
        lotId,
        lotCode,
        supplierName: row.supplierName || "—",
        warehouseName: row.warehouseName || "—",
        productLabel,
        totalKg: row.quantityKg,
        soldKg: row.quantityKg,
        unsoldKg: Math.max(0, unsoldKg),
        disposedKg: Number(
          lotId > 0
            ? lossByLotId.get(lotId)?.disposedKg ?? 0
            : lossByLotCode.get(lotCode)?.disposedKg ?? 0,
        ),
        stockAdjustmentLossKg: Number(
          lotId > 0
            ? lossByLotId.get(lotId)?.stockAdjustmentLossKg ?? 0
            : lossByLotCode.get(lotCode)?.stockAdjustmentLossKg ?? 0,
        ),
        revenue: row.revenue,
        cost: row.cost,
        profit: row.profit,
      });
    }
  });

  for (const lot of lotsCatalog) {
    const lotKey = lot.lotId > 0 ? `ID-${lot.lotId}` : lot.lotCode;
    if (!map.has(lotKey)) {
      const lotId = lot.lotId;
      const lotCode = lot.lotCode;
      map.set(lotKey, {
        lotId,
        lotCode,
        supplierName: "—",
        warehouseName: lot.warehouseName || "—",
        productLabel:
          [lot.productName?.trim(), lot.productVariantName?.trim()].filter(Boolean).join(" · ") ||
          "—",
        totalKg: 0,
        soldKg: 0,
        unsoldKg: Math.max(0, Number(lot.remainingQuantity ?? 0)),
        disposedKg: Number(
          lotId > 0
            ? lossByLotId.get(lotId)?.disposedKg ?? 0
            : lossByLotCode.get(lotCode)?.disposedKg ?? 0,
        ),
        stockAdjustmentLossKg: Number(
          lotId > 0
            ? lossByLotId.get(lotId)?.stockAdjustmentLossKg ?? 0
            : lossByLotCode.get(lotCode)?.stockAdjustmentLossKg ?? 0,
        ),
        revenue: 0,
        cost: 0,
        profit: 0,
      });
    }
  }

  for (const row of map.values()) {
    if (row.productLabel === "—" && row.lotId > 0) {
      const lot = lotsCatalog.find((l) => l.lotId === row.lotId);
      if (lot) {
        row.productLabel =
          [lot.productName?.trim(), lot.productVariantName?.trim()].filter(Boolean).join(" · ") ||
          "—";
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
};

const formatMoney = (value: number) =>
  `${Number(value || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} VNĐ`;

const formatDateTime = (value: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
};

const formatKg = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const toDateKey = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toMonthKey = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Chuỗi `YYYY-MM-DD` từ input type=date — parse theo lịch local (tránh UTC làm lệch ngày khi tính kỳ trước).
 */
const parseFilterDateLocal = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
};

const formatDeltaPercent = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "—";
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return `${pct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
};

const toBucketLabel = (isoDate: string, mode: "day" | "month") => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "Không rõ";
  if (mode === "month") {
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  return d.toLocaleDateString("vi-VN");
};

const downloadRevenueRowsExcel = (rows: RevenueProfitReportRow[], filenameSuffix: string) => {
  if (!rows.length) return false;
  const escape = (v: string | number) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const header = `
      <tr>
        <th>Thời gian xuất</th>
        <th>Phiếu xuất</th>
        <th>Đơn hàng</th>
        <th>Khách hàng</th>
        <th>Nhà cung cấp</th>
        <th>Box</th>
        <th>Lô</th>
        <th>Sản phẩm</th>
        <th>Kg</th>
        <th>Đơn giá bán</th>
        <th>Đơn giá vốn</th>
        <th>Doanh thu</th>
        <th>Giá vốn</th>
        <th>Lợi nhuận</th>
      </tr>`;
  const body = rows
    .map(
      (r) => `
      <tr>
        <td>${escape(formatDateTime(r.exportedAt))}</td>
        <td>${escape(r.exportCode)}</td>
        <td>${escape(`#${r.orderId}`)}</td>
        <td>${escape(r.customerName || "—")}</td>
        <td>${escape(r.supplierName || "—")}</td>
        <td>${escape(r.boxCode || `#${r.boxId}`)}</td>
        <td>${escape(r.lotCode || "—")}</td>
        <td>${escape(
          `${r.productName || "—"}${r.variantName ? ` · ${r.variantName}` : ""}`,
        )}</td>
        <td>${escape(r.quantityKg)}</td>
        <td>${escape(r.saleUnitPrice)}</td>
        <td>${escape(r.costUnitPrice)}</td>
        <td>${escape(r.revenue)}</td>
        <td>${escape(r.cost)}</td>
        <td>${escape(r.profit)}</td>
      </tr>`,
    )
    .join("");

  const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          ${header}
          ${body}
        </table>
      </body>
      </html>`;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `danh-sach-mat-hang-da-ban-${filenameSuffix}-${stamp}.xls`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
};

const RevenueProfitReportPage = () => {
  const dispatch = useAppDispatch();
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>(today);
  const [chartMode, setChartMode] = useState<"day" | "month">("day");
  const [chartDay, setChartDay] = useState<string>(today);
  const [chartMonth, setChartMonth] = useState<string>(today.slice(0, 7));
  const [warehouseId, setWarehouseId] = useState<number | 0>(0);
  const [productId, setProductId] = useState<number | 0>(0);
  const [productVariantId, setProductVariantId] = useState<number | 0>(0);
  const [soldFromDate, setSoldFromDate] = useState<string>("");
  const [soldToDate, setSoldToDate] = useState<string>(today);
  const [soldPage, setSoldPage] = useState<number>(1);
  const [soldPageSize, setSoldPageSize] = useState<number>(50);
  const [openedRevenueModal, setOpenedRevenueModal] = useState<
    "customer" | "supplier" | null
  >(null);
  const [isSoldItemsModalOpen, setIsSoldItemsModalOpen] = useState(false);
  const [isLotProfitModalOpen, setIsLotProfitModalOpen] = useState(false);
  const [lotModalRows, setLotModalRows] = useState<LotProfitAggregateRow[]>([]);
  const [lotModalTotals, setLotModalTotals] = useState<{
    totalDisposedKg: number;
    totalStockAdjustmentLossKg: number;
  } | null>(null);
  const [lotModalLoading, setLotModalLoading] = useState(false);
  const [lotModalPage, setLotModalPage] = useState(1);
  const [lotModalPageSize, setLotModalPageSize] = useState(25);
  const [soldItemsKeyword, setSoldItemsKeyword] = useState("");
  const [soldItemsWarehouseFilter, setSoldItemsWarehouseFilter] = useState("");
  const [activeSection, setActiveSection] = useState<
    "overview" | "chart" | "analysis"
  >("overview");
  const chartDayPickerRef = useRef<HTMLInputElement | null>(null);
  const chartMonthPickerRef = useRef<HTMLInputElement | null>(null);

  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: productVariants = [] } = useGetProductVariantsQuery();
  const { data: allLots = [] } = useGetAllLotsQuery();

  useEffect(() => {
    if (!isLotProfitModalOpen) return;
    let cancelled = false;
    const fetchPageSize = 1000;
    const maxApiPages = 250;

    setLotModalPage(1);
    setLotModalLoading(true);
    setLotModalRows([]);
    setLotModalTotals(null);

    (async () => {
      try {
        const mergedRows: RevenueProfitReportRow[] = [];
        let lossByLots: RevenueLossByLot[] = [];
        let totalDisposedKg = 0;
        let totalStockAdjustmentLossKg = 0;
        let page = 1;
        let totalPages = 1;

        do {
          const res = await dispatch(
            revenueReportApi.endpoints.getRevenueProfitSpecificReport.initiate(
              { page, pageSize: fetchPageSize },
              { forceRefetch: true },
            ),
          ).unwrap();
          if (cancelled) return;
          if (page === 1) {
            lossByLots = res.lossByLots ?? [];
            totalDisposedKg = Number(res.totalDisposedKg ?? 0);
            totalStockAdjustmentLossKg = Number(res.totalStockAdjustmentLossKg ?? 0);
          }
          mergedRows.push(...(res.rows ?? []));
          totalPages = Math.max(1, Number(res.totalPages ?? 1));
          page += 1;
        } while (page <= totalPages && page <= maxApiPages && !cancelled);

        if (cancelled) return;
        const aggregated = aggregateLotProfitRowsFromExports(mergedRows, lossByLots, allLots);
        setLotModalRows(aggregated);
        setLotModalTotals({ totalDisposedKg, totalStockAdjustmentLossKg });
      } catch {
        if (!cancelled) {
          toast.error("Không tải được thống kê lợi nhuận theo lô.");
          setLotModalRows([]);
          setLotModalTotals(null);
        }
      } finally {
        if (!cancelled) setLotModalLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLotProfitModalOpen, dispatch, allLots]);

  const variantsByProduct = useMemo(
    () =>
      productVariants.filter((v) =>
        productId ? Number(v.productId) === Number(productId) : true,
      ),
    [productVariants, productId],
  );

  /** Chỉ phục vụ ô Tổng quan (KPI + so sánh kỳ). */
  const overviewQuery = useMemo(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      warehouseId: warehouseId || undefined,
      productId: productId || undefined,
      productVariantId: productVariantId || undefined,
      page: 1,
      pageSize: 50,
    }),
    [fromDate, toDate, warehouseId, productId, productVariantId],
  );
  const previousPeriodQuery = useMemo(() => {
    if (!fromDate || !toDate) return null;
    const from = parseFilterDateLocal(fromDate);
    const to = parseFilterDateLocal(toDate);
    if (!from || !to || from > to) {
      return null;
    }
    const oneDay = 24 * 60 * 60 * 1000;
    /** Cùng số ngày lịch inclusive với [fromDate, toDate] gửi API (đêm → đêm). */
    const rangeMs = to.getTime() - from.getTime();
    const previousTo = new Date(from.getTime() - oneDay);
    const previousFrom = new Date(previousTo.getTime() - rangeMs);
    return {
      fromDate: toIsoDate(previousFrom),
      toDate: toIsoDate(previousTo),
      warehouseId: warehouseId || undefined,
      productId: productId || undefined,
      productVariantId: productVariantId || undefined,
      page: 1,
      pageSize: 500,
    };
  }, [fromDate, toDate, warehouseId, productId, productVariantId]);

  const overviewResult = useGetRevenueProfitSpecificReportQuery(overviewQuery);
  const overviewData = overviewResult.data;

  /** Biểu đồ + phân tích chi tiết: không áp dụng bộ lọc tổng quan. */
  const broadReportQuery = useMemo(() => ({ page: 1, pageSize: 5000 }), []);
  const broadReportResult = useGetRevenueProfitSpecificReportQuery(broadReportQuery);
  const broadData = broadReportResult.data;
  const chartDataRows = broadData?.rows ?? [];

  const soldListQuery = useMemo(
    () => ({
      fromDate: soldFromDate || undefined,
      toDate: soldToDate || undefined,
      page: soldPage,
      pageSize: soldPageSize,
    }),
    [soldFromDate, soldToDate, soldPage, soldPageSize],
  );
  const soldListResult = useGetRevenueProfitSpecificReportQuery(soldListQuery, {
    skip: !isSoldItemsModalOpen,
  });
  const soldListData = soldListResult.data;
  const soldListFetching = soldListResult.isFetching;
  const previousPeriodResult = useGetRevenueProfitSpecificReportQuery(
    previousPeriodQuery ?? undefined,
    { skip: !previousPeriodQuery },
  );
  const previousData = previousPeriodResult.data;
  const clearSearchFilters = () => {
    setFromDate("");
    setToDate(today);
    setWarehouseId(0);
    setProductId(0);
    setProductVariantId(0);
  };

  const chartRows = useMemo(() => {
    const source = chartDataRows;

    if (chartMode === "day") {
      const selectedDay = chartDay || today;
      const selectedRows = source.filter(
        (row) => toDateKey(row.exportedAt) === selectedDay,
      );
      if (!selectedRows.length) return [];

      const totals = selectedRows.reduce(
        (acc, row) => {
          acc.revenue += row.revenue;
          acc.cost += row.cost;
          acc.profit += row.profit;
          return acc;
        },
        { revenue: 0, cost: 0, profit: 0 },
      );

      return [
        {
          label: toBucketLabel(`${selectedDay}T00:00:00`, "day"),
          revenue: totals.revenue,
          cost: totals.cost,
          profit: totals.profit,
        },
      ];
    }

    const selectedMonth = chartMonth || today.slice(0, 7);
    const selectedRows = source.filter(
      (row) => toMonthKey(row.exportedAt) === selectedMonth,
    );
    if (!selectedRows.length) return [];

    const totals = selectedRows.reduce(
      (acc, row) => {
        acc.revenue += row.revenue;
        acc.cost += row.cost;
        acc.profit += row.profit;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0 },
    );

    return [
      {
        label: toBucketLabel(`${selectedMonth}-01T00:00:00`, "month"),
        revenue: totals.revenue,
        cost: totals.cost,
        profit: totals.profit,
      },
    ];
  }, [chartMode, chartDataRows, chartDay, chartMonth, today]);

  const lotModalTotalPages = Math.max(1, Math.ceil(lotModalRows.length / lotModalPageSize));
  const safeLotModalPage = Math.min(Math.max(1, lotModalPage), lotModalTotalPages);
  const lotModalPageSlice = useMemo(() => {
    const start = (safeLotModalPage - 1) * lotModalPageSize;
    return lotModalRows.slice(start, start + lotModalPageSize);
  }, [lotModalRows, safeLotModalPage, lotModalPageSize]);

  const topBottomProducts = useMemo(() => {
    const source = broadData?.rows ?? [];
    const map = new Map<
      string,
      { label: string; soldKg: number; revenue: number; cost: number; profit: number }
    >();
    source.forEach((row) => {
      const label = `${row.productName || "—"}${row.variantName ? ` · ${row.variantName}` : ""}`;
      const key = `${row.productId ?? 0}-${row.productVariantId ?? 0}-${label}`;
      const current = map.get(key);
      if (current) {
        current.soldKg += row.quantityKg;
        current.revenue += row.revenue;
        current.cost += row.cost;
        current.profit += row.profit;
      } else {
        map.set(key, {
          label,
          soldKg: row.quantityKg,
          revenue: row.revenue,
          cost: row.cost,
          profit: row.profit,
        });
      }
    });
    const rows = Array.from(map.values());
    return {
      top: [...rows].sort((a, b) => b.profit - a.profit).slice(0, 5),
      bottom: [...rows].sort((a, b) => a.profit - b.profit).slice(0, 5),
    };
  }, [broadData?.rows]);

  const filteredSoldRows = useMemo(() => {
    const rows = soldListData?.rows ?? [];
    const keyword = soldItemsKeyword.trim().toLowerCase();
    return rows.filter((r) => {
      const byWarehouse =
        !soldItemsWarehouseFilter || (r.warehouseName || "—") === soldItemsWarehouseFilter;
      if (!byWarehouse) return false;
      if (!keyword) return true;
      const searchable = [
        r.exportCode,
        `#${r.orderId}`,
        r.customerName || "",
        r.supplierName || "",
        r.boxCode || `#${r.boxId}`,
        r.lotCode || "",
        r.productName || "",
        r.variantName || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(keyword);
    });
  }, [soldListData?.rows, soldItemsKeyword, soldItemsWarehouseFilter]);

  const handleExportSoldListExcel = async () => {
    const toastId = toast.loading("Đang chuẩn bị file Excel...");
    try {
      const res = await dispatch(
        revenueReportApi.endpoints.getRevenueProfitSpecificReport.initiate(
          {
            fromDate: soldFromDate || undefined,
            toDate: soldToDate || undefined,
            page: 1,
            pageSize: 10000,
          },
          { forceRefetch: true },
        ),
      ).unwrap();
      const rows = res.rows ?? [];
      if (!downloadRevenueRowsExcel(rows, "tat-ca-trang")) {
        toast.error("Không có dữ liệu để xuất.", { id: toastId });
        return;
      }
      toast.success("Đã tải file Excel.", { id: toastId });
    } catch {
      toast.error("Xuất Excel thất bại.", { id: toastId });
    }
  };

  return (
    <div className="px-5">
      <div className="rounded-[15px] bg-white p-6 shadow-sm">
        <div className="mb-4">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900">
              Báo cáo doanh thu - lợi nhuận
            </h1>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Từ ngày
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Đến ngày
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Kho
              </label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(Number(e.target.value));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                <option value={0}>Tất cả kho</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Sản phẩm
              </label>
              <select
                value={productId}
                onChange={(e) => {
                  const nextProductId = Number(e.target.value);
                  setProductId(nextProductId);
                  setProductVariantId(0);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                <option value={0}>Tất cả sản phẩm</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500">
                    Biến thể
                  </label>
                  <select
                    value={productVariantId}
                    onChange={(e) => {
                      setProductVariantId(Number(e.target.value));
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    <option value={0}>Tất cả biến thể</option>
                    {variantsByProduct.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.productName} · Hạng {v.grade}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={clearSearchFilters}
                  className="mt-[18px] inline-flex h-[38px] items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <X size={14} />
                  Xóa tìm kiếm
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Bộ lọc trên chỉ áp dụng cho khu vực <strong className="font-semibold text-slate-600">Tổng quan</strong> (số liệu
            tổng và so sánh kỳ). Biểu đồ và phân tích chi tiết dùng dữ liệu toàn hệ thống, không theo bộ lọc này.
          </p>
        </div>

        <div className="mb-4">
          <div className="inline-flex w-full flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <button
              type="button"
              onClick={() => setActiveSection("overview")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeSection === "overview"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("chart")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeSection === "chart"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              Biểu đồ
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("analysis")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeSection === "analysis"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              Phân tích chi tiết
            </button>
          </div>
        </div>

        {activeSection === "overview" ? (
          <>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-[11px] text-emerald-700">Tổng doanh thu</p>
                <p className="mt-1 text-sm font-semibold text-emerald-900">
                  {formatMoney(overviewData?.totalRevenue ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                <p className="text-[11px] text-amber-700">Tổng giá vốn</p>
                <p className="mt-1 text-sm font-semibold text-amber-900">
                  {formatMoney(overviewData?.totalCost ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                <p className="text-[11px] text-sky-700">Tổng lợi nhuận</p>
                <p className="mt-1 text-sm font-semibold text-sky-900">
                  {formatMoney(overviewData?.totalProfit ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                <p className="text-[11px] text-violet-700">Biên lợi nhuận</p>
                <p className="mt-1 text-sm font-semibold text-violet-900">
                  {(overviewData?.profitMarginPercent ?? 0).toLocaleString("vi-VN", {
                    maximumFractionDigits: 2,
                  })}
                  %
                </p>
              </div>
            </div>
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-700">So sánh kỳ trước</p>
                {previousPeriodQuery ? (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Kỳ đang xem: {fromDate} → {toDate} — các số lớn trùng 4 ô KPI phía trên. Kỳ trước cùng độ
                    dài (theo lịch), kết thúc ngay trước ngày bắt đầu kỳ đang xem.
                  </p>
                ) : null}
              </div>
              {previousPeriodQuery ? (
                <p className="text-[11px] text-slate-500">
                  Kỳ trước: {previousPeriodQuery.fromDate} → {previousPeriodQuery.toDate}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Chọn đủ Từ ngày và Đến ngày để xem so sánh.
                </p>
              )}
            </div>
            {previousPeriodQuery ? (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs">
                  <p className="text-emerald-700">Doanh thu</p>
                  <p className="mt-1 font-semibold text-emerald-900">
                    {formatMoney(overviewData?.totalRevenue ?? 0)}
                  </p>
                  <p className="mt-1 text-emerald-800">
                    Kỳ trước: {formatMoney(previousData?.totalRevenue ?? 0)} ·{" "}
                    {formatDeltaPercent(
                      overviewData?.totalRevenue ?? 0,
                      previousData?.totalRevenue ?? 0,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs">
                  <p className="text-amber-700">Giá vốn</p>
                  <p className="mt-1 font-semibold text-amber-900">
                    {formatMoney(overviewData?.totalCost ?? 0)}
                  </p>
                  <p className="mt-1 text-amber-800">
                    Kỳ trước: {formatMoney(previousData?.totalCost ?? 0)} ·{" "}
                    {formatDeltaPercent(
                      overviewData?.totalCost ?? 0,
                      previousData?.totalCost ?? 0,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs">
                  <p className="text-sky-700">Lợi nhuận</p>
                  <p className="mt-1 font-semibold text-sky-900">
                    {formatMoney(overviewData?.totalProfit ?? 0)}
                  </p>
                  <p className="mt-1 text-sky-800">
                    Kỳ trước: {formatMoney(previousData?.totalProfit ?? 0)} ·{" "}
                    {formatDeltaPercent(
                      overviewData?.totalProfit ?? 0,
                      previousData?.totalProfit ?? 0,
                    )}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          </>
        ) : null}

        {activeSection === "chart" ? (
          <div className="mb-4 rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-700">Biểu đồ tổng hợp</p>
                {chartMode === "day" ? (
                  <p className="text-[11px] text-slate-500">
                    Chế độ theo ngày đang hiển thị đúng ngày bạn chọn.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Chế độ theo tháng đang hiển thị đúng tháng bạn chọn.
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 text-[11px]">
                <input
                  ref={chartDayPickerRef}
                  type="date"
                  value={chartDay}
                  onChange={(e) => setChartDay(e.target.value || today)}
                  className="sr-only"
                  aria-label="Chọn ngày biểu đồ"
                />
                <input
                  ref={chartMonthPickerRef}
                  type="month"
                  value={chartMonth}
                  onChange={(e) => setChartMonth(e.target.value || today.slice(0, 7))}
                  className="sr-only"
                  aria-label="Chọn tháng biểu đồ"
                />
                <button
                  type="button"
                  onClick={() => {
                    setChartMode("day");
                    const input = chartDayPickerRef.current;
                    if (!input) return;
                    if (typeof input.showPicker === "function") input.showPicker();
                    else {
                      input.focus();
                      input.click();
                    }
                  }}
                  className={`rounded px-2 py-1 ${
                    chartMode === "day"
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Theo ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChartMode("month");
                    const input = chartMonthPickerRef.current;
                    if (!input) return;
                    if (typeof input.showPicker === "function") input.showPicker();
                    else {
                      input.focus();
                      input.click();
                    }
                  }}
                  className={`rounded px-2 py-1 ${
                    chartMode === "month"
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Theo tháng
                </button>
                <span className="rounded bg-white px-2 py-1 text-[10px] text-slate-600">
                  {chartMode === "day" ? chartDay : chartMonth}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {!chartRows.length ? (
                <p className="text-xs text-slate-500">Chưa có dữ liệu để vẽ biểu đồ.</p>
              ) : (
                chartRows.map((r) => {
                  const revenue = Math.max(0, r.revenue);
                  const cost = Math.max(0, r.cost);
                  const profit = Math.max(0, r.profit);
                  const total = revenue + cost + profit;
                  const revenuePct = total > 0 ? (revenue / total) * 100 : 0;
                  const costPct = total > 0 ? (cost / total) * 100 : 0;
                  const stop1 = revenuePct;
                  const stop2 = revenuePct + costPct;
                  return (
                    <div key={r.label} className="rounded-lg border border-slate-100 p-3">
                      <div className="mb-2 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">{r.label}</span>
                        <span className="text-slate-500">Tổng: {formatMoney(total)}</span>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div
                          className="h-24 w-24 rounded-full border border-slate-200"
                          style={{
                            background: `conic-gradient(#10b981 0% ${stop1}%, #f59e0b ${stop1}% ${stop2}%, #0ea5e9 ${stop2}% 100%)`,
                          }}
                        />
                        <div className="grid flex-1 grid-cols-1 gap-1 text-[11px] text-slate-600 sm:grid-cols-3">
                          <div className="rounded-md bg-emerald-50 px-2 py-1">
                            <p className="font-semibold text-emerald-700">Doanh thu</p>
                            <p>{formatMoney(r.revenue)}</p>
                          </div>
                          <div className="rounded-md bg-amber-50 px-2 py-1">
                            <p className="font-semibold text-amber-700">Giá vốn</p>
                            <p>{formatMoney(r.cost)}</p>
                          </div>
                          <div className="rounded-md bg-sky-50 px-2 py-1">
                            <p className="font-semibold text-sky-700">Lợi nhuận</p>
                            <p>{formatMoney(r.profit)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {activeSection === "analysis" ? (
          <>
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/40 p-3 sm:p-4">
              <p className="text-xs font-semibold text-slate-700">Bảng phân tích doanh thu</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Bấm nút để mở chi tiết doanh thu theo khách hàng hoặc theo nhà cung cấp.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpenedRevenueModal("customer")}
                  className="inline-flex items-center justify-center rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                >
                  Doanh thu theo khách hàng ({(broadData?.revenueByCustomers ?? []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setOpenedRevenueModal("supplier")}
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Doanh thu theo nhà cung cấp ({(broadData?.revenueBySuppliers ?? []).length})
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 sm:p-4">
              <p className="text-xs font-semibold text-slate-700">
                Chi tiết và thống kê nâng cao
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Bấm nút để mở danh sách mặt hàng đã bán hoặc thống kê lợi nhuận theo từng lô.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setSoldFromDate(fromDate);
                    setSoldToDate(toDate || today);
                    setSoldPage(1);
                    setSoldItemsKeyword("");
                    setSoldItemsWarehouseFilter("");
                    setIsSoldItemsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Danh sách mặt hàng đã bán ({broadData?.totalRows ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setIsLotProfitModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  Thống kê lợi nhuận theo từng lô ({allLots.length})
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                <p className="text-xs font-semibold text-emerald-800">
                  5 mặt hàng lãi cao nhất
                </p>
                <div className="mt-2 space-y-1.5">
                  {topBottomProducts.top.length === 0 ? (
                    <p className="text-[11px] text-slate-500">Chưa có dữ liệu.</p>
                  ) : (
                    topBottomProducts.top.map((item, idx) => (
                      <div
                        key={`${item.label}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-white/80 px-2 py-1.5 text-[11px]"
                      >
                        <span className="truncate text-slate-700">{item.label}</span>
                        <span className="shrink-0 font-semibold text-emerald-700">
                          {formatMoney(item.profit)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                <p className="text-xs font-semibold text-rose-800">
                  5 mặt hàng lợi nhuận thấp nhất
                </p>
                <div className="mt-2 space-y-1.5">
                  {topBottomProducts.bottom.length === 0 ? (
                    <p className="text-[11px] text-slate-500">Chưa có dữ liệu.</p>
                  ) : (
                    topBottomProducts.bottom.map((item, idx) => (
                      <div
                        key={`${item.label}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-white/80 px-2 py-1.5 text-[11px]"
                      >
                        <span className="truncate text-slate-700">{item.label}</span>
                        <span
                          className={`shrink-0 font-semibold ${
                            item.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {formatMoney(item.profit)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {openedRevenueModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setOpenedRevenueModal(null)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {openedRevenueModal === "customer"
                    ? "Doanh thu theo khách hàng"
                    : "Doanh thu theo nhà cung cấp"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {openedRevenueModal === "customer"
                    ? "Xem nhóm khách hàng mang lại doanh thu nhiều nhất."
                    : "So sánh mức mua từ từng nhà cung cấp qua giá vốn."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenedRevenueModal(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[72vh] overflow-auto">
              <table className="w-full min-w-[760px] text-[11px]">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      {openedRevenueModal === "customer" ? "Khách hàng" : "Nhà cung cấp"}
                    </th>
                    <th className="px-3 py-2 text-right">Doanh thu</th>
                    <th className="px-3 py-2 text-right">Giá vốn</th>
                    <th className="px-3 py-2 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {openedRevenueModal === "customer" ? (
                    (broadData?.revenueByCustomers ?? []).length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-slate-500" colSpan={4}>
                          Chưa có dữ liệu theo khách hàng.
                        </td>
                      </tr>
                    ) : (
                      (broadData?.revenueByCustomers ?? []).map((item) => (
                        <tr
                          key={item.customerKey}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-3 py-2">{item.customerName || "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatMoney(item.revenue)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatMoney(item.cost)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right tabular-nums font-semibold ${
                              item.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {formatMoney(item.profit)}
                          </td>
                        </tr>
                      ))
                    )
                  ) : (broadData?.revenueBySuppliers ?? []).length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={4}>
                        Chưa có dữ liệu theo nhà cung cấp.
                      </td>
                    </tr>
                  ) : (
                    (broadData?.revenueBySuppliers ?? []).map((item) => (
                      <tr
                        key={item.supplierKey}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2">{item.supplierName || "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(item.revenue)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(item.cost)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right tabular-nums font-semibold ${
                            item.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {formatMoney(item.profit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {isSoldItemsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setIsSoldItemsModalOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative z-10 w-full max-w-[96vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Danh sách mặt hàng đã bán</p>
                <p className="text-[11px] text-slate-500">
                  {soldListFetching
                    ? "Đang tải dữ liệu..."
                    : `${soldListData?.totalRows ?? 0} dòng chi tiết theo box · Trang ${soldListData?.page ?? soldPage}/${soldListData?.totalPages ?? 1}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleExportSoldListExcel()}
                  disabled={soldListFetching}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <Download size={14} />
                  Xuất Excel
                </button>
                <button
                  type="button"
                  onClick={() => setIsSoldItemsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 bg-slate-50/40 px-4 py-2.5">
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={soldFromDate}
                  onChange={(e) => {
                    setSoldFromDate(e.target.value);
                    setSoldPage(1);
                  }}
                  className="w-[148px] rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={soldToDate}
                  onChange={(e) => {
                    setSoldToDate(e.target.value);
                    setSoldPage(1);
                  }}
                  className="w-[148px] rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                />
              </div>
              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Tìm nhanh
                </label>
                <input
                  type="text"
                  value={soldItemsKeyword}
                  onChange={(e) => setSoldItemsKeyword(e.target.value)}
                  placeholder="Mã phiếu, đơn hàng, box, lô, khách hàng..."
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="min-w-[180px]">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Kho
                </label>
                <select
                  value={soldItemsWarehouseFilter}
                  onChange={(e) => setSoldItemsWarehouseFilter(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="">Tất cả kho</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1440px] text-[11px]">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Thời gian xuất</th>
                    <th className="px-3 py-2 text-left">Phiếu xuất</th>
                    <th className="px-3 py-2 text-left">Đơn hàng</th>
                    <th className="px-3 py-2 text-left">Khách hàng</th>
                    <th className="px-3 py-2 text-left">Nhà cung cấp</th>
                    <th className="px-3 py-2 text-left">Kho</th>
                    <th className="px-3 py-2 text-left">Box</th>
                    <th className="px-3 py-2 text-left">Lô</th>
                    <th className="px-3 py-2 text-left">Sản phẩm</th>
                    <th className="px-3 py-2 text-right">Kg</th>
                    <th className="px-3 py-2 text-right">Đơn giá bán</th>
                    <th className="px-3 py-2 text-right">Đơn giá vốn</th>
                    <th className="px-3 py-2 text-right">Doanh thu</th>
                    <th className="px-3 py-2 text-right">Giá vốn</th>
                    <th className="px-3 py-2 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSoldRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={15}>
                        Không có dữ liệu trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    filteredSoldRows.map((r, idx) => (
                      <tr
                        key={`${r.exportId}-${r.boxId}-${idx}`}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2">{formatDateTime(r.exportedAt)}</td>
                        <td className="px-3 py-2 font-mono">{r.exportCode}</td>
                        <td className="px-3 py-2">#{r.orderId}</td>
                        <td className="px-3 py-2">{r.customerName || "—"}</td>
                        <td className="px-3 py-2">{r.supplierName || "—"}</td>
                        <td className="px-3 py-2">{r.warehouseName || "—"}</td>
                        <td className="px-3 py-2 font-mono">{r.boxCode || `#${r.boxId}`}</td>
                        <td className="px-3 py-2">{r.lotCode || "—"}</td>
                        <td className="px-3 py-2">
                          {r.productName || "—"}
                          {r.variantName ? ` · ${r.variantName}` : ""}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatKg(r.quantityKg)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(r.saleUnitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(r.costUnitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(r.revenue)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(r.cost)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right tabular-nums font-semibold ${
                            r.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {formatMoney(r.profit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2 text-xs">
              <span className="text-slate-500">
                Hiển thị {(soldListData?.rows ?? []).length} / {soldListData?.totalRows ?? 0} dòng (trang hiện tại)
              </span>
              <div className="inline-flex items-center gap-2">
                <label className="text-slate-500">Số dòng/trang</label>
                <select
                  value={soldPageSize}
                  onChange={(e) => {
                    setSoldPageSize(Number(e.target.value));
                    setSoldPage(1);
                  }}
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSoldPage((p) => Math.max(1, p - 1))}
                  disabled={soldListFetching || (soldListData?.page ?? soldPage) <= 1}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-slate-600">
                  Trang {soldListData?.page ?? soldPage}/{soldListData?.totalPages ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSoldPage((p) =>
                      Math.min(soldListData?.totalPages ?? p, p + 1),
                    )
                  }
                  disabled={
                    soldListFetching ||
                    (soldListData?.page ?? soldPage) >= (soldListData?.totalPages ?? 1)
                  }
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isLotProfitModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setIsLotProfitModalOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Thống kê lợi nhuận theo từng lô
                </p>
                <p className="text-[11px] text-slate-500">
                  Tổng hợp doanh thu, giá vốn và lợi nhuận theo từng lô hàng (đủ lô trong hệ thống, có
                  phân trang).
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                    Tiêu hủy:{" "}
                    {lotModalLoading
                      ? "…"
                      : `${formatKg(lotModalTotals?.totalDisposedKg ?? 0)} kg`}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 font-medium text-orange-700">
                    Hao hụt kiểm kê:{" "}
                    {lotModalLoading
                      ? "…"
                      : `${formatKg(lotModalTotals?.totalStockAdjustmentLossKg ?? 0)} kg`}
                  </span>
                  {!lotModalLoading ? (
                    <span className="text-slate-500">
                      {lotModalRows.length} lô · trang {safeLotModalPage}/{lotModalTotalPages}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLotProfitModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
            <div className="max-h-[64vh] overflow-auto">
              <table className="w-full min-w-[1280px] text-[11px]">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Mã lô</th>
                    <th className="px-3 py-2 text-left">Sản phẩm</th>
                    <th className="px-3 py-2 text-left">Nhà cung cấp</th>
                    <th className="px-3 py-2 text-left">Kho</th>
                    <th className="px-3 py-2 text-right">Đã bán (kg)</th>
                    <th className="px-3 py-2 text-right">Chưa bán (kg)</th>
                    <th className="px-3 py-2 text-right">Tiêu hủy (kg)</th>
                    <th className="px-3 py-2 text-right">Hao hụt (kg)</th>
                    <th className="px-3 py-2 text-right">Doanh thu</th>
                    <th className="px-3 py-2 text-right">Giá vốn</th>
                    <th className="px-3 py-2 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {lotModalLoading ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-slate-500" colSpan={11}>
                        Đang tải toàn bộ dữ liệu xuất kho…
                      </td>
                    </tr>
                  ) : lotModalRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={11}>
                        Chưa có dữ liệu lô hàng.
                      </td>
                    </tr>
                  ) : (
                    lotModalPageSlice.map((row) => (
                      <tr
                        key={`${row.lotId}-${row.lotCode}`}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 font-medium text-slate-800">{row.lotCode}</td>
                        <td className="max-w-[200px] px-3 py-2 text-slate-700">
                          <span className="line-clamp-2" title={row.productLabel}>
                            {row.productLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2">{row.supplierName}</td>
                        <td className="px-3 py-2">{row.warehouseName}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatKg(row.soldKg)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatKg(row.unsoldKg)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatKg(row.disposedKg)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatKg(row.stockAdjustmentLossKg)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.revenue)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.cost)}</td>
                        <td
                          className={`px-3 py-2 text-right tabular-nums font-semibold ${
                            row.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {formatMoney(row.profit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-600">
              <label className="inline-flex items-center gap-2">
                <span className="text-slate-500">Số dòng / trang</span>
                <select
                  value={lotModalPageSize}
                  onChange={(e) => {
                    setLotModalPageSize(Number(e.target.value));
                    setLotModalPage(1);
                  }}
                  disabled={lotModalLoading}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLotModalPage((p) => {
                      const cur = Math.min(Math.max(1, p), lotModalTotalPages);
                      return Math.max(1, cur - 1);
                    })
                  }
                  disabled={lotModalLoading || safeLotModalPage <= 1}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Trước
                </button>
                <span>
                  Trang {safeLotModalPage}/{lotModalTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLotModalPage((p) => {
                      const cur = Math.min(Math.max(1, p), lotModalTotalPages);
                      return Math.min(lotModalTotalPages, cur + 1);
                    })
                  }
                  disabled={lotModalLoading || safeLotModalPage >= lotModalTotalPages}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RevenueProfitReportPage;
