import type { CartItem } from "../schemas/cart.schema";

export function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

/** BE: LineAmount = Quantity * UnitPrice * BoxWeight */
export function getLineAmount(item: CartItem) {
    return item.quantity * item.unitPrice * item.boxWeight;
}

/** BoxWeight là decimal; ổn định key theo dữ liệu BE. */
export function cartItemKey(item: CartItem) {
    return `${item.productVariantId}|${item.isPartial ? "partial" : "full"}|${String(item.boxWeight)}`;
}
