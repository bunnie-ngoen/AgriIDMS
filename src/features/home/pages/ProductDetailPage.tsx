import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
    Leaf,
    ShoppingCart,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    Package,
    Clock,
    Sparkles,
    Star,
} from "lucide-react";
import { useGetHomeProductDetailQuery, useAddToCartMutation } from "../api/home.api";
import { validateAddToCartRequest, type BoxType } from "../schemas/home.schema";
import { ROUTES } from "../../../shared/constants/routes";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import toast from "react-hot-toast";
import { useGetApprovedReviewsByProductVariantQuery } from "../../review/api/review.api";
import { stripGradeSuffixFromProductName } from "../utils/productDisplayName";
import { getHomeProductDiscountViewModel } from "../utils/productDiscountDisplay";
import { boxTypeKey } from "../components/ProductBoxTypeSection";

// ─── Skeleton loading ────────────────────────────────────────

function DetailSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-pulse pb-14">
                <div className="h-10 w-40 bg-slate-200 rounded-full mb-8" />
                <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                        <div className="aspect-square rounded-2xl bg-slate-200" />
                        <div className="space-y-5">
                            <div className="h-4 w-24 bg-slate-100 rounded-full" />
                            <div className="h-9 w-4/5 bg-slate-200 rounded-lg" />
                            <div className="flex gap-2">
                                <div className="h-8 w-20 bg-slate-100 rounded-full" />
                                <div className="h-8 w-24 bg-slate-100 rounded-full" />
                            </div>
                            <div className="h-24 rounded-2xl bg-slate-100 mt-4" />
                            <div className="space-y-3 mt-6">
                                <div className="h-16 rounded-xl bg-slate-100" />
                                <div className="h-16 rounded-xl bg-slate-100" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const productId = id != null ? Number(id) : NaN;
    const skip = !Number.isFinite(productId);

    const { data: product, isLoading, isError, refetch } = useGetHomeProductDetailQuery(productId, { skip });
    const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
    const { data: approvedReviews } = useGetApprovedReviewsByProductVariantQuery(
        { productVariantId: productId, skip: 0, take: 10 },
        { skip },
    );

    const [quantity, setQuantity] = useState(1);
    const [selectedBox, setSelectedBox] = useState<BoxType | null>(null);

    const sanitizeMessage = (raw: string): string => {
        // Một số BE trả stack trace dài trong message; chỉ lấy phần thông báo đầu tiên.
        const firstLine = raw.split("\n")[0]?.trim() ?? raw;
        const cutAtStack = firstLine.split(" at ")[0]?.trim() ?? firstLine;
        return cutAtStack || "Có lỗi xảy ra. Vui lòng thử lại.";
    };

    const getApiErrorMessage = (error: unknown): string => {
        const fallback = "Không thêm được vào giỏ. Vui lòng thử lại.";
        const err = error as FetchBaseQueryError | undefined;
        if (!err || typeof err !== "object" || !("status" in err)) return fallback;

        if (err.status === 401 || err.status === 403) {
            return "Bạn cần đăng nhập tài khoản Customer để thêm vào giỏ.";
        }

        const data = "data" in err ? err.data : undefined;
        if (data && typeof data === "object") {
            const anyData = data as {
                message?: string;
                title?: string;
                detail?: string;
                errors?: Record<string, string[]>;
            };

            if (anyData.message) return sanitizeMessage(anyData.message);
            if (anyData.detail) return sanitizeMessage(anyData.detail);
            if (anyData.title) return sanitizeMessage(anyData.title);
            if (anyData.errors) {
                const firstKey = Object.keys(anyData.errors)[0];
                const firstErr = firstKey ? anyData.errors[firstKey]?.[0] : undefined;
                if (firstErr) return sanitizeMessage(firstErr);
            }
        }

        return fallback;
    };

    const handleAddToCart = async () => {
        if (!product || !selectedBox) return;
        const body = {
            productVariantId: product.id,
            boxWeight: selectedBox.weight,
            isPartial: selectedBox.boxType === "Partial",
            quantity,
        };
        const checked = validateAddToCartRequest(body);
        if (!checked.ok) {
            toast.error(checked.message);
            return;
        }
        try {
            await addToCart(checked.value).unwrap();
            toast.success("Đã thêm vào giỏ hàng.");
        } catch (error) {
            const msg = getApiErrorMessage(error);
            toast.error(msg);
        }
    };

    const canAddToCart = product && selectedBox && selectedBox.availableCount > 0 && quantity > 0;

    if (skip || isLoading) return <DetailSkeleton />;
    if (isError) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-slate-200/80">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <AlertCircle size={32} />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">Không tải được chi tiết sản phẩm</p>
                    <p className="mt-1 text-sm text-slate-500">Vui lòng kiểm tra kết nối và thử lại.</p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="rounded-xl bg-[#1a5f2a] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#145026]"
                        >
                            Thử lại
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.HOME)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={18} />
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    if (!product) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 py-16">
                <p className="text-slate-600 mb-6">Không tìm thấy sản phẩm.</p>
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.HOME)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-[#1a5f2a] shadow-sm transition hover:bg-emerald-50"
                >
                    <ArrowLeft size={18} />
                    Về trang chủ
                </button>
            </div>
        );
    }

    const imageUrl = product.imageUrl && product.imageUrl.trim() !== "" ? product.imageUrl : null;
    const displayName = stripGradeSuffixFromProductName(product.productName);
    const gradeLabel = product.grade === 1 ? "Loại 1" : product.grade === 2 ? "Loại 2" : product.grade === 3 ? "Loại 3" : `Hạng ${product.grade}`;
    const discountVm = getHomeProductDiscountViewModel(product);
    const needsBoxListScroll = product.boxTypes.length > 4;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 [scrollbar-gutter:stable]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-12 sm:pb-14">
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.HOME)}
                    className="group inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-[#1a5f2a]/30 hover:bg-emerald-50/80 hover:text-[#1a5f2a]"
                >
                    <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
                    Về trang chủ
                </button>

                <div className="mt-6 sm:mt-8 rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/40 ring-1 ring-slate-200/60 sm:p-8 lg:p-10">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1a5f2a]/80">
                        Chi tiết sản phẩm
                    </p>

                    {/* @container: max-h cột phải = cạnh ảnh vuông ≈ (100% − gap) / 2 → calc(50cqw − 1rem) với gap-8 */}
                    <div className="@container mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
                        {/* Ảnh — aspect-square full nửa cột */}
                        <div className="w-full min-w-0">
                            <div className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-md ring-1 ring-slate-200/80 sm:max-w-xl lg:mx-0 lg:max-w-none">
                                <div
                                    className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-[#1a5f2a]/10 via-transparent to-emerald-100/50 blur-sm"
                                    aria-hidden
                                />
                                {discountVm.hasDiscount ? (
                                    <div
                                        className="absolute right-2 top-2 z-10 rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg"
                                        title="Giảm giá"
                                    >
                                        Giảm Giá
                                    </div>
                                ) : null}
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={displayName}
                                        className="relative z-[1] h-full w-full object-cover object-center"
                                    />
                                ) : (
                                    <div className="relative z-[1] flex h-full min-h-[12rem] w-full items-center justify-center bg-slate-100/80">
                                        <Leaf className="text-slate-300" size={88} strokeWidth={1.25} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card phải: giới hạn chiều cao = ảnh trái; dư nội dung cuộn trong card */}
                        <div className="flex min-h-0 w-full min-w-0 flex-col lg:max-h-[calc(50cqw-1rem)] lg:overflow-hidden">
                            <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 lg:p-6 [scrollbar-gutter:stable] [scrollbar-width:thin]">
                                <div className="shrink-0 border-b border-slate-100 pb-4">
                                <h1 className="text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-[1.65rem] lg:text-3xl">
                                    {displayName}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#145026] ring-1 ring-[#1a5f2a]/15">
                                        {gradeLabel}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                            product.availableBoxCount > 0
                                                ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                                                : "bg-red-50 text-red-700 ring-red-200/80"
                                        }`}
                                    >
                                        <Package size={14} strokeWidth={2.5} />
                                        {product.availableBoxCount > 0 ? "Còn hàng" : "Hết hàng"}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:text-xs">
                                            Giá niêm yết
                                        </p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#b03030] sm:text-3xl lg:text-[2rem]">
                                            {product.price.toLocaleString("vi-VN")}
                                            <span className="ml-1.5 text-lg font-semibold text-[#c0392b]/90 sm:text-xl">₫/kg</span>
                                        </p>
                                    </div>
                                    <span className="inline-flex shrink-0 items-center gap-1.5 self-start text-right text-xs leading-snug text-slate-600 sm:max-w-[12rem] sm:self-auto sm:text-[13px]">
                                        <Clock size={16} className="shrink-0 text-slate-400" />
                                        Hạn dùng:{" "}
                                        <strong className="font-semibold text-slate-800">{product.shelfLifeDays} ngày</strong>
                                    </span>
                                </div>
                                {product.hasNearExpiryStock && product.nearExpiryPriceTiers.length > 0 ? (
                                    <div className="mt-3 space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 sm:p-3.5">
                                        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                                            <Sparkles size={14} className="shrink-0" />
                                            Giảm giá ưu đãi sản phẩm
                                        </p>
                                        {product.nearExpiryPriceTiers.map((tier) => (
                                            <div
                                                key={tier.maxDaysLeft}
                                                className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-amber-900 sm:text-xs"
                                            >
                                                <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold">
                                                    Áp dụng trong {tier.maxDaysLeft} ngày
                                                </span>
                                                <span className="font-semibold">
                                                    −{tier.discountPercent.toLocaleString("vi-VN")}%
                                                </span>
                                                <span className="font-bold">
                                                    {tier.pricePerKg.toLocaleString("vi-VN")} ₫/kg
                                                </span>
                                                <span className="text-amber-700/90">({tier.boxCount} hộp)</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                                </div>

                            <div
                                className={`flex flex-col pt-6 ${
                                    needsBoxListScroll ? "min-h-0 flex-1" : "shrink-0"
                                }`}
                            >
                                <h3 className="shrink-0 text-sm font-bold uppercase tracking-wide text-slate-800 lg:text-base">
                                    Chọn loại hộp
                                </h3>
                                {product.boxTypes.length > 0 ? (
                                    <div
                                        className={`mt-3 grid gap-2.5 ${
                                            product.boxTypes.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
                                        } ${
                                            needsBoxListScroll
                                                ? "min-h-0 max-h-[min(42vh,16rem)] flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] [scrollbar-width:thin]"
                                                : ""
                                        }`}
                                    >
                                        {product.boxTypes.map((box) => {
                                            const key = boxTypeKey(box);
                                            const isSelected = selectedBox ? boxTypeKey(selectedBox) === key : false;
                                            const boxLabel = box.boxType === "Partial" ? "Hộp lẻ" : "Hộp đầy";
                                            const disabled = box.availableCount <= 0;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setSelectedBox(box)}
                                                    disabled={disabled}
                                                    className={`box-border min-h-[4rem] w-full rounded-xl border-2 border-solid px-3.5 py-3 text-left text-base shadow-none outline-none transition-[background-color,border-color,color] [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a5f2a]/35 sm:min-h-0 ${
                                                        disabled
                                                            ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-55"
                                                            : isSelected
                                                              ? "border-[#1a5f2a] bg-emerald-50/90"
                                                              : "border-slate-200 bg-white hover:border-[#1a5f2a]/40"
                                                    }`}
                                                >
                                                    <span className="font-semibold text-slate-900">
                                                        {boxLabel}{" "}
                                                        <span className="text-[#1a5f2a]">· {box.weight} kg</span>
                                                    </span>
                                                    <span className="mt-1 block text-sm text-slate-600">
                                                        Còn <strong>{box.availableCount}</strong> hộp ·{" "}
                                                        <span className="font-semibold text-slate-800">
                                                            {box.boxPrice.toLocaleString("vi-VN")} ₫/hộp
                                                        </span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                                        Hiện chưa có loại hộp nào để bán cho sản phẩm này.
                                    </p>
                                )}
                            </div>

                                <div className="mt-5 shrink-0 border-t border-slate-100 pt-4">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 lg:text-base">
                                    Đặt hàng
                                </h3>
                                {/* Giữ chỗ cố định — đổi nội dung khi đã chọn hộp để trang không nhảy / co */}
                                {product.boxTypes.length > 0 ? (
                                    <div className="mt-2 flex min-h-[2.75rem] items-center">
                                        {!selectedBox ? (
                                            <p className="flex items-center gap-2 text-xs font-medium leading-snug text-amber-800 sm:text-sm">
                                                <AlertCircle size={15} className="shrink-0" aria-hidden />
                                                Chọn loại hộp trước khi thêm vào giỏ.
                                            </p>
                                        ) : (
                                            <p className="flex items-center gap-2 text-xs font-medium leading-snug text-emerald-800 sm:text-sm">
                                                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" aria-hidden />
                                                Đã chọn loại hộp — chỉnh số lượng rồi thêm vào giỏ.
                                            </p>
                                        )}
                                    </div>
                                ) : null}
                                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                                    <div className="shrink-0">
                                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:text-xs">
                                            Số lượng
                                        </p>
                                        <div
                                            className="inline-flex h-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                                            role="group"
                                            aria-label="Chỉnh số lượng"
                                        >
                                            <button
                                                type="button"
                                                className="flex h-full w-11 shrink-0 items-center justify-center text-lg font-medium text-slate-600 transition hover:bg-slate-100"
                                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                                aria-label="Giảm số lượng"
                                            >
                                                −
                                            </button>
                                            <span className="flex h-full min-w-[3rem] items-center justify-center border-x border-slate-200 bg-slate-50/80 px-2 text-base font-bold tabular-nums text-slate-900">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                className="flex h-full w-11 shrink-0 items-center justify-center text-lg font-medium text-slate-600 transition hover:bg-slate-100"
                                                onClick={() => setQuantity((q) => q + 1)}
                                                aria-label="Tăng số lượng"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddToCart}
                                        disabled={isAdding || !canAddToCart}
                                        className="inline-flex h-11 min-h-[2.75rem] w-full flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1a5f2a] px-5 text-base font-semibold text-white shadow-md shadow-[#1a5f2a]/20 transition hover:bg-[#145026] disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-0"
                                    >
                                        <ShoppingCart size={19} className="shrink-0" />
                                        <span>Thêm vào giỏ</span>
                                    </button>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/30 sm:p-8">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        <span className="h-8 w-1 rounded-full bg-[#1a5f2a]" aria-hidden />
                        Mô tả sản phẩm
                    </h3>
                    <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                        <strong className="font-semibold text-slate-800">{displayName}</strong> là sản phẩm chất lượng cao,
                        được bảo quản theo tiêu chuẩn kho lạnh và phân phối qua hệ thống AgriIDMS.
                    </p>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/30 sm:p-8">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        <Star className="h-5 w-5 text-amber-500" fill="currentColor" fillOpacity={0.2} />
                        Đánh giá từ khách hàng
                    </h3>
                    {!approvedReviews || approvedReviews.items.length === 0 ? (
                        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            Chưa có đánh giá nào được duyệt cho sản phẩm này.
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-4">
                            {approvedReviews.items.map((r) => (
                                <li
                                    key={r.id}
                                    className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <p className="font-semibold text-slate-900">{r.customerName || "Khách hàng"}</p>
                                        <time className="text-xs text-slate-400" dateTime={r.createdAt}>
                                            {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                                        </time>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Tổng quan {r.rating}/5 · Độ tươi {r.freshness}/5 · Đóng gói {r.packaging}/5
                                    </p>
                                    {r.comment ? (
                                        <p className="mt-3 text-sm leading-relaxed text-slate-700">{r.comment}</p>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
