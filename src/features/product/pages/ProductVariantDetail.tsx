import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ProductVariant } from "../types/product-variant.type";
import {
  ArrowLeft, PencilLine, Tag, Clock, BadgeDollarSign,
  ImageIcon, CheckCircle2, XCircle, Hash
} from "lucide-react";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

const DetailRow = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
    <span className={`text-sm font-semibold ${accent ? "text-slate-900" : "text-slate-600"}`}>{value}</span>
  </div>
);

const ProductVariantDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isManager } = useRoleGuard();
  const productVariantBasePath = isManager()
    ? "/manager/product-variants"
    : "/admin/product-variants";
  const variant = location.state?.variant as ProductVariant | undefined;

  useEffect(() => {
    if (!variant) navigate(productVariantBasePath);
  }, [variant, navigate, productVariantBasePath]);

  if (!variant) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8 sm:flex-nowrap sm:gap-4">
          <button onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-sky-500" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chi tiết Variant</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">
              <span className="font-semibold text-slate-500">#{variant.id}</span>
              {" — "}
              <span className="text-slate-500">{variant.productName}</span>
            </p>
          </div>
          <button
            onClick={() => navigate(`${productVariantBasePath}/${variant.id}/edit`, { state: { variant } })}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <PencilLine size={13} />
            Chỉnh sửa
          </button>
        </div>

        {/* Image + Status */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-50 flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <ImageIcon size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Hình ảnh</span>
          </div>
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {variant.imageUrl ? (
              <img src={variant.imageUrl} alt={variant.productName}
                className="w-40 h-40 rounded-2xl object-cover border-2 border-slate-200 shadow-lg" />
            ) : (
              <div className="w-40 h-40 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                <ImageIcon size={28} className="text-slate-300" />
                <span className="text-[11px] text-slate-400">Chưa có ảnh</span>
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Trạng thái</p>
                {variant.isActive ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600">Đang hoạt động</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
                    <XCircle size={13} className="text-red-400" />
                    <span className="text-xs font-semibold text-red-500">Không hoạt động</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Variant ID</p>
                <span className="text-2xl font-black text-slate-900">#{variant.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-50 flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Tag size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Thông tin sản phẩm</span>
          </div>
          <div className="px-4 sm:px-6 py-2">
            <DetailRow label="Tên sản phẩm" value={variant.productName} accent />
            <DetailRow label="Product ID" value={`#${variant.productId}`} />
            <DetailRow label="Hàng loại" value={
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                Hàng loại {variant.grade}
              </span>
            } />
          </div>
        </div>

        {/* Price, ShelfLife & MinReceiptWeight */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-50 flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
              <BadgeDollarSign size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Giá, Hạn sử dụng & Định mức nhập</span>
          </div>
          <div className="px-4 sm:px-6 py-2">
            <DetailRow label="Giá bán" value={
              <span className="text-emerald-600 font-black text-base">
                {variant.price.toLocaleString("vi-VN")} ₫
              </span>
            } />
            <DetailRow label="Hạn sử dụng" value={
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                <span>{variant.shelfLifeDays} ngày</span>
              </div>
            } />
            <DetailRow
              label="Định mức tối thiểu (kg)"
              value={
                typeof variant.minReceiptWeight === "number"
                  ? `${variant.minReceiptWeight} kg`
                  : "—"
              }
            />
            <DetailRow
              label="Khối lượng riêng (kg/m3)"
              value={variant.densityKgPerM3 > 0 ? `${variant.densityKgPerM3} kg/m3` : "—"}
            />
            <DetailRow
              label="Box khả dụng"
              value={
                typeof variant.availableBoxCount === "number"
                  ? variant.availableBoxCount.toLocaleString()
                  : "0"
              }
            />
          </div>
        </div>

        {/* Bottom action */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1 pb-4 sm:pb-6">
          <button onClick={() => navigate(-1)}
            className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all duration-200 bg-white shadow-sm">
            Quay lại
          </button>
          <button
            onClick={() => navigate(`${productVariantBasePath}/${variant.id}/edit`, { state: { variant } })}
            className="flex-[2] rounded-2xl py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <PencilLine size={14} />
            Chỉnh sửa Variant
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantDetail;