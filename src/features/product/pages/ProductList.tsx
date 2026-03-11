import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeleteProductMutation,
  useGetProductsQuery,
  useUpdateProductStatusMutation,
} from "../api/product.api";
import type { Product } from "../types/product.type";
import EditProductModal from "../components/EditProductModal";
import { useGetCategoriesQuery } from "../../category/api/category.api";
import type { Category } from "../../category/types/category.type";

const PAGE_SIZE = 10;
const DESC_PREVIEW_LEN = 50; // Số ký tự mô tả hiển thị trên bảng (1 dòng)

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page") ?? "1") || 1;

  const { data, isLoading, isError, refetch } = useGetProductsQuery();
  const { data: categoryData } = useGetCategoriesQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateProductStatusMutation();

  const [pageIndex, setPageIndex] = useState(initialPage);
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">(
    "all"
  );
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const categoryOptions = useMemo(
    () => (categoryData ?? []) as Category[],
    [categoryData]
  );

  const filtered = useMemo(() => {
    const list = (data ?? []) as Product[];
    const q = searchText.toLowerCase().trim();

    const selectedCategoryName =
      selectedCategoryId === "all"
        ? null
        : categoryOptions.find((c) => c.id === selectedCategoryId)?.name ?? null;

    return list.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const desc = (p.description ?? "").toLowerCase();
      const cat = (p.category ?? "").toLowerCase();

      const matchesText =
        !q || name.includes(q) || desc.includes(q) || cat.includes(q);

      const matchesCategory =
        !selectedCategoryName ||
        (p.category ?? "").toLowerCase() ===
          selectedCategoryName.toLowerCase();

      return matchesText && matchesCategory;
    });
  }, [data, searchText, selectedCategoryId, categoryOptions]);

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

  const handleDelete = async (product: Product) => {
    const ok = window.confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`);
    if (!ok) return;

    const toastId = toast.loading("Đang xóa sản phẩm...");
    try {
      await deleteProduct(product.id).unwrap();
      await refetch();
      toast.success("Xóa sản phẩm thành công", { id: toastId });
    } catch (error) {
      console.error("Delete product failed:", error);
      toast.error("Xóa sản phẩm thất bại. Vui lòng thử lại.", { id: toastId });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const current = product.isActive ?? true;
    const next = !current;
    const actionLabel = next ? "kích hoạt" : "vô hiệu hóa";

    const ok = window.confirm(
      `Bạn có chắc muốn ${actionLabel} sản phẩm "${product.name}"?`
    );
    if (!ok) return;

    const toastId = toast.loading(`Đang ${actionLabel} sản phẩm...`);
    try {
      await updateStatus({
        id: product.id,
        data: { isActive: next },
      }).unwrap();
      await refetch();
      toast.success(`Đã ${actionLabel} sản phẩm thành công`, { id: toastId });
    } catch (error) {
      console.error("Update product status failed:", error);
      toast.error(
        `Thao tác ${actionLabel} sản phẩm thất bại. Vui lòng thử lại.`,
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
              Quản lý sản phẩm
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Danh sách sản phẩm và danh mục liên quan.
            </p>
          </div>
          <Link
            to="/admin/products/create"
            className="inline-flex items-center rounded-lg bg-[#7FBB35] px-3 py-2 text-xs font-semibold text-white hover:bg-[#598325]"
          >
            + Thêm sản phẩm
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
            placeholder="Tìm theo tên / mô tả / danh mục..."
            className="w-full md:w-1/2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <select
            value={selectedCategoryId === "all" ? "all" : String(selectedCategoryId)}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCategoryId(value === "all" ? "all" : Number(value));
              setPageIndex(1);
              updatePageInUrl(1);
            }}
            className="w-full md:w-48 p-2.5 rounded-lg border border-slate-200 bg-white text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Tất cả danh mục</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {isError && (
          <p className="text-red-500 text-sm mb-3">
            Không tải được danh sách sản phẩm. Vui lòng thử lại.
          </p>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Ảnh</th>
                <th className="px-4 py-2 text-left font-medium">Tên sản phẩm</th>
                <th className="px-4 py-2 text-left font-medium">Danh mục</th>
                <th className="px-4 py-2 text-left font-medium w-[180px] max-w-[220px]">Mô tả</th>
                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-2 text-left font-medium">Ngày tạo</th>
                <th className="px-4 py-2 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paged.length > 0 ? (
                paged.map((p) => {
                  const createdAt = p.createdAt
                    ? new Date(p.createdAt).toLocaleString("vi-VN")
                    : "-";
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400">
                            Không có ảnh
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2">{p.category ?? "-"}</td>
                      <td className="px-4 py-2 w-[180px] max-w-[220px]">
                        <span
                          className="block overflow-hidden text-ellipsis whitespace-nowrap"
                          title={p.description?.trim() || undefined}
                        >
                          {p.description && p.description.trim().length > 0
                            ? p.description.length <= DESC_PREVIEW_LEN
                              ? p.description
                              : p.description.slice(0, DESC_PREVIEW_LEN) + "..."
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                        </span>
                      </td>
                      <td className="px-4 py-2">{createdAt}</td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setDetailProduct(p)}
                          className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <FileText size={13} className="mr-1" />
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleToggleStatus(p)}
                          className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {p.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(p)}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={13} className="mr-1" />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Không tìm thấy sản phẩm phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs md:text-sm">
            <p className="text-slate-500">
              Trang {currentPage} / {totalPages} — {totalItems} sản phẩm
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

      {detailProduct !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDetailProduct(null)}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Chi tiết sản phẩm</h3>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {detailProduct.imageUrl && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Ảnh</p>
                  <img
                    src={detailProduct.imageUrl}
                    alt={detailProduct.name}
                    className="h-24 w-24 rounded-lg object-cover border border-slate-200"
                  />
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Tên sản phẩm</p>
                <p className="text-sm text-slate-800">{detailProduct.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Danh mục</p>
                <p className="text-sm text-slate-800">{detailProduct.category ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Mô tả</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                  {detailProduct.description && detailProduct.description.trim().length > 0
                    ? detailProduct.description
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Trạng thái</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    detailProduct.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {detailProduct.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                </span>
              </div>
              {detailProduct.createdAt && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Ngày tạo</p>
                  <p className="text-sm text-slate-700">
                    {new Date(detailProduct.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(detailProduct.id);
                  setDetailProduct(null);
                }}
                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Pencil size={14} className="mr-1.5" />
                Sửa
              </button>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProductId !== null && (
        <EditProductModal
          productId={editingProductId}
          onClose={() => setEditingProductId(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

