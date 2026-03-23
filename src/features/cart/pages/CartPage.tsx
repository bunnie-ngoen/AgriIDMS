import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, Check, AlertCircle } from "lucide-react";

import { ROUTES } from "../../../shared/constants/routes";
import {
    useClearCartMutation,
    useCreateOrderFromCartMutation,
    useCreateOrderFromCartVariantsMutation,
    useGetMyCartQuery,
    useRemoveCartItemMutation,
    useUpdateCartItemQuantityMutation,
} from "../api/cart.api";
import type { CartItem, CreateOrderFromCartResponse } from "../schemas/cart.schema";

function vnd(n: number) {
    return n.toLocaleString("vi-VN");
}

function getLineAmount(item: CartItem) {
    // BE: LineAmount = Quantity * UnitPrice * BoxWeight
    return item.quantity * item.unitPrice * item.boxWeight;
}

function cartItemKey(item: CartItem) {
    // BoxWeight là decimal; dùng string để ổn định theo dữ liệu BE trả về.
    return `${item.productVariantId}|${item.isPartial ? "partial" : "full"}|${String(item.boxWeight)}`;
}

export default function CartPage() {
    const navigate = useNavigate();
    const { data: cart, isLoading, isError, refetch, isFetching } = useGetMyCartQuery(undefined);

    const [updateCartItemQuantity, { isLoading: isUpdating }] = useUpdateCartItemQuantityMutation();
    const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
    const [clearCart, { isLoading: isClearing }] = useClearCartMutation();
    const [createOrderFromCart, { isLoading: isPlacingOrder }] = useCreateOrderFromCartMutation();
    const [createOrderFromCartVariants, { isLoading: isPlacingSelectedOrder }] =
        useCreateOrderFromCartVariantsMutation();

    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [lastOrder, setLastOrder] = useState<CreateOrderFromCartResponse | null>(null);
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
    const totalAmount = useMemo(() => {
        if (!items.length) return 0;
        // Lấy từ BE nếu có, fallback tính lại để tránh mismatch.
        return cart?.totalAmount ?? items.reduce((sum, i) => sum + getLineAmount(i), 0);
    }, [cart?.totalAmount, items]);

    const selectedItems = items.filter((item) => selectedKeys[cartItemKey(item)]);
    const selectedTotal = selectedItems.reduce((sum, item) => {
        const key = cartItemKey(item);
        const qty = localQty[key] ?? item.quantity;
        return sum + getLineAmount({ ...item, quantity: qty });
    }, 0);

    const canCheckoutAll = items.length > 0 && !isPlacingOrder && !isPlacingSelectedOrder;
    const canCheckoutSelected =
        selectedItems.length > 0 && !isPlacingOrder && !isPlacingSelectedOrder && !isUpdating && !isFetching;
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

        // Optimistic
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
            // Re-sync từ BE (để tránh local bị lệch).
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

    const handleCheckout = async () => {
        if (!canCheckoutAll) return;
        setMessage(null);
        try {
            const res = await createOrderFromCart(undefined).unwrap();
            setLastOrder(res);
            setMessage({ type: "success", text: `Đã tạo đơn #${res.orderId}. Vui lòng chờ hệ thống xử lý.` });
            await refetch();
        } catch {
            setMessage({ type: "error", text: "Không thể tạo đơn từ giỏ. Vui lòng thử lại." });
        }
    };

    const handleCheckoutSelected = async () => {
        if (!canCheckoutSelected) return;
        setMessage(null);
        try {
            // Đồng bộ với server trước khi tạo đơn để tránh gửi quantity lệch gây lỗi backend.
            const latest = await refetch();
            const latestItems = latest.data?.items ?? cart?.items ?? [];
            const selectedFromServer = latestItems.filter((item) => selectedKeys[cartItemKey(item)]);
            if (selectedFromServer.length === 0) {
                setMessage({ type: "error", text: "Không còn sản phẩm nào được chọn hợp lệ trong giỏ." });
                return;
            }
            const payload = {
                items: selectedFromServer.map((item) => {
                    return {
                        productVariantId: item.productVariantId,
                        boxWeight: item.boxWeight,
                        isPartial: item.isPartial,
                        quantity: item.quantity,
                    };
                }),
            };
            const res = await createOrderFromCartVariants(payload).unwrap();
            setLastOrder(res);
            setMessage({
                type: "success",
                text: `Đã tạo đơn #${res.orderId} từ ${selectedFromServer.length} sản phẩm đã tích.`,
            });
            await refetch();
        } catch (e: unknown) {
            const err = e as { data?: { message?: string } };
            setMessage({
                type: "error",
                text: err?.data?.message ?? "Không thể tạo đơn từ sản phẩm đã tích. Vui lòng thử lại.",
            });
        }
    };

    const handleClearCart = async () => {
        setMessage(null);
        try {
            await clearCart(undefined).unwrap();
            setLastOrder(null);
            await refetch();
        } catch {
            setMessage({ type: "error", text: "Không thể xóa toàn bộ giỏ hàng. Vui lòng thử lại." });
        }
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
                        Tích sản phẩm để đặt mua. Tại đây bạn tạo đơn từ giỏ; thanh toán thực hiện ở màn Đơn của tôi.
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
                                Đã chọn: <span className="font-semibold text-slate-900">{selectedItems.length}</span> / {items.length}
                            </span>
                        </div>

                        {message && (
                            <div
                                className={`rounded-xl p-4 border ${
                                    message.type === "success"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                        : "bg-red-50 border-red-200 text-red-800"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
                                    <p className="font-medium">{message.text}</p>
                                </div>
                            </div>
                        )}

                        {cart?.items?.map((item) => {
                            const key = cartItemKey(item);
                            const qty = localQty[key] ?? item.quantity;
                            const lineAmount = getLineAmount({ ...item, quantity: qty });
                            const boxLabel = item.isPartial ? "Hộp lẻ" : "Hộp đầy";

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
                                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-slate-300 text-xs">No img</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 truncate">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {boxLabel} - {item.boxWeight}kg · {item.grade}
                                                    </p>
                                                    <p className="text-sm text-slate-900 font-semibold mt-2">
                                                        {vnd(lineAmount)} ₫
                                                    </p>
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

                                            <div className="mt-4 flex items-center gap-3">
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

                                                <div className="text-sm text-slate-600">
                                                    Đơn giá: {vnd(item.unitPrice)} ₫/kg
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
                                <span className="font-medium">Tổng tiền</span>
                                <span className="text-slate-900 font-bold">{vnd(totalAmount)} ₫</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-4 text-slate-700">
                                <span className="font-medium">Tổng đã chọn</span>
                                <span className="text-slate-900 font-bold">{vnd(selectedTotal)} ₫</span>
                            </div>

                            <div className="mt-4 text-sm text-slate-600">
                                Khi tạo đơn từ giỏ, hệ thống sẽ kiểm tra tồn kho và lập đơn bán cho bạn.
                            </div>

                            <button
                                type="button"
                                onClick={handleCheckoutSelected}
                                disabled={!canCheckoutSelected}
                                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-lg font-semibold hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isPlacingSelectedOrder ? "Đang tạo đơn..." : "Tạo đơn từ sản phẩm đã tích"}
                            </button>

                            <button
                                type="button"
                                onClick={handleCheckout}
                                disabled={!canCheckoutAll}
                                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-[#1a5f2a] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#145026] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isPlacingOrder ? "Đang tạo đơn..." : "Tạo đơn từ toàn bộ giỏ"}
                            </button>

                            {lastOrder && (
                                <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
                                    <p className="text-sm text-slate-700">
                                        Đơn của bạn: <span className="font-bold text-slate-900">#{lastOrder.orderId}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Trạng thái ban đầu: <span className="font-medium">{lastOrder.allocationSucceeded ? "Allocated" : "Pending"}</span>
                                    </p>
                                    <Link
                                        to={ROUTES.CUSTOMER_ORDER_DETAIL.replace(":id", String(lastOrder.orderId))}
                                        className="inline-flex mt-2 text-sm font-semibold text-[#1a5f2a] hover:underline"
                                    >
                                        Đi tới chi tiết đơn để thanh toán
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

