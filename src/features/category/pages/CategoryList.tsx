import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, Package, Plus, RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryStatusMutation,
} from "../api/category.api";
import type { Category } from "../types/category.type";
import EditCategoryModal from "../components/EditCategoryModal";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

const PAGE_SIZE = 10;

export default function CategoryList() {
  const { isManager } = useRoleGuard();
  const categoryBasePath = isManager() ? "/manager/categories" : "/admin/categories";
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page") ?? "1") || 1;

  const { data, isLoading, isError, error, refetch } = useGetCategoriesQuery();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateCategoryStatusMutation();

  const [pageIndex, setPageIndex] = useState(initialPage);
  const [searchText, setSearchText] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const list = (data ?? []) as Category[];
    const q = searchText.toLowerCase().trim();
    if (!q) return list;
    return list.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const desc = (c.description ?? "").toLowerCase();
      return name.includes(q) || desc.includes(q);
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
          : "Không tải được danh sách danh mục. Vui lòng thử lại.";

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

  const handleDelete = async (category: Category) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa danh mục "${category.name}"?`
    );
    if (!ok) return;

    const toastId = toast.loading("Đang xóa danh mục...");
    try {
      await deleteCategory(category.id).unwrap();
      await refetch();
      toast.success("Xóa danh mục thành công", { id: toastId });
    } catch (error) {
      console.error("Delete category failed:", error);
      toast.error("Xóa danh mục thất bại. Vui lòng thử lại.", { id: toastId });
    }
  };

  const handleToggleStatus = async (category: Category) => {
    const isActive = category.status === 1;
    const nextStatus = isActive ? 0 : 1;
    const actionLabel = isActive ? "vô hiệu hóa" : "kích hoạt";
    const ok = window.confirm(
      `Bạn có chắc muốn ${actionLabel} danh mục "${category.name}"?`
    );
    if (!ok) return;

    const toastId = toast.loading(`Đang ${actionLabel} danh mục...`);
    try {
      await updateStatus({ id: category.id, data: { status: nextStatus } }).unwrap();
      await refetch();
      toast.success(`Đã ${actionLabel} danh mục thành công`, { id: toastId });
    } catch (error) {
      console.error("Update category status failed:", error);
      toast.error(
        `Thao tác ${actionLabel} danh mục thất bại. Vui lòng thử lại.`,
        { id: toastId }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
      <div className="w-full max-w-[1600px] mx-auto">
        {/* Header — giống Danh sách NCC */}
        <div className="mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <Package size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Danh sách danh mục sản phẩm
              </h1>
            <p className="text-xs text-slate-400 mt-0.5">
                Quản lý danh mục dùng cho sản phẩm.
              </p>
            </div>
          </div>
          <Link
            to={`${categoryBasePath}/create`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg sm:w-auto"
          >
            <Plus size={16} />
            Thêm danh mục
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
              placeholder="Tìm theo tên / mô tả..."
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
            <table className="min-w-[860px] w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tên danh mục
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Mô tả
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
                  paged.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {c.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                        {c.description && c.description.trim().length > 0
                          ? c.description
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.status === 1 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Đã vô hiệu
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingCategoryId(c.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Pencil size={12} />
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleToggleStatus(c)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                          >
                            {c.status === 1 ? "Vô hiệu" : "Kích hoạt"}
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(c)}
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
                      Không tìm thấy danh mục phù hợp.
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
                Trang {currentPage} / {totalPages} — {totalItems} danh mục
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

      {editingCategoryId !== null && (
        <EditCategoryModal
          categoryId={editingCategoryId}
          onClose={() => setEditingCategoryId(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

