import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryStatusMutation,
} from "../api/category.api";
import type { Category } from "../types/category.type";
import EditCategoryModal from "../components/EditCategoryModal";

const PAGE_SIZE = 10;

export default function CategoryList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page") ?? "1") || 1;

  const { data, isLoading, isError, refetch } = useGetCategoriesQuery();
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

  const handleChangeStatus = async (category: Category, status: number) => {
    const actionLabel = status === 1 ? "kích hoạt" : "vô hiệu hóa";
    const ok = window.confirm(
      `Bạn có chắc muốn ${actionLabel} danh mục "${category.name}"?`
    );
    if (!ok) return;

    const toastId = toast.loading(`Đang ${actionLabel} danh mục...`);
    try {
      await updateStatus({ id: category.id, data: { status } }).unwrap();
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
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Danh mục sản phẩm
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý danh mục (Category) dùng cho sản phẩm.
            </p>
          </div>
          <Link
            to="/admin/categories/create"
            className="inline-flex items-center rounded-lg bg-[#7FBB35] px-3 py-2 text-xs font-semibold text-white hover:bg-[#598325]"
          >
            + Thêm danh mục
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPageIndex(1);
              updatePageInUrl(1);
            }}
            placeholder="Tìm theo tên / mô tả..."
            className="w-full md:w-1/2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {isError && (
          <p className="text-red-500 text-sm mb-3">
            Không tải được danh sách danh mục. Vui lòng thử lại.
          </p>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Tên danh mục</th>
                <th className="px-4 py-2 text-left font-medium">Mô tả</th>
                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-2 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paged.length > 0 ? (
                paged.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">
                      {c.description && c.description.trim().length > 0
                        ? c.description
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600">
                        Trạng thái nội bộ
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(c.id)}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil size={13} className="mr-1" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleChangeStatus(c, 1)}
                        className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        Kích hoạt
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(c)}
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
                    colSpan={3}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Không tìm thấy danh mục phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs md:text-sm">
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
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 disabled:opacity-40"
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
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
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

