import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Leaf, ShoppingCart, ArrowLeft, AlertCircle } from "lucide-react";
import { useGetHomeProductDetailQuery, useAddToCartMutation } from "../api/home.api";
import { validateAddToCartRequest, type BoxType } from "../schemas/home.schema";
import { ROUTES } from "../../../shared/constants/routes";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import toast from "react-hot-toast";
import { useGetApprovedReviewsByProductVariantQuery } from "../../review/api/review.api";

// ─── Skeleton loading ────────────────────────────────────────

function DetailSkeleton() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded mx-auto mb-10" />
            <div className="grid md:grid-cols-2 gap-10">
                <div className="aspect-square bg-slate-200 rounded-xl" />
                <div className="space-y-4">
                    <div className="h-7 w-3/4 bg-slate-200 rounded" />
                    <div className="h-10 w-32 bg-slate-200 rounded mt-6" />
                    <div className="h-4 w-full bg-slate-100 rounded mt-4" />
                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                    <div className="h-12 w-full bg-slate-200 rounded mt-8" />
                    <div className="h-12 w-24 bg-slate-200 rounded mt-4" />
                </div>
            </div>
        </div>
    );
}

/** Tạo key duy nhất cho từng loại hộp (BE không trả id). */
function boxKey(box: BoxType) {
    return `${box.boxType}-${box.weight}`;
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

    const handleBuyNow = async () => {
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
            toast.success("Đã thêm vào giỏ. Chuyển đến trang giỏ hàng.");
            navigate(ROUTES.CART);
        } catch (error) {
            const msg = getApiErrorMessage(error);
            toast.error(msg);
        }
    };

    const canAddToCart = product && selectedBox && selectedBox.availableCount > 0 && quantity > 0;

    if (skip || isLoading) return <DetailSkeleton />;
    if (isError) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <p className="text-slate-600 mb-4">Không tải được chi tiết sản phẩm.</p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-[#1a5f2a] font-medium hover:underline"
                >
                    Thử lại
                </button>
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.HOME)}
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft size={18} />
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }
    if (!product) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                <p className="text-slate-600 mb-4">Không tìm thấy sản phẩm.</p>
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.HOME)}
                    className="inline-flex items-center gap-2 text-[#1a5f2a] font-medium"
                >
                    <ArrowLeft size={18} />
                    Về trang chủ
                </button>
            </div>
        );
    }

    const imageUrl = product.imageUrl && product.imageUrl.trim() !== "" ? product.imageUrl : null;
    const gradeLabel = product.grade === 1 ? "Loại 1" : product.grade === 2 ? "Loại 2" : product.grade === 3 ? "Loại 3" : `Hạng ${product.grade}`;

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <button
                type="button"
                onClick={() => navigate(ROUTES.HOME)}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
            >
                <ArrowLeft size={18} />
                Về trang chủ
            </button>

            <h1 className="text-2xl font-bold text-center mb-10 uppercase text-slate-900">
                Chi tiết sản phẩm
            </h1>

            <div className="grid md:grid-cols-2 gap-10">
                <div>
                    <div className="aspect-square rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={product.productName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Leaf className="text-slate-300" size={80} />
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-[#1a5f2a]">
                        {product.productName}
                    </h2>
                    <div className="mt-1 text-sm text-slate-500 space-y-0.5">
                        <p>Hạng: {gradeLabel}</p>
                    </div>

                    <div className="mt-6 border-t border-slate-200 pt-4">
                        <p className="text-[#c0392b] text-2xl font-bold">
                            {product.price.toLocaleString("vi-VN")} ₫/kg
                        </p>
                        {product.hasNearExpiryStock && product.nearExpiryPriceTiers.length > 0 ? (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm space-y-1.5">
                                <p className="font-semibold text-amber-700">Giá theo lô gần hết hạn</p>
                                {product.nearExpiryPriceTiers.map((tier) => (
                                    <div key={tier.maxDaysLeft} className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                                            ≤ {tier.maxDaysLeft} ngày
                                        </span>
                                        <span className="font-semibold text-amber-800">
                                            giảm {tier.discountPercent.toLocaleString("vi-VN")}%
                                        </span>
                                        <span className="font-bold text-amber-900">
                                            {tier.pricePerKg.toLocaleString("vi-VN")} ₫/kg
                                        </span>
                                        <span className="text-xs text-amber-700">
                                            ({tier.boxCount} hộp)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        <p className="mt-2 text-slate-600">
                            Hạn sử dụng: {product.shelfLifeDays} ngày
                        </p>
                        <p className="mt-2 font-semibold">
                            Tình trạng:{" "}
                            <span className={product.availableBoxCount > 0 ? "text-[#1a5f2a]" : "text-red-600"}>
                                {product.availableBoxCount > 0 ? "Còn hàng" : "Hết hàng"}
                            </span>
                        </p>
                    </div>

                    {/* Chọn loại hộp – luôn hiển thị; khớp BE BoxTypeDto: boxType, weight, availableCount, boxPrice */}
                    <div className="mt-6">
                        <h3 className="font-semibold text-slate-900 mb-2">Chọn loại hộp</h3>
                        {product.boxTypes.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {product.boxTypes.map((box) => {
                                    const key = boxKey(box);
                                    const isSelected = selectedBox ? boxKey(selectedBox) === key : false;
                                    const boxLabel = box.boxType === "Partial" ? "Hộp lẻ" : "Hộp đầy";
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setSelectedBox(box)}
                                            disabled={box.availableCount <= 0}
                                            className={`text-left px-4 py-3 rounded-lg border-2 transition-colors
                                                ${box.availableCount <= 0 ? "opacity-50 cursor-not-allowed border-slate-100" : ""}
                                                ${isSelected
                                                    ? "border-[#1a5f2a] bg-[#e8f5e9] text-[#1a5f2a]"
                                                    : "border-slate-200 hover:border-[#1a5f2a]/50 text-slate-700"
                                                }`}
                                        >
                                            <span className="font-medium">{boxLabel} – {box.weight} kg</span>
                                            <span className="block text-sm mt-0.5">
                                                Còn {box.availableCount} hộp · {box.boxPrice.toLocaleString("vi-VN")} ₫/hộp
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm py-2">
                                Hiện chưa có loại hộp nào để bán cho sản phẩm này.
                            </p>
                        )}
                    </div>

                    {/* Đặt hàng – bắt buộc chọn loại hộp khi có boxTypes */}
                    <div className="mt-8">
                        <h3 className="font-semibold text-slate-900 mb-3">Đặt hàng</h3>
                        {product.boxTypes.length > 0 && !selectedBox && (
                            <p className="text-amber-600 text-sm mb-2">Vui lòng chọn một loại hộp trước khi thêm vào giỏ.</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                >
                                    −
                                </button>
                                <span className="px-4 py-2 min-w-[3rem] text-center font-medium border-x border-slate-200">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                                    onClick={() => setQuantity((q) => q + 1)}
                                >
                                    +
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={isAdding || !canAddToCart}
                                className="inline-flex items-center gap-2 bg-[#1a5f2a] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#145026] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart size={18} />
                                Thêm vào giỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleBuyNow}
                                disabled={isAdding || !canAddToCart}
                                className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Mua ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 border-t border-slate-200 pt-8">
                <h3 className="font-bold text-lg text-[#1a5f2a]">Mô tả sản phẩm</h3>
                <p className="mt-4 text-slate-700 leading-relaxed">
                    {product.productName} là sản phẩm chất lượng cao, được bảo quản theo tiêu chuẩn kho lạnh
                    và phân phối qua hệ thống AgriIDMS.
                </p>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
                <h3 className="font-bold text-lg text-[#1a5f2a]">Đánh giá từ khách hàng</h3>
                {!approvedReviews || approvedReviews.items.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">Chưa có đánh giá nào được duyệt cho sản phẩm này.</p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {approvedReviews.items.map((r) => (
                            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-900">{r.customerName || "Khách hàng"}</p>
                                    <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</p>
                                </div>
                                <p className="mt-1 text-xs text-slate-600">
                                    Tổng quan: {r.rating}/5 · Độ tươi: {r.freshness}/5 · Đóng gói: {r.packaging}/5
                                </p>
                                {r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
