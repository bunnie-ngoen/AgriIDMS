import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, AlertCircle } from "lucide-react";

import { ROUTES } from "../../../shared/constants/routes";
import {
    useClearCartMutation,
    useGetMyCartQuery,
    useRemoveCartItemMutation,
    useUpdateCartItemQuantityMutation,
} from "../api/cart.api";
import type { CartItem } from "../schemas/cart.schema";
import type { CheckoutNavigateState } from "../types/checkout.types";
import { cartItemKey, getLineAmount, vnd } from "../utils/cartItem.utils";

export default function CartPage() {
    const navigate = useNavigate();
    const { data: cart, isLoading, isError, refetch, isFetching } = useGetMyCartQuery(undefined);

    const [updateCartItemQuantity, { isLoading: isUpdating }] = useUpdateCartItemQuantityMutation();
    const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
    const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

    const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);
    const [localQty, setLocalQty] = useState<Record<string, number>>({});
    const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!cart?.items?.length) {
            setLocalQty({});
            return;
        }
        const map: Record<string, number> = {};
        const selected: Record<string, boolean> = {};
        for (const item of cart.items) {
            const key = cartItemKey(item);
            map[key] = item.quantity;
            selected[key] = selectedKeys[key] ?? true;
        }
        setLocalQty(map);
        setSelectedKeys(selected);
    }, [cart?.items]);

    const items = cart?.items ?? [];

    const selectedItems = items.filter((item) => selectedKeys[cartItemKey(item)]);
    const selectedTotal = selectedItems.reduce((sum, item) => {
        const key = cartItemKey(item);
        const qty = localQty[key] ?? item.quantity;
        return sum + getLineAmount({ ...item, quantity: qty });
    }, 0);

    const canGoCheckout =
        selectedItems.length > 0 && !isUpdating && !isFetching;

    const allSelected = items.length > 0 && selectedItems.length === items.length;

    const toggleSelectOne = (key: string) => {
        setSelectedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            const cleared: Record<string, boolean> = {};
            for (const item of items) cleared[cartItemKey(item)] = false;
            setSelectedKeys(cleared);
            return;
        }
        const next: Record<string, boolean> = {};
        for (const item of items) next[cartItemKey(item)] = true;
        setSelectedKeys(next);
    };

    const handleQtyChange = async (item: CartItem, nextQty: number) => {
        const key = cartItemKey(item);
        const safeQty = Math.max(1, Math.floor(nextQty));

        setLocalQty((prev) => ({ ...prev, [key]: safeQty }));
        setMessage(null);

        try {
            await updateCartItemQuantity({
                productVariantId: item.productVariantId,
                boxWeight: item.boxWeight,
                isPartial: item.isPartial,
                quantity: safeQty,
            }).unwrap();
            await refetch();
        } catch {
            setMessage({ type: "error", text: "Không cập nhật được số lượng. Vui lòng thử lại." });
            await refetch();
        }
    };

    const handleRemove = async (item: CartItem) => {
        setMessage(null);
        try {
            await removeCartItem({
                productVariantId: item.productVariantId,
                boxWeight: item.boxWeight,
                isPartial: item.isPartial,
            }).unwrap();
            await refetch();
        } catch {
            setMessage({ type: "error", text: "Không xóa được khỏi giỏ. Vui lòng thử lại." });
        }
    };

    const handleClearCart = async () => {
        setMessage(null);
        try {
            await clearCart(undefined).unwrap();
            await refetch();
        } catch {
            setMessage({ type: "error", text: "Không thể xóa toàn bộ giỏ hàng. Vui lòng thử lại." });
        }
    };

    const goToCheckoutSelected = () => {
        if (!canGoCheckout) return;
        const lineKeys = selectedItems.map((i) => cartItemKey(i));
        const state: CheckoutNavigateState = { lineKeys };
        navigate(ROUTES.CHECKOUT, { state });
    };

    const goToCheckoutAll = () => {
        if (items.length === 0 || isFetching) return;
        const state: CheckoutNavigateState = {};
        navigate(ROUTES.CHECKOUT, { state });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <ShoppingCart size={22} />
                        Giỏ hàng
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Chọn sản phẩm rồi bấm <span className="font-medium">Thanh toán</span> để sang màn xác nhận đơn
                        (PO).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleClearCart}
                        disabled={isClearing || items.length === 0}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
                    >
                        {isClearing ? "Đang xóa giỏ..." : "Xóa sạch giỏ"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.HOME)}
                        className="text-sm font-medium text-slate-700 hover:text-[#1a5f2a]"
                    >
                        Tiếp tục mua
                    </button>
                </div>
            </div>

            {isLoading || isFetching ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <p className="text-slate-600">Đang tải giỏ hàng...</p>
                </div>
            ) : isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={18} className="text-red-600" />
                        <p className="text-red-700 font-medium">Không tải được giỏ hàng.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 inline-flex items-center text-sm font-medium text-red-700 hover:underline"
                    >
                        Thử lại
                    </button>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                    <p className="text-slate-600 mb-4">Giỏ hàng của bạn hiện đang trống.</p>
                    <Link
                        to={ROUTES.HOME}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#1a5f2a] text-white font-semibold hover:bg-[#145026]"
                    >
                        Khám phá sản phẩm
                    </Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 rounded border-slate-300 text-[#1a5f2a] focus:ring-[#1a5f2a]"
                                />
                                Chọn tất cả sản phẩm trong giỏ
                            </label>
                            <span className="text-sm text-slate-600">
                                Đã chọn: <span className="font-semibold text-slate-900">{selectedItems.length}</span> /{" "}
                                {items.length}
                            </span>
                        </div>

                        {message && (
                            <div className="rounded-xl p-4 border bg-red-50 border-red-200 text-red-800">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    <p className="font-medium">{message.text}</p>
                                </div>
                            </div>
                        )}

                        {cart?.items?.map((item) => {
                            const key = cartItemKey(item);
                            const qty = localQty[key] ?? item.quantity;
                            const lineAmount = getLineAmount({ ...item, quantity: qty });
                            const boxLabel = item.isPartial ? "Hộp lẻ" : "Hộp đầy";
                            const originalUnitPrice = item.originalUnitPrice ?? item.unitPrice;
                            const safeOriginalUnitPrice = originalUnitPrice > 0 ? originalUnitPrice : item.unitPrice;
                            const rawDiscountPercent =
                                safeOriginalUnitPrice > 0
                                    ? ((safeOriginalUnitPrice - item.unitPrice) / safeOriginalUnitPrice) * 100
                                    : 0;
                            const discountPercent = Math.max(0, Math.round(rawDiscountPercent));
                            const hasDiscount = discountPercent > 0;

                            return (
                                <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-start gap-4">
                                        <label className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={!!selectedKeys[key]}
                                                onChange={() => toggleSelectOne(key)}
                                                className="h-4 w-4 rounded border-slate-300 text-[#1a5f2a] focus:ring-[#1a5f2a]"
                                            />
                                        </label>
                                        <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-slate-300 text-xs">Chưa có ảnh</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {boxLabel} - {item.boxWeight}kg · {item.grade}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                                        <span className={hasDiscount ? "text-slate-400 line-through" : "text-slate-700"}>
                                                            {vnd(safeOriginalUnitPrice)} VNĐ/KG
                                                        </span>
                                                        <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                            {hasDiscount ? `-${discountPercent}%` : "0%"}
                                                        </span>
                                                        <span className="font-bold text-slate-900">{vnd(item.unitPrice)} VNĐ/KG</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(item)}
                                                    disabled={isRemoving}
                                                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-red-600 disabled:opacity-60"
                                                    aria-label="Xóa khỏi giỏ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="mt-4 border-t border-slate-100 pt-3">
                                                <p className="text-xs text-slate-500">Số lượng</p>
                                                <div className="mt-2 flex items-center justify-between gap-3">
                                                    <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium"
                                                            onClick={() => handleQtyChange(item, qty - 1)}
                                                            disabled={isUpdating || qty <= 1}
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <div className="px-4 py-2 min-w-[3rem] text-center font-medium text-slate-900 border-x border-slate-200">
                                                            {qty}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium"
                                                            onClick={() => handleQtyChange(item, qty + 1)}
                                                            disabled={isUpdating}
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {vnd(lineAmount)} VNĐ
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 sticky top-[90px]">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Tóm tắt</h2>
                            <div className="flex items-center justify-between gap-4 text-slate-700">
                                <span className="font-medium">Tạm tính (đã chọn)</span>
                                <span className="text-slate-900 font-bold">{vnd(selectedTotal)} VNĐ</span>
                            </div>

                            <button
                                type="button"
                                onClick={goToCheckoutSelected}
                                disabled={!canGoCheckout}
                                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg font-bold hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Thanh toán ({selectedItems.length} sản phẩm)
                            </button>

                            <button
                                type="button"
                                onClick={goToCheckoutAll}
                                disabled={items.length === 0 || isFetching}
                                className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-slate-300 bg-white text-slate-800 px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-60"
                            >
                                Thanh toán toàn bộ giỏ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
