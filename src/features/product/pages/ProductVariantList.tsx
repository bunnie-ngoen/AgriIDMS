import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetProductVariantsQuery,
  useDeleteProductVariantMutation,
} from "../api/product-variant.api";
import type { ProductVariant } from "../types/product-variant.type";
import {
  Plus, Pencil, Trash2, AlertTriangle, PackageOpen,
  ImageOff, TrendingUp, Package, Activity, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { useToggleProductVariantStatusMutation } from "../api/product-variant.api";


type ConfirmState = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
};
const CONFIRM_INITIAL: ConfirmState = { open: false, title: "", description: "", onConfirm: () => { } };

const ConfirmModal = ({ open, title, description, onConfirm, onCancel }: ConfirmState & { onCancel: () => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-slate-100">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h3 className="text-center text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-center text-xs text-slate-400 mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Hủy bỏ
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm">
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductVariantList = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetProductVariantsQuery();
  const [deleteVariant, { isLoading: isDeleting }] = useDeleteProductVariantMutation();
  const [toggleStatus] = useToggleProductVariantStatusMutation();
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_INITIAL);
  const closeConfirm = () => setConfirm(CONFIRM_INITIAL);

  const activeCount = data?.filter((v) => v.isActive).length ?? 0;
  const totalCount = data?.length ?? 0;
  const handleToggleStatus = (variant: ProductVariant) => {
    const nextStatus = !variant.isActive;
    setConfirm({
      open: true,
      title: nextStatus ? "Kích hoạt variant" : "Vô hiệu hóa variant",
      description: `Bạn có chắc muốn ${nextStatus ? "kích hoạt" : "vô hiệu hóa"} variant #${variant.id} — "${variant.productName}"?`,
      onConfirm: async () => {
        closeConfirm();
        const toastId = toast.loading("Đang cập nhật...");
        try {
          await toggleStatus({ id: variant.id, isActive: nextStatus }).unwrap();
          toast.success("Cập nhật trạng thái thành công!", { id: toastId });
        } catch {
          toast.error("Cập nhật thất bại!", { id: toastId });
        }
      },
    });
  };

  const handleDelete = (variant: ProductVariant) => {
    setConfirm({
      open: true,
      title: "Xóa biến thể sản phẩm",
      description: `Xóa variant #${variant.id} — "${variant.productName}" sẽ không thể hoàn tác.`,
      onConfirm: async () => {
        closeConfirm();
        const toastId = toast.loading("Đang xóa...");
        try {
          await deleteVariant(variant.id).unwrap();
          toast.success("Xóa thành công!", { id: toastId });
        } catch {
          toast.error("Xóa thất bại!", { id: toastId });
        }
      },
    });
  };

  return (
    <div className="px-5 py-2 space-y-5">
      <ConfirmModal {...confirm} onCancel={closeConfirm} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Variants</h1>
          <p className="text-xs text-slate-400 mt-0.5">Quản lý toàn bộ biến thể sản phẩm trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/product-variants/create")}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Plus size={14} />
          Thêm Variant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng variant", value: totalCount, icon: Package, color: "bg-blue-50 text-blue-600 border-blue-100" },
          { label: "Đang hoạt động", value: activeCount, icon: Activity, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { label: "Không hoạt động", value: totalCount - activeCount, icon: TrendingUp, color: "bg-orange-50 text-orange-600 border-orange-100" },
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Giá</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hạn SD</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-10 w-10 rounded-xl bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-32 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-16 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-20 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-16 rounded bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 rounded-full bg-slate-100" /></td>
                    <td className="px-5 py-4"><div className="h-7 w-24 rounded-lg bg-slate-100 ml-auto" /></td>
                  </tr>
                ))
              ) : data && data.length > 0 ? (
                data.map((variant) => (
                  <tr key={variant.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      {variant.imageUrl ? (
                        <img
                          src={variant.imageUrl}
                          alt={variant.productName}
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
                      <p className="text-sm font-semibold text-slate-800">{variant.productName}</p>
                      <p className="text-[11px] text-slate-400">ID #{variant.id}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                        Grade {variant.grade}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-800">{variant.price.toLocaleString("vi-VN")}đ</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-600">{variant.shelfLifeDays.toLocaleString()} ngày</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(variant)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all hover:scale-105 ${variant.isActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                          }`}
                        title="Click để đổi trạng thái"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${variant.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {variant.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/product-variants/${variant.id}/edit`, { state: { variant } })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                        >
                          <Pencil size={11} />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(variant)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Trash2 size={11} />
                          Xóa
                        </button>
                        <button
                          onClick={() => navigate(`/admin/product-variants/${variant.id}/detail`, { state: { variant } })}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-sky-500 hover:bg-sky-50 transition-all"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <PackageOpen size={28} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">Chưa có product variant nào</p>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/product-variants/create")}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Tạo variant đầu tiên →
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantList;