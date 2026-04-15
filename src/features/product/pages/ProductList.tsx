import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, FileText, X, Plus, Package, Activity, PackageOpen, ImageOff } from "lucide-react";
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

function formatProductCreatedAt(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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

  const allProducts = (data ?? []) as Product[];
  const activeCount = allProducts.filter((p) => p.isActive !== false).length;
  const inactiveCount = allProducts.length - activeCount;

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
    <div className="px-5 py-2 space-y-5">
      {/* Header — giống ProductVariantList */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Danh sách sản phẩm
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý toàn bộ sản phẩm và danh mục liên quan trong hệ thống
          </p>
        </div>
        <Link
          to="/admin/products/create"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Plus size={14} />
          Thêm sản phẩm
        </Link>
      </div>

      {/* Stats — giống ProductVariantList */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng sản phẩm", value: allProducts.length, icon: Package, color: "bg-blue-50 text-blue-600 border-blue-100" },
          { label: "Đang hoạt động", value: activeCount, icon: Activity, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { label: "Vô hiệu hóa", value: inactiveCount, icon: PackageOpen, color: "bg-orange-50 text-orange-600 border-orange-100" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-[11px] text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bộ lọc + Table card — giống ProductVariantList */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPageIndex(1);
              updatePageInUrl(1);
            }}
            placeholder="Tìm theo tên / mô tả / danh mục..."
            className="flex-1 min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
          />
          <select
            value={selectedCategoryId === "all" ? "all" : String(selectedCategoryId)}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCategoryId(value === "all" ? "all" : Number(value));
              setPageIndex(1);
              updatePageInUrl(1);
            }}
            className="w-full sm:w-44 rounded-xl border border-slate-200 px-4 py-2.5 pr-9 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all appearance-none"
          >
            <option value="all">Tất cả danh mục</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {isError && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100">
            <p className="text-xs text-red-500">Không tải được dữ liệu. Vui lòng thử lại.</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ảnh</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Danh mục</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider max-w-[200px]">Mô tả</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-10 w-10 rounded-xl bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-32 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-20 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-40 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 rounded-full bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-24 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-7 w-28 rounded-lg bg-slate-100 ml-auto" /></td>
                  </tr>
                ))
              ) : paged.length > 0 ? (
                paged.map((p) => {
                  const createdAt = formatProductCreatedAt(p.createdAt);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                            <ImageOff size={14} className="text-slate-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600">{p.category ?? "-"}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <span
                          className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-600"
                          title={p.description?.trim() || undefined}
                        >
                          {p.description && p.description.trim().length > 0
                            ? p.description.length <= DESC_PREVIEW_LEN
                              ? p.description
                              : p.description.slice(0, DESC_PREVIEW_LEN) + "..."
                            : "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.isActive !== false ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                            Vô hiệu
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{createdAt}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => setDetailProduct(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            <FileText size={11} />
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleToggleStatus(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-50"
                          >
                            {p.isActive !== false ? "Vô hiệu" : "Kích hoạt"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProductId(p.id);
                              setDetailProduct(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                          >
                            <Pencil size={11} />
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Trash2 size={11} />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <PackageOpen size={28} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">Chưa có sản phẩm nào</p>
                      <Link
                        to="/admin/products/create"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Tạo sản phẩm đầu tiên →
                      </Link>
                    </div>
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

      {detailProduct !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setDetailProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-product-title"
        >
          <div
            className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <Package size={14} className="text-white" />
                </div>
                <div>
                  <h3 id="detail-product-title" className="text-base font-semibold text-slate-900">
                    Chi tiết sản phẩm
                  </h3>
                  <p className="text-[11px] text-slate-400">Xem thông tin sản phẩm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {detailProduct.imageUrl && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Ảnh</p>
                  <img
                    src={detailProduct.imageUrl}
                    alt={detailProduct.name}
                    className="h-28 w-28 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Tên sản phẩm</p>
                <p className="text-sm font-medium text-slate-800">{detailProduct.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Danh mục</p>
                <p className="text-sm text-slate-800">{detailProduct.category ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Mô tả</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                  {detailProduct.description && detailProduct.description.trim().length > 0
                    ? detailProduct.description
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Trạng thái</p>
                <span
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                    detailProduct.isActive !== false
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}
                >
                  {detailProduct.isActive !== false ? (
                    <><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />Đang hoạt động</>
                  ) : (
                    <><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />Đã vô hiệu</>
                  )}
                </span>
              </div>
              {detailProduct.createdAt && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Ngày tạo</p>
                  <p className="text-sm text-slate-600">
                    {formatProductCreatedAt(detailProduct.createdAt)}
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 bg-white shadow-sm"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(detailProduct.id);
                  setDetailProduct(null);
                }}
                className="flex-[2] rounded-2xl py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <Pencil size={14} />
                Sửa sản phẩm
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

