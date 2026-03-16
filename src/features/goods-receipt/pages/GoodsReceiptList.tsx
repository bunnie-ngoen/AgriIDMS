import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetGoodsReceiptsQuery } from "../api/goods-receipt.api";
import { useGetSuppliersQuery } from "../../supplier/api/supplier.api";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";
import { Loader2, FileText, FilePlus2, Eye } from "lucide-react";

export default function GoodsReceiptList() {
  const navigate = useNavigate();
  const { data: receipts = [], isLoading, isError, error, refetch } =
    useGetGoodsReceiptsQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: warehouses = [] } = useGetWarehousesQuery();

  const [supplierFilter, setSupplierFilter] = useState<number | 0>(0);
  const [warehouseFilter, setWarehouseFilter] = useState<number | 0>(0);

  const filtered = useMemo(
    () =>
      receipts.filter((r) => {
        if (supplierFilter && r.supplierId !== supplierFilter) return false;
        if (warehouseFilter && r.warehouseId !== warehouseFilter) return false;
        return true;
      }),
    [receipts, supplierFilter, warehouseFilter],
  );

  const statusClass = (status: string) => {
    if (status === "Approved") return "text-emerald-600";
    if (status === "PendingManagerApproval" || status === "Pending")
      return "text-amber-600";
    if (status === "Rejected") return "text-red-600";
    return "text-slate-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 py-6">
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <FileText size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Danh sách phiếu nhập kho
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý phiếu nhận hàng từ nhà cung cấp vào kho.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/goods-receipts/create")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <FilePlus2 size={16} />
            Tạo phiếu nhập
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Bộ lọc */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Nhà cung cấp
              </label>
              <select
                value={supplierFilter}
                onChange={(e) =>
                  setSupplierFilter(Number(e.target.value) || 0)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value={0}>Tất cả nhà cung cấp</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Kho
              </label>
              <select
                value={warehouseFilter}
                onChange={(e) =>
                  setWarehouseFilter(Number(e.target.value) || 0)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value={0}>Tất cả kho</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
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
                Không tải được danh sách phiếu nhập kho.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {(error as { status?: number })?.status === 401 &&
                  "Vui lòng đăng nhập lại."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm text-emerald-700 font-medium hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">
              Không có phiếu nhập kho nào phù hợp.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Mã phiếu
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Nhà cung cấp
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Kho
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ngày nhận
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      KL nhận / dùng được
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td
                        className="px-5 py-3.5 font-medium text-slate-900 cursor-pointer"
                        onClick={() =>
                          navigate(`/admin/goods-receipts/${r.id}`)
                        }
                      >
                        {r.receiptCode}
                      </td>
                      <td
                        className="px-5 py-3.5 text-slate-700 cursor-pointer"
                        onClick={() =>
                          navigate(`/admin/goods-receipts/${r.id}`)
                        }
                      >
                        {r.supplierName}
                      </td>
                      <td
                        className="px-5 py-3.5 text-slate-700 cursor-pointer"
                        onClick={() =>
                          navigate(`/admin/goods-receipts/${r.id}`)
                        }
                      >
                        {r.warehouseName}
                      </td>
                      <td
                        className="px-5 py-3.5 text-slate-600 cursor-pointer"
                        onClick={() =>
                          navigate(`/admin/goods-receipts/${r.id}`)
                        }
                      >
                        {r.receivedDate
                          ? new Date(r.receivedDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td
                        className="px-5 py-3.5 cursor-pointer"
                        onClick={() =>
                          navigate(`/admin/goods-receipts/${r.id}`)
                        }
                      >
                        <span
                          className={`text-sm font-medium ${statusClass(
                            r.status,
                          )}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 text-right text-slate-700 cursor-pointer"
                        onClick={() =>
                          navigate(`/admin/goods-receipts/${r.id}`)
                        }
                      >
                        {r.totalReceivedWeight} kg /{" "}
                        <span className="font-semibold">
                          {r.totalUsableWeight} kg
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/goods-receipts/${r.id}`)
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                        >
                          <Eye size={14} className="text-emerald-600" />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

