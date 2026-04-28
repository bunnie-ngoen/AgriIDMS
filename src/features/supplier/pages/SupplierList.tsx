import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, Building2, Plus, RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeleteSupplierMutation,
  useGetSuppliersQuery,
} from "../api/supplier.api";
import type { Supplier } from "../types/supplier.type";
import EditSupplierModal from "../components/EditSupplierModal";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

const PAGE_SIZE = 10;

export default function SupplierList() {
  const { isManager } = useRoleGuard();
  const supplierBasePath = isManager() ? "/manager/suppliers" : "/admin/suppliers";
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page") ?? "1") || 1;

  const { data, isLoading, isError, error, refetch } = useGetSuppliersQuery();
  const [deleteSupplier, { isLoading: isDeleting }] =
    useDeleteSupplierMutation();

  const [pageIndex, setPageIndex] = useState(initialPage);
  const [searchText, setSearchText] = useState("");
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(
    null
  );

  const filtered = useMemo(() => {
    const list = (data ?? []) as Supplier[];
    const q = searchText.toLowerCase().trim();
    if (!q) return list;
    return list.filter((s) => {
      const name = (s.name ?? "").toLowerCase();
      const phone = (s.phone ?? "").toLowerCase();
      const address = (s.address ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q) || address.includes(q);
    });
  }, [data, searchText]);

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
          : "Không tải được danh sách nhà cung cấp. Vui lòng thử lại.";

  const handleDelete = async (supplier: Supplier) => {
    const ok = window.confirm(`Bạn có chắc muốn xóa NCC "${supplier.name}"?`);
    if (!ok) return;

    const toastId = toast.loading("Đang xóa nhà cung cấp...");
    try {
      await deleteSupplier(supplier.id).unwrap();
      // List will auto-refresh via RTK Query invalidation,
      // but refetch keeps UI snappy even if caching is disabled.
      await refetch();
      toast.success("Xóa nhà cung cấp thành công", { id: toastId });
    } catch (error) {
      console.error("Delete supplier failed:", error);
      toast.error(
        "Xóa nhà cung cấp thất bại. Có thể nhà cung cấp đang được dùng trong phiếu nhập/đơn mua.",
        { id: toastId }
      );
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
      <div className="w-full max-w-[1600px] mx-auto">
        {/* Header — giống Danh sách kho */}
        <div className="mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <Building2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Danh sách nhà cung cấp
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý thông tin nhà cung cấp trong hệ thống.
              </p>
            </div>
          </div>
          <Link
            to={`${supplierBasePath}/create`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg sm:w-auto"
          >
            <Plus size={16} />
            Thêm nhà cung cấp
          </Link>
        </div>

        {/* Card nội dung */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Bộ lọc */}
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPageIndex(1);
                updatePageInUrl(1);
              }}
              placeholder="Tìm theo tên / sđt / địa chỉ..."
              className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
            />
          </div>

          {isError && (
            <div className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tên NCC
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Địa chỉ
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Số điện thoại
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paged.length > 0 ? (
                  paged.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {s.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                        {s.address ?? "-"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {s.phone ?? "-"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingSupplierId(s.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Pencil size={12} />
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(s)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 size={12} />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      Không tìm thấy nhà cung cấp phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalItems > 0 && (
            <div className="border-t border-slate-100 px-4 py-4 text-sm sm:px-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-slate-500">
                Trang {currentPage} / {totalPages} — {totalItems} NCC
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

      {editingSupplierId !== null && (
        <EditSupplierModal
          supplierId={editingSupplierId}
          onClose={() => setEditingSupplierId(null)}
          onSuccess={() => {
            // Should be auto-refetched via invalidation, but keep it safe.
            refetch();
          }}
        />
      )}
    </div>
  );
}

