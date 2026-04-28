import { useMemo, useState } from "react";
import { Download, RefreshCcw } from "lucide-react";
import {
  useGetRevenueProfitSpecificReportQuery,
} from "../api/revenue-report.api";
import { useGetWarehousesQuery } from "../api/create-user.api";
import { useGetProductsQuery } from "../../product/api/product.api";
import { useGetProductVariantsQuery } from "../../product/api/product-variant.api";

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

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

const toBucketLabel = (isoDate: string, mode: "day" | "month") => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "N/A";
  if (mode === "month") {
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  return d.toLocaleDateString("vi-VN");
};

const RevenueProfitReportPage = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>(today);
  const [chartMode, setChartMode] = useState<"day" | "month">("day");
  const [warehouseId, setWarehouseId] = useState<number | 0>(0);
  const [productId, setProductId] = useState<number | 0>(0);
  const [productVariantId, setProductVariantId] = useState<number | 0>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [openedRevenueModal, setOpenedRevenueModal] = useState<
    "customer" | "supplier" | null
  >(null);
  const [isSoldItemsModalOpen, setIsSoldItemsModalOpen] = useState(false);
  const [isLotProfitModalOpen, setIsLotProfitModalOpen] = useState(false);

  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: productVariants = [] } = useGetProductVariantsQuery();

  const variantsByProduct = useMemo(
    () =>
      productVariants.filter((v) =>
        productId ? Number(v.productId) === Number(productId) : true,
      ),
    [productVariants, productId],
  );

  const query = useMemo(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      warehouseId: warehouseId || undefined,
      productId: productId || undefined,
      productVariantId: productVariantId || undefined,
      page,
      pageSize,
    }),
    [fromDate, toDate, warehouseId, productId, productVariantId, page, pageSize],
  );

  const actualQuery = useGetRevenueProfitSpecificReportQuery(query);
  const data = actualQuery.data;
  const isFetching = actualQuery.isFetching;
  const refetch = () => actualQuery.refetch();

  const chartRows = useMemo(() => {
    const source = data?.rows ?? [];

    if (chartMode === "day") {
      const selectedDay = toDate || today;
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

    const map = new Map<
      string,
      { label: string; revenue: number; cost: number; profit: number }
    >();
    for (const row of source) {
      const label = toBucketLabel(row.exportedAt, chartMode);
      const existed = map.get(label);
      if (existed) {
        existed.revenue += row.revenue;
        existed.cost += row.cost;
        existed.profit += row.profit;
      } else {
        map.set(label, {
          label,
          revenue: row.revenue,
          cost: row.cost,
          profit: row.profit,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const pa = a.label.split("/").map(Number);
      const pb = b.label.split("/").map(Number);
      if (pa.length === 2 && pb.length === 2) {
        return pa[1] === pb[1] ? pa[0] - pb[0] : pa[1] - pb[1];
      }
      return 0;
    });
  }, [chartMode, data?.rows, toDate, today]);

  const lotProfitRows = useMemo(() => {
    const source = data?.rows ?? [];
    const map = new Map<
      string,
      {
        lotCode: string;
        supplierName: string;
        warehouseName: string;
        totalKg: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();

    source.forEach((row) => {
      const lotCode = row.lotCode || `LÔ-#${row.boxId}`;
      const current = map.get(lotCode);
      if (current) {
        current.totalKg += row.quantityKg;
        current.revenue += row.revenue;
        current.cost += row.cost;
        current.profit += row.profit;
      } else {
        map.set(lotCode, {
          lotCode,
          supplierName: row.supplierName || "—",
          warehouseName: row.warehouseName || "—",
          totalKg: row.quantityKg,
          revenue: row.revenue,
          cost: row.cost,
          profit: row.profit,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [data?.rows]);

  const exportExcel = () => {
    const rows = data?.rows ?? [];
    if (!rows.length) return;
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
    a.download = `bao-cao-doanh-thu-loi-nhuan-${stamp}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-5">
      <div className="rounded-[15px] bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Báo cáo doanh thu - lợi nhuận
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Dữ liệu được tính theo thực tế xuất kho.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Chế độ dữ liệu
              </label>
              <select
                value="actual"
                disabled
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                <option value="actual">Thực tế (theo xuất kho)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Từ ngày
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
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
                  setPage(1);
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
                  setPage(1);
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
                  setPage(1);
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
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Biến thể
              </label>
              <select
                value={productVariantId}
                onChange={(e) => {
                  setProductVariantId(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                <option value={0}>Tất cả biến thể</option>
                {variantsByProduct.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.productName} · Grade {v.grade}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={14} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={!data?.rows?.length}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              <Download size={14} />
              Xuất Excel
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[11px] text-emerald-700">Tổng doanh thu</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">
              {formatMoney(data?.totalRevenue ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[11px] text-amber-700">Tổng giá vốn</p>
            <p className="mt-1 text-sm font-semibold text-amber-900">
              {formatMoney(data?.totalCost ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <p className="text-[11px] text-sky-700">Tổng lợi nhuận</p>
            <p className="mt-1 text-sm font-semibold text-sky-900">
              {formatMoney(data?.totalProfit ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
            <p className="text-[11px] text-violet-700">Biên lợi nhuận</p>
            <p className="mt-1 text-sm font-semibold text-violet-900">
              {(data?.profitMarginPercent ?? 0).toLocaleString("vi-VN", {
                maximumFractionDigits: 2,
              })}
              %
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-700">Biểu đồ tổng hợp</p>
              {chartMode === "day" ? (
                <p className="text-[11px] text-slate-500">
                  Chế độ theo ngày đang hiển thị đúng ngày đã chọn ở mục "Đến ngày".
                </p>
              ) : null}
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setChartMode("day")}
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
                onClick={() => setChartMode("month")}
                className={`rounded px-2 py-1 ${
                  chartMode === "month"
                    ? "bg-white font-semibold text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                Theo tháng
              </button>
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
              Doanh thu theo khách hàng ({(data?.revenueByCustomers ?? []).length})
            </button>
            <button
              type="button"
              onClick={() => setOpenedRevenueModal("supplier")}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Doanh thu theo nhà cung cấp ({(data?.revenueBySuppliers ?? []).length})
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 sm:p-4">
          <p className="text-xs font-semibold text-slate-700">Chi tiết và thống kê nâng cao</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Bấm nút để mở danh sách mặt hàng đã bán hoặc thống kê lợi nhuận theo từng lô.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsSoldItemsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Danh sách mặt hàng đã bán ({data?.totalRows ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setIsLotProfitModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
            >
              Thống kê lợi nhuận theo từng lô ({lotProfitRows.length})
            </button>
          </div>
        </div>
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
                    (data?.revenueByCustomers ?? []).length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-slate-500" colSpan={4}>
                          Chưa có dữ liệu theo khách hàng.
                        </td>
                      </tr>
                    ) : (
                      (data?.revenueByCustomers ?? []).map((item) => (
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
                  ) : (data?.revenueBySuppliers ?? []).length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={4}>
                        Chưa có dữ liệu theo nhà cung cấp.
                      </td>
                    </tr>
                  ) : (
                    (data?.revenueBySuppliers ?? []).map((item) => (
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
                  {isFetching
                    ? "Đang tải dữ liệu..."
                    : `${data?.totalRows ?? 0} dòng chi tiết theo box · Trang ${data?.page ?? 1}/${data?.totalPages ?? 1}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSoldItemsModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1520px] text-[11px]">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Thời gian xuất</th>
                    <th className="px-3 py-2 text-left">Phiếu xuất</th>
                    <th className="px-3 py-2 text-left">Đơn hàng</th>
                    <th className="px-3 py-2 text-left">Khách hàng</th>
                    <th className="px-3 py-2 text-left">Chế độ</th>
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
                  {(data?.rows ?? []).length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={16}>
                        Không có dữ liệu trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    (data?.rows ?? []).map((r, idx) => (
                      <tr
                        key={`${r.exportId}-${r.boxId}-${idx}`}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2">{formatDateTime(r.exportedAt)}</td>
                        <td className="px-3 py-2 font-mono">{r.exportCode}</td>
                        <td className="px-3 py-2">#{r.orderId}</td>
                        <td className="px-3 py-2">{r.customerName || "—"}</td>
                        <td className="px-3 py-2">Thực tế</td>
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
                Hiển thị {(data?.rows ?? []).length} / {data?.totalRows ?? 0} dòng
              </span>
              <div className="inline-flex items-center gap-2">
                <label className="text-slate-500">Số dòng/trang</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={isFetching || (data?.page ?? 1) <= 1}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-slate-600">
                  Trang {data?.page ?? page}/{data?.totalPages ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(data?.totalPages ?? p, p + 1),
                    )
                  }
                  disabled={isFetching || (data?.page ?? page) >= (data?.totalPages ?? 1)}
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
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Thống kê lợi nhuận theo từng lô
                </p>
                <p className="text-[11px] text-slate-500">
                  Tổng hợp doanh thu, giá vốn và lợi nhuận theo từng lô hàng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLotProfitModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
            <div className="max-h-[72vh] overflow-auto">
              <table className="w-full min-w-[980px] text-[11px]">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Mã lô</th>
                    <th className="px-3 py-2 text-left">Nhà cung cấp</th>
                    <th className="px-3 py-2 text-left">Kho</th>
                    <th className="px-3 py-2 text-right">Khối lượng (kg)</th>
                    <th className="px-3 py-2 text-right">Doanh thu</th>
                    <th className="px-3 py-2 text-right">Giá vốn</th>
                    <th className="px-3 py-2 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {lotProfitRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={7}>
                        Chưa có dữ liệu lô hàng trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    lotProfitRows.map((row) => (
                      <tr key={row.lotCode} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{row.lotCode}</td>
                        <td className="px-3 py-2">{row.supplierName}</td>
                        <td className="px-3 py-2">{row.warehouseName}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatKg(row.totalKg)}</td>
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
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RevenueProfitReportPage;
