import type { HomeProduct } from "../schemas/home.schema";

type PriceTier = HomeProduct["nearExpiryPriceTiers"][number];

/**
 * Nhận diện sản phẩm đang có giá ưu đãi hiển thị từ API Home (gộp rule gần HSD + ghi đè variant — BE đã tính sẵn vào nearExpiry*).
 * Dùng cho product list (badge) và detail (khối chi tiết).
 */
export function productHasActiveSaleDisplay(
    product: Pick<
        HomeProduct,
        | "hasNearExpiryStock"
        | "price"
        | "nearExpiryDiscountPercent"
        | "nearExpiryPricePerKg"
        | "nearExpiryPriceTiers"
    >,
): boolean {
    if (!product.hasNearExpiryStock) return false;

    const pct = product.nearExpiryDiscountPercent;
    if (pct != null && pct > 0) return true;

    const sale = product.nearExpiryPricePerKg;
    if (sale != null && sale > 0 && sale < product.price) return true;

    if (product.nearExpiryPriceTiers.some((t) => t.discountPercent > 0)) return true;

    return false;
}

export type HomeProductDiscountViewModel = {
    hasDiscount: boolean;
    /** Giá niêm yết (BE: price) */
    basePricePerKg: number;
    /** Giá sau giảm /kg khi có ưu đãi */
    salePricePerKg: number | null;
    /** % giảm hiển thị (ưu tiên field BE) */
    discountPercent: number | null;
    tiers: PriceTier[];
};

/**
 * Chuẩn hóa dữ liệu hiển thị giá — chỉ dựa trên payload Home (không tự tính lại engine giảm giá).
 * Dùng cho cả danh sách variant và chi tiết (HomeProductDetail mở rộng cùng các field nearExpiry*).
 */
export function getHomeProductDiscountViewModel(product: HomeProduct): HomeProductDiscountViewModel {
    const hasDiscount = productHasActiveSaleDisplay(product);
    const basePricePerKg = product.price;

    if (!hasDiscount) {
        return {
            hasDiscount: false,
            basePricePerKg,
            salePricePerKg: null,
            discountPercent: null,
            tiers: product.nearExpiryPriceTiers,
        };
    }

    const tiers = product.nearExpiryPriceTiers;
    const firstTier = tiers[0];

    const salePricePerKg =
        product.nearExpiryPricePerKg != null && product.nearExpiryPricePerKg > 0
            ? product.nearExpiryPricePerKg
            : firstTier != null && firstTier.pricePerKg > 0
              ? firstTier.pricePerKg
              : null;

    const discountPercent =
        product.nearExpiryDiscountPercent != null && product.nearExpiryDiscountPercent > 0
            ? product.nearExpiryDiscountPercent
            : firstTier != null && firstTier.discountPercent > 0
              ? firstTier.discountPercent
              : salePricePerKg != null && salePricePerKg < basePricePerKg
                ? Math.round(
                      ((basePricePerKg - salePricePerKg) / basePricePerKg) * 100 * 100,
                  ) / 100
                : null;

    return {
        hasDiscount: true,
        basePricePerKg,
        salePricePerKg,
        discountPercent,
        tiers,
    };
}
