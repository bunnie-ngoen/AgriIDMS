import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeleteSupplierMutation,
  useGetSuppliersQuery,
} from "../api/supplier.api";
import type { Supplier } from "../types/supplier.type";
import EditSupplierModal from "../components/EditSupplierModal";

const PAGE_SIZE = 10;

export default function SupplierList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page") ?? "1") || 1;

  const { data, isLoading, isError, refetch } = useGetSuppliersQuery();
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
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Danh sách nhà cung cấp
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý thông tin nhà cung cấp trong hệ thống.
            </p>
          </div>
          <Link
            to="/admin/suppliers/create"
            className="inline-flex items-center rounded-lg bg-[#7FBB35] px-3 py-2 text-xs font-semibold text-white hover:bg-[#598325]"
          >
            + Thêm nhà cung cấp
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
            placeholder="Tìm theo tên / sđt / địa chỉ..."
            className="w-full md:w-1/2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {isError && (
          <p className="text-red-500 text-sm mb-3">
            Không tải được danh sách nhà cung cấp. Vui lòng thử lại.
          </p>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Tên NCC</th>
                <th className="px-4 py-2 text-left font-medium">Địa chỉ</th>
                <th className="px-4 py-2 text-left font-medium">Số điện thoại</th>
                <th className="px-4 py-2 text-right font-medium">Thao tác</th>
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
                paged.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.address ?? "-"}</td>
                    <td className="px-4 py-2">{s.phone ?? "-"}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingSupplierId(s.id)}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil size={13} className="mr-1" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(s)}
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
                    Không tìm thấy nhà cung cấp phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs md:text-sm">
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

