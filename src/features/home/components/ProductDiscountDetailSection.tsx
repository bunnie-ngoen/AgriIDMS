import type { HomeProductDiscountViewModel } from "../utils/productDiscountDisplay";

type Props = {
    model: HomeProductDiscountViewModel;
};

function formatVnd(n: number): string {
    return `${n.toLocaleString("vi-VN")} ₫/kg`;
}

/**
 * Chi tiết giảm giá — chỉ dùng trên trang chi tiết sản phẩm (không dùng trên danh sách).
 */
export default function ProductDiscountDetailSection({ model }: Props) {
    if (!model.hasDiscount) return null;

    const { basePricePerKg, salePricePerKg, discountPercent } = model;

    return (
        <div className="mt-2 rounded-xl border border-red-100 bg-gradient-to-br from-red-50 via-rose-50/80 to-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Ưu đãi đang áp dụng</p>
            <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                    <p className="text-xs text-slate-500">Giá niêm yết</p>
                    <p className="text-lg text-slate-400 line-through tabular-nums">{formatVnd(basePricePerKg)}</p>
                </div>
                {salePricePerKg != null ? (
                    <div>
                        <p className="text-xs font-medium text-red-700">Giá ưu đãi</p>
                        <p className="text-2xl font-bold tabular-nums text-red-600">{formatVnd(salePricePerKg)}</p>
                    </div>
                ) : null}
                {discountPercent != null && discountPercent > 0 ? (
                    <span className="inline-flex items-center rounded-lg border border-rose-300 bg-rose-100 px-2.5 py-1 text-sm font-bold text-red-600 tabular-nums shadow-sm">
                        −{discountPercent.toLocaleString("vi-VN")}%
                    </span>
                ) : null}
            </div>
        </div>
    );
}
