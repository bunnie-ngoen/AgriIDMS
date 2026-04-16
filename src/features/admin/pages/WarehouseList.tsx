import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetWarehousesQuery,
  useDeleteWarehouseMutation,
} from "../api/create-user.api";
import type { WarehouseItem } from "../types/warehouse.type";
import { Trash2, Pencil, Package, Plus, ChevronDown, RotateCw } from "lucide-react";
import EditWarehouseModal from "../components/EditWarehouseModal";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

const PAGE_SIZE = 10;
const formatVolume = (value: number | undefined) =>
  Number(value ?? 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
const formatArea = (value: number | null | undefined) =>
  Number(value ?? 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const WarehouseList = () => {
  const { isManager, isWarehouseStaff } = useRoleGuard();
  const warehouseBasePath = isWarehouseStaff()
    ? "/warehouse/warehouses"
    : isManager()
      ? "/manager/warehouses"
      : "/admin/warehouses";
  const readOnlyActions = isWarehouseStaff();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page") ?? "1") || 1;

  const { data, isLoading, isError, error, refetch } = useGetWarehousesQuery();
  const [deleteWarehouse, { isLoading: isDeleting }] =
    useDeleteWarehouseMutation();

  const [pageIndex, setPageIndex] = useState(initialPage);
  const [searchName, setSearchName] = useState("");
  const [filterType, setFilterType] = useState<"" | "Normal" | "Cold">("");
  const [editingWarehouseId, setEditingWarehouseId] = useState<number | null>(
    null
  );

  const updatePageInUrl = (page: number) => {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      if (page <= 1) {
        sp.delete("page");
      } else {
        sp.set("page", String(page));
      }
      return sp;
    });
  };

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

  const handleOpenEdit = (warehouse: WarehouseItem) => {
    const occupied =
      Number(warehouse.storedInSlotsWeight ?? 0) +
      Number(warehouse.unassignedStockWeight ?? 0);
    if (occupied > 0) {
      window.alert("Kho đang có sản phẩm. Vui lòng dọn trống kho trước khi cập nhật thông tin.");
      return;
    }
    setEditingWarehouseId(warehouse.id);
  };

  const handleOpenConfig = (warehouse: WarehouseItem) => {
    const occupied =
      Number(warehouse.storedInSlotsWeight ?? 0) +
      Number(warehouse.unassignedStockWeight ?? 0);
    if (occupied > 0) {
      window.alert("Kho đang có sản phẩm. Vui lòng dọn trống kho trước khi cấu hình.");
      return;
    }
    navigate(`${warehouseBasePath}/${warehouse.id}/config`);
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

  const errorStatus = (error as { status?: number })?.status;
  const errorMessage =
    errorStatus === 401
      ? "Vui lòng đăng nhập lại."
      : errorStatus === 404
        ? "API không tìm thấy."
        : errorStatus === 500
          ? "Lỗi server. Vui lòng thử lại sau."
          : "Không tải được danh sách kho. Vui lòng thử lại.";

  return (
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 py-6">
      <div className="w-full min-w-0 max-w-[1600px] mx-auto">
        {/* Header — giống Tạo kho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <Package size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Danh sách kho
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý thông tin các kho hàng trong hệ thống.
              </p>
            </div>
          </div>
          {!readOnlyActions ? (
            <Link
              to={`${warehouseBasePath}/create`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl py-3 px-5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus size={16} />
              Thêm kho
            </Link>
          ) : null}
        </div>

        {/* Card nội dung */}
        <div className="min-w-0 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Bộ lọc */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="text"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setPageIndex(1);
                updatePageInUrl(1);
              }}
              placeholder="Tìm theo tên kho..."
              className="flex-1 min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
            />
            <div className="relative w-full sm:w-44">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as "" | "Normal" | "Cold");
                  setPageIndex(1);
                  updatePageInUrl(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 pr-9 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
              >
                <option value="">Tất cả loại kho</option>
                <option value="Normal">Kho thường</option>
                <option value="Cold">Kho lạnh</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {isError && (
            <div className="mx-6 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                <RotateCw size={14} />
                Thử lại
              </button>
            </div>
          )}

          <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 min-w-[160px]">
                    Tên kho
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 min-w-[260px]">
                    Địa chỉ
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 min-w-[120px]">
                    Loại kho
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 min-w-[180px]">
                    Diện tích sàn
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 min-w-[240px]">
                    Tổng trong kho / Sức chứa
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 min-w-[220px]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paged.length > 0 ? (
                  paged.map((warehouse) => (
                    <tr
                      key={warehouse.id}
                      className="border-t border-slate-100 hover:bg-emerald-50/30 transition-colors"
                    >
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-slate-900 leading-5">
                          {warehouse.name}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-slate-600 max-w-xs">
                        <p className="line-clamp-2 leading-5">{warehouse.location}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            warehouse.titleWarehouse === "Cold"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {warehouse.titleWarehouse === "Cold"
                            ? "Kho lạnh"
                            : "Kho thường"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top text-right text-slate-700">
                        {(() => {
                          const fromApi = Number(warehouse.floorAreaM2 ?? 0);
                          const fromDimensions =
                            Number(warehouse.lengthM ?? 0) * Number(warehouse.widthM ?? 0);
                          const area = fromApi > 0 ? fromApi : fromDimensions;
                          return area > 0 ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-semibold tabular-nums text-slate-800">
                                {formatArea(area)} m²
                              </span>
                              {Number(warehouse.lengthM ?? 0) > 0 &&
                              Number(warehouse.widthM ?? 0) > 0 ? (
                                <span className="text-[11px] text-slate-500">
                                  {formatArea(warehouse.lengthM)} × {formatArea(warehouse.widthM)} m
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">Chưa có</span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-4 align-top text-right text-slate-700">
                        {(() => {
                          const storedInSlots = Number(warehouse.storedInSlotsWeight ?? 0);
                          const unassigned = Number(warehouse.unassignedStockWeight ?? 0);
                          const occupied = storedInSlots + unassigned;
                          const capacity = Number(warehouse.totalCapacity ?? 0);
                          const capacityUnset = capacity <= 0;
                          const overflow = capacityUnset
                            ? 0
                            : Math.max(0, occupied - capacity);
                          const isOverflow = overflow > 0;

                          return (
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`font-semibold tabular-nums ${
                              isOverflow ? "text-rose-700" : "text-slate-800"
                            }`}
                          >
                            {capacityUnset && occupied <= 0 ? (
                              <span className="font-medium text-slate-500">
                                Chưa có hàng · sức chứa: chưa cấu
                              </span>
                            ) : capacityUnset ? (
                              <>
                                {formatVolume(occupied)} m³{" "}
                                <span className="font-normal text-amber-800">
                                  (tổng sức chứa slot chưa cấu)
                                </span>
                              </>
                            ) : (
                              <>
                                {formatVolume(occupied)} / {formatVolume(capacity)} m³
                              </>
                            )}
                          </span>
                          {(storedInSlots > 0 || unassigned > 0) && (
                          <div className="flex flex-wrap justify-end gap-1">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                              Trong slot: {formatVolume(storedInSlots)} m³
                            </span>
                            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                              Chưa xếp: {formatVolume(unassigned)} m³
                            </span>
                          </div>
                          )}
                          {isOverflow && (
                            <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700 font-medium">
                              Vượt sức chứa: {formatVolume(overflow)} m³
                            </span>
                          )}
                        </div>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {!readOnlyActions ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(warehouse)}
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Pencil size={12} />
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenConfig(warehouse)}
                                className="inline-flex items-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Cấu hình
                              </button>
                            </>
                          ) : null}
                          <Link
                            to={`${warehouseBasePath}/${warehouse.id}/map`}
                            className="inline-flex items-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Sơ đồ
                          </Link>
                          {!readOnlyActions ? (
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(warehouse)}
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              <Trash2 size={12} />
                              Xóa
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-slate-500"
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
            <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-slate-500">
                Trang {currentPage} / {totalPages} — {totalItems} kho
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => {
                    if (!hasPrev) return;
                    setPageIndex((p) => {
                      const next = Math.max(1, p - 1);
                      updatePageInUrl(next);
                      return next;
                    });
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => {
                    if (!hasNext) return;
                    setPageIndex((p) => {
                      const next = p + 1;
                      updatePageInUrl(next);
                      return next;
                    });
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
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

