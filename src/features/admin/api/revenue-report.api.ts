import { api } from "../../../shared/api";

export type RevenueProfitReportQuery = {
  fromDate?: string;
  toDate?: string;
  warehouseId?: number;
  productId?: number;
  productVariantId?: number;
  page?: number;
  pageSize?: number;
};

export type RevenueProfitReportRow = {
  exportedAt: string;
  exportId: number;
  exportCode: string;
  orderId: number;
  customerUserId?: string | null;
  customerName?: string | null;
  boxId: number;
  boxCode: string;
  lotCode: string;
  lotId: number;
  supplierId?: number | null;
  supplierName?: string | null;
  warehouseId?: number | null;
  warehouseName?: string | null;
  productId?: number | null;
  productVariantId?: number | null;
  productName: string;
  variantName: string;
  quantityKg: number;
  saleUnitPrice: number;
  costUnitPrice: number;
  revenue: number;
  cost: number;
  profit: number;
};

export type RevenueProfitByCustomer = {
  customerKey: string;
  customerName: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type RevenueProfitBySupplier = {
  supplierKey: string;
  supplierName: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type RevenueProfitReportResponse = {
  fromDate?: string | null;
  toDate?: string | null;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalDisposedKg: number;
  totalStockAdjustmentLossKg: number;
  profitMarginPercent: number;
  totalRows: number;
  page: number;
  pageSize: number;
  totalPages: number;
  revenueByCustomers: RevenueProfitByCustomer[];
  revenueBySuppliers: RevenueProfitBySupplier[];
  rows: RevenueProfitReportRow[];
};

export const revenueReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRevenueProfitSpecificReport: builder.query<
      RevenueProfitReportResponse,
      RevenueProfitReportQuery | void
    >({
      query: (params) => ({
        url: "Exports/reports/revenue-profit-specific",
        params: {
          fromDate: params?.fromDate || undefined,
          toDate: params?.toDate || undefined,
          warehouseId: params?.warehouseId || undefined,
          productId: params?.productId || undefined,
          productVariantId: params?.productVariantId || undefined,
          page: params?.page || 1,
          pageSize: params?.pageSize || 50,
        },
      }),
      transformResponse: (raw: unknown): RevenueProfitReportResponse => {
        const row = (raw as Record<string, unknown>) ?? {};
        const rowsRaw = (row.rows as Array<Record<string, unknown>>) ?? [];
        return {
          fromDate: (row.fromDate as string | null | undefined) ?? null,
          toDate: (row.toDate as string | null | undefined) ?? null,
          totalRevenue: Number(row.totalRevenue ?? row.TotalRevenue ?? 0),
          totalCost: Number(row.totalCost ?? row.TotalCost ?? 0),
          totalProfit: Number(row.totalProfit ?? row.TotalProfit ?? 0),
          totalDisposedKg: Number(row.totalDisposedKg ?? row.TotalDisposedKg ?? 0),
          totalStockAdjustmentLossKg: Number(
            row.totalStockAdjustmentLossKg ?? row.TotalStockAdjustmentLossKg ?? 0,
          ),
          profitMarginPercent: Number(
            row.profitMarginPercent ?? row.ProfitMarginPercent ?? 0,
          ),
          totalRows: Number(row.totalRows ?? row.TotalRows ?? 0),
          page: Number(row.page ?? row.Page ?? 1),
          pageSize: Number(row.pageSize ?? row.PageSize ?? 50),
          totalPages: Number(row.totalPages ?? row.TotalPages ?? 1),
          revenueByCustomers: (
            (row.revenueByCustomers ??
              row.RevenueByCustomers ??
              []) as Array<Record<string, unknown>>
          ).map((item) => ({
            customerKey: String(item.customerKey ?? item.CustomerKey ?? ""),
            customerName: String(item.customerName ?? item.CustomerName ?? ""),
            revenue: Number(item.revenue ?? item.Revenue ?? 0),
            cost: Number(item.cost ?? item.Cost ?? 0),
            profit: Number(item.profit ?? item.Profit ?? 0),
          })),
          revenueBySuppliers: (
            (row.revenueBySuppliers ??
              row.RevenueBySuppliers ??
              []) as Array<Record<string, unknown>>
          ).map((item) => ({
            supplierKey: String(item.supplierKey ?? item.SupplierKey ?? ""),
            supplierName: String(item.supplierName ?? item.SupplierName ?? ""),
            revenue: Number(item.revenue ?? item.Revenue ?? 0),
            cost: Number(item.cost ?? item.Cost ?? 0),
            profit: Number(item.profit ?? item.Profit ?? 0),
          })),
          rows: rowsRaw.map((item) => ({
            exportedAt: String(item.exportedAt ?? item.ExportedAt ?? ""),
            exportId: Number(item.exportId ?? item.ExportId ?? 0),
            exportCode: String(item.exportCode ?? item.ExportCode ?? ""),
            orderId: Number(item.orderId ?? item.OrderId ?? 0),
            customerUserId: String(item.customerUserId ?? item.CustomerUserId ?? "") || null,
            customerName: String(item.customerName ?? item.CustomerName ?? "") || null,
            boxId: Number(item.boxId ?? item.BoxId ?? 0),
            boxCode: String(item.boxCode ?? item.BoxCode ?? ""),
            lotCode: String(item.lotCode ?? item.LotCode ?? ""),
            lotId: Number(item.lotId ?? item.LotId ?? 0),
            supplierId: Number(item.supplierId ?? item.SupplierId ?? 0) || null,
            supplierName: String(item.supplierName ?? item.SupplierName ?? "") || null,
            warehouseId: Number(item.warehouseId ?? item.WarehouseId ?? 0) || null,
            warehouseName: String(item.warehouseName ?? item.WarehouseName ?? ""),
            productId: Number(item.productId ?? item.ProductId ?? 0) || null,
            productVariantId:
              Number(item.productVariantId ?? item.ProductVariantId ?? 0) || null,
            productName: String(item.productName ?? item.ProductName ?? ""),
            variantName: String(item.variantName ?? item.VariantName ?? ""),
            quantityKg: Number(item.quantityKg ?? item.QuantityKg ?? 0),
            saleUnitPrice: Number(item.saleUnitPrice ?? item.SaleUnitPrice ?? 0),
            costUnitPrice: Number(item.costUnitPrice ?? item.CostUnitPrice ?? 0),
            revenue: Number(item.revenue ?? item.Revenue ?? 0),
            cost: Number(item.cost ?? item.Cost ?? 0),
            profit: Number(item.profit ?? item.Profit ?? 0),
          })),
        };
      },
    }),
    getEstimatedRevenueProfitSpecificReport: builder.query<
      RevenueProfitReportResponse,
      RevenueProfitReportQuery | void
    >({
      query: (params) => ({
        url: "Exports/reports/revenue-profit-estimated-specific",
        params: {
          fromDate: params?.fromDate || undefined,
          toDate: params?.toDate || undefined,
          warehouseId: params?.warehouseId || undefined,
          productId: params?.productId || undefined,
          productVariantId: params?.productVariantId || undefined,
          page: params?.page || 1,
          pageSize: params?.pageSize || 50,
        },
      }),
      transformResponse: (raw: unknown): RevenueProfitReportResponse => {
        const row = (raw as Record<string, unknown>) ?? {};
        const rowsRaw = (row.rows as Array<Record<string, unknown>>) ?? [];
        return {
          fromDate: (row.fromDate as string | null | undefined) ?? null,
          toDate: (row.toDate as string | null | undefined) ?? null,
          totalRevenue: Number(row.totalRevenue ?? row.TotalRevenue ?? 0),
          totalCost: Number(row.totalCost ?? row.TotalCost ?? 0),
          totalProfit: Number(row.totalProfit ?? row.TotalProfit ?? 0),
          totalDisposedKg: Number(row.totalDisposedKg ?? row.TotalDisposedKg ?? 0),
          totalStockAdjustmentLossKg: Number(
            row.totalStockAdjustmentLossKg ?? row.TotalStockAdjustmentLossKg ?? 0,
          ),
          profitMarginPercent: Number(
            row.profitMarginPercent ?? row.ProfitMarginPercent ?? 0,
          ),
          totalRows: Number(row.totalRows ?? row.TotalRows ?? 0),
          page: Number(row.page ?? row.Page ?? 1),
          pageSize: Number(row.pageSize ?? row.PageSize ?? 50),
          totalPages: Number(row.totalPages ?? row.TotalPages ?? 1),
          revenueByCustomers: (
            (row.revenueByCustomers ??
              row.RevenueByCustomers ??
              []) as Array<Record<string, unknown>>
          ).map((item) => ({
            customerKey: String(item.customerKey ?? item.CustomerKey ?? ""),
            customerName: String(item.customerName ?? item.CustomerName ?? ""),
            revenue: Number(item.revenue ?? item.Revenue ?? 0),
            cost: Number(item.cost ?? item.Cost ?? 0),
            profit: Number(item.profit ?? item.Profit ?? 0),
          })),
          revenueBySuppliers: (
            (row.revenueBySuppliers ??
              row.RevenueBySuppliers ??
              []) as Array<Record<string, unknown>>
          ).map((item) => ({
            supplierKey: String(item.supplierKey ?? item.SupplierKey ?? ""),
            supplierName: String(item.supplierName ?? item.SupplierName ?? ""),
            revenue: Number(item.revenue ?? item.Revenue ?? 0),
            cost: Number(item.cost ?? item.Cost ?? 0),
            profit: Number(item.profit ?? item.Profit ?? 0),
          })),
          rows: rowsRaw.map((item) => ({
            exportedAt: String(item.exportedAt ?? item.ExportedAt ?? ""),
            exportId: Number(item.exportId ?? item.ExportId ?? 0),
            exportCode: String(item.exportCode ?? item.ExportCode ?? ""),
            orderId: Number(item.orderId ?? item.OrderId ?? 0),
            customerUserId: String(item.customerUserId ?? item.CustomerUserId ?? "") || null,
            customerName: String(item.customerName ?? item.CustomerName ?? "") || null,
            boxId: Number(item.boxId ?? item.BoxId ?? 0),
            boxCode: String(item.boxCode ?? item.BoxCode ?? ""),
            lotCode: String(item.lotCode ?? item.LotCode ?? ""),
            lotId: Number(item.lotId ?? item.LotId ?? 0),
            supplierId: Number(item.supplierId ?? item.SupplierId ?? 0) || null,
            supplierName: String(item.supplierName ?? item.SupplierName ?? "") || null,
            warehouseId: Number(item.warehouseId ?? item.WarehouseId ?? 0) || null,
            warehouseName: String(item.warehouseName ?? item.WarehouseName ?? ""),
            productId: Number(item.productId ?? item.ProductId ?? 0) || null,
            productVariantId:
              Number(item.productVariantId ?? item.ProductVariantId ?? 0) || null,
            productName: String(item.productName ?? item.ProductName ?? ""),
            variantName: String(item.variantName ?? item.VariantName ?? ""),
            quantityKg: Number(item.quantityKg ?? item.QuantityKg ?? 0),
            saleUnitPrice: Number(item.saleUnitPrice ?? item.SaleUnitPrice ?? 0),
            costUnitPrice: Number(item.costUnitPrice ?? item.CostUnitPrice ?? 0),
            revenue: Number(item.revenue ?? item.Revenue ?? 0),
            cost: Number(item.cost ?? item.Cost ?? 0),
            profit: Number(item.profit ?? item.Profit ?? 0),
          })),
        };
      },
    }),
  }),
});

export const {
  useGetRevenueProfitSpecificReportQuery,
  useGetEstimatedRevenueProfitSpecificReportQuery,
} = revenueReportApi;
