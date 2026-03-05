import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetWarehousesQuery,
  useDeleteWarehouseMutation,
} from "../api/create-user.api";
import type { WarehouseItem } from "../types/warehouse.type";
import { Trash2, Pencil } from "lucide-react";
import EditWarehouseModal from "../components/EditWarehouseModal";

const PAGE_SIZE = 10;

const WarehouseList = () => {
  const { data, isLoading, isError, refetch } = useGetWarehousesQuery();
  const [deleteWarehouse, { isLoading: isDeleting }] =
    useDeleteWarehouseMutation();

  const [pageIndex, setPageIndex] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [filterType, setFilterType] = useState<"" | "Normal" | "Cold">("");
  const [editingWarehouseId, setEditingWarehouseId] = useState<number | null>(
    null
  );

  const handleDelete = async (warehouse: WarehouseItem) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa kho "${warehouse.name}"?`
    );
    if (!ok) return;

    try {
      await deleteWarehouse(warehouse.id).unwrap();
      await refetch();
    } catch (error) {
      console.error("Delete warehouse failed:", error);
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];

    return data.filter((w) => {
      const matchName = w.name
        .toLowerCase()
        .includes(searchName.toLowerCase().trim());
      const matchType =
        !filterType || w.titleWarehouse === filterType;
      return matchName && matchType;
    });
  }, [data, searchName, filterType]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Danh sách kho
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý thông tin các kho hàng trong hệ thống.
            </p>
          </div>
          <Link
            to="/admin/warehouses/create"
            className="inline-flex items-center rounded-lg bg-[#7FBB35] px-3 py-2 text-xs font-semibold text-white hover:bg-[#598325]"
          >
            + Thêm kho
          </Link>
        </div>

        {/* Bộ lọc */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <input
            type="text"
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setPageIndex(1);
            }}
            placeholder="Tìm theo tên kho..."
            className="w-full md:w-1/2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as "" | "Normal" | "Cold");
              setPageIndex(1);
            }}
            className="w-full md:w-40 p-2.5 rounded-lg border border-slate-200 bg-white text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Tất cả loại kho</option>
            <option value="Normal">Kho thường</option>
            <option value="Cold">Kho lạnh</option>
          </select>
        </div>

        {isError && (
          <p className="text-red-500 text-sm mb-3">
            Không tải được danh sách kho. Vui lòng thử lại.
          </p>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Tên kho</th>
                <th className="px-4 py-2 text-left font-medium">
                  Địa chỉ
                </th>
                <th className="px-4 py-2 text-left font-medium">
                  Loại kho
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paged.length > 0 ? (
                paged.map((warehouse) => (
                  <tr
                    key={warehouse.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2">{warehouse.name}</td>
                    <td className="px-4 py-2">{warehouse.location}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {warehouse.titleWarehouse === "Cold"
                          ? "Kho lạnh"
                          : "Kho thường"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingWarehouseId(warehouse.id)}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil size={13} className="mr-1" />
                        Sửa
                      </button>
                      <Link
                        to={`/admin/warehouses/${warehouse.id}/config`}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Cấu hình
                      </Link>
                      <Link
                        to={`/admin/warehouses/${warehouse.id}/map`}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Sơ đồ
                      </Link>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(warehouse)}
                        className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={13} className="mr-1" />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Không tìm thấy kho phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs md:text-sm">
            <p className="text-slate-500">
              Trang {currentPage} / {totalPages} — {totalItems} kho
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() =>
                  hasPrev && setPageIndex((p) => Math.max(1, p - 1))
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() =>
                  hasNext && setPageIndex((p) => p + 1)
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {editingWarehouseId !== null && (
        <EditWarehouseModal
          warehouseId={editingWarehouseId}
          onClose={() => setEditingWarehouseId(null)}
          onSuccess={() => {
            refetch();
            setEditingWarehouseId(null);
          }}
        />
      )}
    </div>
  );
};

export default WarehouseList;

