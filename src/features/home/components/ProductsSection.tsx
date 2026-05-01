import { useEffect, useMemo, useState } from "react";
import { Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetProductsQuery } from "../../product/api/product.api";
import { useGetHomeProductsQuery, useGetHomeProductDetailQuery } from "../api/home.api";
import type { HomeProduct } from "../schemas/home.schema";
import { productHasActiveSaleDisplay } from "../utils/productDiscountDisplay";
import { ROUTES } from "../../../shared/constants/routes";
import { stripGradeSuffixFromProductName } from "../utils/productDisplayName";

const PRODUCTS_PER_PAGE = 9;

function normCategoryName(s: string | null | undefined) {
    return (s ?? "").trim().toLowerCase();
}

type FilterKey = "all" | "imported-fruit" | "regional-fruit" | "fresh-vegetable" | "hot-sale" | "tropical-fruit";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: "Tất cả" },
    { key: "imported-fruit", label: "Hoa quả nhập khẩu" },
    { key: "regional-fruit", label: "Hoa quả vùng miền" },
    { key: "fresh-vegetable", label: "Rau củ tươi ngon" },
    { key: "hot-sale", label: "Được giảm giá" },
    { key: "tropical-fruit", label: "Trái cây nhiệt đới" },
];

function includesAnyKeyword(value: string, keywords: string[]) {
    return keywords.some((keyword) => value.includes(keyword));
}

function getFilterPredicate(filterKey: FilterKey, product: HomeProduct, categoryName: string) {
    if (filterKey === "all") return true;
    if (filterKey === "hot-sale") return productHasActiveSaleDisplay(product);
    if (filterKey === "imported-fruit") {
        return includesAnyKeyword(categoryName, ["nhập khẩu", "import"]);
    }
    if (filterKey === "regional-fruit") {
        return includesAnyKeyword(categoryName, ["vùng miền"]);
    }
    if (filterKey === "fresh-vegetable") {
        return includesAnyKeyword(categoryName, ["rau củ"]);
    }
    return includesAnyKeyword(categoryName, ["nhiệt đới", "trái cây nhiệt đới"]);
}

function buildPaginationItems(totalPages: number, currentPage: number) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
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
            className={`relative h-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all group ${
                outOfStock
                    ? "cursor-not-allowed opacity-[0.95]"
                    : "cursor-pointer hover:shadow-md hover:border-[#1a5f2a]/40"
            }`}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {productHasActiveSaleDisplay(product) ? (
                    <div
                        className="absolute right-2 top-2 z-10 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow-md ring-1 ring-white/90 sm:text-[11px]"
                        title="Giảm giá"
                    >
                        GIẢM GIÁ
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
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/25">
                        <span className="rounded-lg bg-white/95 px-4 py-2 text-sm font-bold tracking-wide text-slate-800 shadow-lg ring-1 ring-slate-200/80">
                            Không có hàng
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-1 flex-col gap-2">
                <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-snug min-h-[2.5rem]">
                    {title}
                </h3>
                <p className="text-xs text-slate-500">
                    {product.grade === 1 ? "Loại 1" : product.grade === 2 ? "Loại 2" : product.grade === 3 ? "Loại 3" : `Hạng ${product.grade}`}
                </p>
                <p className="text-[#c0392b] font-bold text-base">
                    {product.price.toLocaleString("vi-VN")} VNĐ/KG
                </p>

                <button
                    type="button"
                    tabIndex={outOfStock ? -1 : 0}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (outOfStock) return;
                        navigate(ROUTES.PRODUCT_DETAIL.replace(":id", String(product.id)));
                    }}
                    className={`mt-auto w-full flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium ${
                        outOfStock
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "text-white bg-[#1a5f2a] hover:bg-[#145026]"
                    }`}
                    disabled={outOfStock}
                >
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
}

// ─── Skeleton Loading ─────────────────────────────────────────

function ProductSkeletons() {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
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
    const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
    const [currentPage, setCurrentPage] = useState(1);

    const { data: homeProducts = [], isLoading, isError } = useGetHomeProductsQuery();
    const { data: catalogProducts = [] } = useGetProductsQuery();

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
        return homeProducts.filter((product) => {
            const categoryName = normCategoryName(productIdToCategoryName.get(product.productId));
            return getFilterPredicate(selectedFilter, product, categoryName);
        });
    }, [homeProducts, selectedFilter, productIdToCategoryName]);

    const list = filteredProducts;

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFilter]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(list.length / PRODUCTS_PER_PAGE));
        setCurrentPage((prev) => Math.min(prev, totalPages));
    }, [list.length]);

    const totalPages = Math.max(1, Math.ceil(list.length / PRODUCTS_PER_PAGE));
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const visibleProducts = list.slice(start, start + PRODUCTS_PER_PAGE);
    const paginationItems = buildPaginationItems(totalPages, currentPage);

    return (
        <section id="san-pham" className="py-16 border-t border-slate-100 scroll-mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center uppercase tracking-wide">
                    SẢN PHẨM
                </h2>

                <p className="mt-2 text-slate-600 text-center max-w-2xl mx-auto">
                    Một số sản phẩm hoa quả trong hệ thống.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2 pb-1">
                    {FILTERS.map((filter) => {
                        const active = selectedFilter === filter.key;
                        return (
                            <button
                                key={filter.key}
                                type="button"
                                onClick={() => setSelectedFilter(filter.key)}
                                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                                    active
                                        ? "bg-[#1a5f2a] text-white border-[#1a5f2a]"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-[#1a5f2a]/50"
                                }`}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
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
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {visibleProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-8 flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Trang trước"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                                            currentPage === 1
                                                ? "cursor-not-allowed border-slate-200 text-slate-300 bg-slate-50"
                                                : "border-slate-200 text-slate-700 bg-white hover:border-[#1a5f2a] hover:text-[#1a5f2a]"
                                        }`}
                                    >
                                        &lt;
                                    </button>
                                    {paginationItems.map((item, idx) =>
                                        item === "..." ? (
                                            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={item}
                                                type="button"
                                                aria-label={`Trang ${item}`}
                                                onClick={() => {
                                                    if (typeof item === "number") {
                                                        setCurrentPage(item);
                                                    }
                                                }}
                                                className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                                                    item === currentPage
                                                        ? "bg-[#1a5f2a] text-white border-[#1a5f2a]"
                                                        : "border-slate-200 text-slate-700 bg-white hover:border-[#1a5f2a] hover:text-[#1a5f2a]"
                                                }`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    )}
                                    <button
                                        type="button"
                                        aria-label="Trang sau"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                                            currentPage === totalPages
                                                ? "cursor-not-allowed border-slate-200 text-slate-300 bg-slate-50"
                                                : "border-slate-200 text-slate-700 bg-white hover:border-[#1a5f2a] hover:text-[#1a5f2a]"
                                        }`}
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </section>
    );
}