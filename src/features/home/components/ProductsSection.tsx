import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Leaf, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetCategoriesQuery } from "../../category/api/category.api";
import { useGetProductsQuery } from "../../product/api/product.api";
import { useGetHomeProductsQuery, useGetHomeProductDetailQuery } from "../api/home.api";
import type { HomeProduct } from "../schemas/home.schema";
import { productHasActiveSaleDisplay } from "../utils/productDiscountDisplay";
import { ROUTES } from "../../../shared/constants/routes";
import { stripGradeSuffixFromProductName } from "../utils/productDisplayName";

const VISIBLE_COUNT = 4;

function normCategoryName(s: string | null | undefined) {
    return (s ?? "").trim().toLowerCase();
}

function isCategoryVisible(status: number | undefined) {
    if (status == null) return true;
    return status === 1;
}

// ─── ProductCard ─────────────────────────────────────────────

interface ProductCardProps {
    product: HomeProduct;
}

function ProductCard({ product }: ProductCardProps) {
    const navigate = useNavigate();
    const title = stripGradeSuffixFromProductName(product.productName);

    /** Dùng API chi tiết (có sẵn) để biết tồn — không cần đổi BE list. */
    const { data: detail } = useGetHomeProductDetailQuery(product.id);
    const outOfStock =
        detail != null && (!detail.isActive || detail.availableBoxCount <= 0);

    return (
        <div
            role="group"
            aria-disabled={outOfStock}
            onClick={() => {
                if (outOfStock) return;
                navigate(ROUTES.PRODUCT_DETAIL.replace(":id", String(product.id)));
            }}
            className={`relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all group ${
                outOfStock
                    ? "cursor-not-allowed pointer-events-none opacity-[0.92]"
                    : "cursor-pointer hover:shadow-md hover:border-[#1a5f2a]/40"
            }`}
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
                        alt={title}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                            outOfStock ? "scale-100" : "group-hover:scale-105"
                        }`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="text-slate-300" size={48} />
                    </div>
                )}
                {outOfStock && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-[3px]">
                        <span className="rounded-lg bg-white/95 px-4 py-2 text-sm font-bold tracking-wide text-slate-800 shadow-lg ring-1 ring-slate-200/80">
                            Không có hàng
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-2">
                <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-snug min-h-[2.5rem]">
                    {title}
                </h3>
                <p className="text-xs text-slate-500">
                    {product.grade === 1 ? "Loại 1" : product.grade === 2 ? "Loại 2" : product.grade === 3 ? "Loại 3" : `Hạng ${product.grade}`}
                </p>
                <p className="text-[#c0392b] font-bold text-base">
                    {product.price.toLocaleString("vi-VN")} ₫/kg
                </p>

                <button
                    type="button"
                    tabIndex={outOfStock ? -1 : 0}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (outOfStock) return;
                        navigate(ROUTES.PRODUCT_DETAIL.replace(":id", String(product.id)));
                    }}
                    className={`mt-1 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium ${
                        outOfStock
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "text-white bg-[#1a5f2a] hover:bg-[#145026]"
                    }`}
                    disabled={outOfStock}
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
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const { data: homeProducts = [], isLoading, isError } = useGetHomeProductsQuery();
    const { data: catalogProducts = [] } = useGetProductsQuery();
    const { data: categories = [], isLoading: isCategoriesLoading } = useGetCategoriesQuery();

    const productIdToCategoryName = useMemo(() => {
        const m = new Map<number, string>();
        for (const p of catalogProducts) {
            if (p.category != null && String(p.category).trim() !== "") {
                m.set(p.id, p.category);
            }
        }
        return m;
    }, [catalogProducts]);

    const filteredProducts = useMemo(() => {
        if (selectedCategoryId == null) return homeProducts;
        const cat = categories.find((c) => c.id === selectedCategoryId);
        if (!cat) return homeProducts;
        const target = normCategoryName(cat.name);
        return homeProducts.filter(
            (h) => normCategoryName(productIdToCategoryName.get(h.productId)) === target,
        );
    }, [homeProducts, selectedCategoryId, categories, productIdToCategoryName]);

    const list = filteredProducts;

    const [startIndex, setStartIndex] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [direction, setDirection] = useState<"left" | "right">("right");

    useEffect(() => {
        setStartIndex(0);
    }, [selectedCategoryId]);

    useEffect(() => {
        setStartIndex((i) =>
            Math.min(i, Math.max(0, list.length - VISIBLE_COUNT)),
        );
    }, [list.length]);

    const canPrev = startIndex > 0;
    const canNext = startIndex + VISIBLE_COUNT < list.length;
    const dotCount = Math.max(0, list.length - VISIBLE_COUNT + 1);

    const slide = (dir: "left" | "right") => {
        if (animating) return;

        setDirection(dir);
        setAnimating(true);

        setTimeout(() => {
            setStartIndex((i) =>
                dir === "right"
                    ? Math.min(i + 1, list.length - VISIBLE_COUNT)
                    : Math.max(i - 1, 0)
            );

            setAnimating(false);
        }, 250);
    };

    const visibleProducts = list.slice(startIndex, startIndex + VISIBLE_COUNT);

    const visibleCategories = categories.filter((c) => isCategoryVisible(c.status));

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

                <div className="mt-6 flex flex-wrap justify-center gap-2 overflow-x-auto pb-1">
                    {isCategoriesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-9 w-24 shrink-0 rounded-full bg-slate-100 animate-pulse"
                            />
                        ))
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setSelectedCategoryId(null)}
                                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                                    selectedCategoryId === null
                                        ? "bg-[#1a5f2a] text-white border-[#1a5f2a]"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-[#1a5f2a]/50"
                                }`}
                            >
                                Tất cả
                            </button>
                            {visibleCategories.map((c) => {
                                const active = selectedCategoryId === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setSelectedCategoryId(c.id)}
                                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors border max-w-[200px] truncate ${
                                            active
                                                ? "bg-[#1a5f2a] text-white border-[#1a5f2a]"
                                                : "bg-white text-slate-700 border-slate-200 hover:border-[#1a5f2a]/50"
                                        }`}
                                        title={c.name}
                                    >
                                        {c.name}
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>

                <div className="mt-10">

                    {isLoading && <ProductSkeletons />}

                    {isError && (
                        <p className="text-center text-red-500">
                            Không thể tải danh sách sản phẩm.
                        </p>
                    )}

                    {!isLoading && !isError && homeProducts.length === 0 && (
                        <p className="text-center text-slate-500">
                            Chưa có sản phẩm nào.
                        </p>
                    )}

                    {!isLoading &&
                        !isError &&
                        homeProducts.length > 0 &&
                        list.length === 0 && (
                            <p className="text-center text-slate-500">
                                Không có sản phẩm nào trong danh mục này.
                            </p>
                        )}

                    {!isLoading && !isError && list.length > 0 && (
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