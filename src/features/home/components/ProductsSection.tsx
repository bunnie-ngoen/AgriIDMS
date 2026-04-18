import { useState } from "react";
import { ChevronLeft, ChevronRight, Leaf, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetHomeProductsQuery } from "../api/home.api";
import type { HomeProduct } from "../schemas/home.schema";
import { productHasActiveSaleDisplay } from "../utils/productDiscountDisplay";
import { ROUTES } from "../../../shared/constants/routes";

const VISIBLE_COUNT = 4;

// ─── ProductCard ─────────────────────────────────────────────

interface ProductCardProps {
    product: HomeProduct;
}

function ProductCard({ product }: ProductCardProps) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(ROUTES.PRODUCT_DETAIL.replace(":id", String(product.id)))}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-[#1a5f2a]/40 transition-all group"
        >
            {/* Image */}
            <div className="relative aspect-square bg-slate-100 overflow-hidden">
                {productHasActiveSaleDisplay(product) ? (
                    <div
                        className="absolute right-2 top-2 z-10 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow-md ring-1 ring-white/90 sm:text-[11px]"
                        title="Giảm giá"
                    >
                        Giảm Giá
                    </div>
                ) : null}
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="text-slate-300" size={48} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-2">
                <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-snug min-h-[2.5rem]">
                    {product.productName}
                </h3>
                <p className="text-xs text-slate-500">
                    {product.grade === 1 ? "Loại 1" : product.grade === 2 ? "Loại 2" : product.grade === 3 ? "Loại 3" : `Hạng ${product.grade}`}
                </p>
                <p className="text-[#c0392b] font-bold text-base">
                    {product.price.toLocaleString("vi-VN")} ₫/kg
                </p>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(ROUTES.PRODUCT_DETAIL.replace(":id", String(product.id)));
                    }}
                    className="mt-1 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-white text-sm font-medium bg-[#1a5f2a] hover:bg-[#145026]"
                >
                    <ShoppingCart size={15} />
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
}

// ─── Skeleton Loading ─────────────────────────────────────────

function ProductSkeletons() {
    return (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50 h-80 animate-pulse"
                />
            ))}
        </div>
    );
}

// ─── Main Section ─────────────────────────────────────────────

export default function ProductsSection() {
    const { data: products = [], isLoading, isError } = useGetHomeProductsQuery();

    const [startIndex, setStartIndex] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [direction, setDirection] = useState<"left" | "right">("right");

    const canPrev = startIndex > 0;
    const canNext = startIndex + VISIBLE_COUNT < products.length;
    const dotCount = Math.max(0, products.length - VISIBLE_COUNT + 1);

    const slide = (dir: "left" | "right") => {
        if (animating) return;

        setDirection(dir);
        setAnimating(true);

        setTimeout(() => {
            setStartIndex((i) =>
                dir === "right"
                    ? Math.min(i + 1, products.length - VISIBLE_COUNT)
                    : Math.max(i - 1, 0)
            );

            setAnimating(false);
        }, 250);
    };

    const visibleProducts = products.slice(startIndex, startIndex + VISIBLE_COUNT);

    return (
        <section id="san-pham" className="py-16 border-t border-slate-100 scroll-mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center uppercase tracking-wide">
                    Sản phẩm
                </h2>

                <p className="mt-2 text-slate-600 text-center max-w-2xl mx-auto">
                    Một số sản phẩm hoa quả trong hệ thống.
                </p>

                <div className="mt-12">

                    {isLoading && <ProductSkeletons />}

                    {isError && (
                        <p className="text-center text-red-500">
                            Không thể tải danh sách sản phẩm.
                        </p>
                    )}

                    {!isLoading && !isError && products.length === 0 && (
                        <p className="text-center text-slate-500">
                            Chưa có sản phẩm nào.
                        </p>
                    )}

                    {!isLoading && !isError && products.length > 0 && (
                        <div className="relative">

                            {/* Prev Button */}
                            <button
                                type="button"
                                aria-label="Sản phẩm trước"
                                disabled={!canPrev}
                                onClick={() => slide("left")}
                                className={`absolute -left-5 top-[45%] -translate-y-1/2 z-10 w-10 h-10 rounded-full border bg-white shadow flex items-center justify-center transition-all
                                    ${canPrev
                                        ? "border-slate-200 text-slate-700 hover:bg-[#1a5f2a] hover:text-white hover:border-[#1a5f2a]"
                                        : "border-slate-100 text-slate-300 cursor-not-allowed"
                                    }`}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {/* Products */}
                            <div
                                className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                                style={{
                                    transition: "opacity 0.25s ease, transform 0.25s ease",
                                    opacity: animating ? 0 : 1,
                                    transform: animating
                                        ? `translateX(${direction === "right" ? "-16px" : "16px"})`
                                        : "translateX(0)",
                                }}
                            >
                                {visibleProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                type="button"
                                aria-label="Sản phẩm tiếp theo"
                                disabled={!canNext}
                                onClick={() => slide("right")}
                                className={`absolute -right-5 top-[45%] -translate-y-1/2 z-10 w-10 h-10 rounded-full border bg-white shadow flex items-center justify-center transition-all
                                    ${canNext
                                        ? "border-slate-200 text-slate-700 hover:bg-[#1a5f2a] hover:text-white hover:border-[#1a5f2a]"
                                        : "border-slate-100 text-slate-300 cursor-not-allowed"
                                    }`}
                            >
                                <ChevronRight size={20} />
                            </button>

                            {/* Pagination Dots */}
                            {dotCount > 1 && (
                                <div className="mt-6 flex justify-center gap-2">
                                    {Array.from({ length: dotCount }).map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            aria-label={`Trang ${i + 1}`}
                                            onClick={() => setStartIndex(i)}
                                            className={`h-2 rounded-full transition-all
                                                ${i === startIndex
                                                    ? "w-6 bg-[#1a5f2a]"
                                                    : "w-2 bg-slate-300 hover:bg-slate-400"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                        </div>
                    )}

                </div>
            </div>
        </section>
    );
}