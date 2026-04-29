import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, generatePath } from "react-router-dom";
import { AlertCircle, MapPin, Package } from "lucide-react";
import toast from "react-hot-toast";

import { ROUTES } from "../../../shared/constants/routes";
import {
    useCreateOrderFromCartVariantsMutation,
    useGetMyCartQuery,
    useGetOrderCheckoutDefaultsQuery,
} from "../api/cart.api";
import {
    validateOrderRecipientCheckout,
    type CartItem,
    type OrderRecipientCheckout,
} from "../schemas/cart.schema";
import { cartItemKey, getLineAmount, vnd } from "../utils/cartItem.utils";
import type { CheckoutNavigateState } from "../types/checkout.types";

function buildCheckoutLines(
    items: CartItem[],
    state: CheckoutNavigateState | undefined,
): CartItem[] {
    if (!state?.lineKeys?.length) return items;
    const set = new Set(state.lineKeys);
    return items.filter((i) => set.has(cartItemKey(i)));
}

export default function CheckoutPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const navState = (location.state as CheckoutNavigateState | undefined) ?? undefined;

    const { data: cart, isLoading, isError, refetch, isFetching } = useGetMyCartQuery(undefined);
    const { data: checkoutDefaults } = useGetOrderCheckoutDefaultsQuery();
    const [createOrder, { isLoading: isPlacing }] = useCreateOrderFromCartVariantsMutation();

    const [recipient, setRecipient] = useState<OrderRecipientCheckout>({
        fullName: "",
        phone: "",
        address: "",
    });
    const [recipientTouched, setRecipientTouched] = useState(false);
    const [editAddress, setEditAddress] = useState(false);
    const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);

    const lines = useMemo(
        () => buildCheckoutLines(cart?.items ?? [], navState),
        [cart?.items, navState],
    );

    useEffect(() => {
        if (!checkoutDefaults || recipientTouched) return;
        setRecipient({
            fullName: checkoutDefaults.fullName ?? "",
            phone: checkoutDefaults.phone ?? "",
            address: checkoutDefaults.address ?? "",
        });
    }, [checkoutDefaults, recipientTouched]);

    useEffect(() => {
        if (!isLoading && !isFetching && cart && cart.items.length > 0 && lines.length === 0) {
            navigate(ROUTES.CART, { replace: true });
        }
    }, [isLoading, isFetching, cart, lines.length, navigate]);

    const subtotal = useMemo(
        () => lines.reduce((sum, item) => sum + getLineAmount(item), 0),
        [lines],
    );

    const pricingSummary = useMemo(() => {
        const originalSubtotal = lines.reduce((sum, item) => {
            const baseUnit = item.originalUnitPrice ?? item.unitPrice;
            return sum + baseUnit * item.boxWeight * item.quantity;
        }, 0);
        const discountTotal = Math.max(0, originalSubtotal - subtotal);
        return { originalSubtotal, discountTotal, subtotal };
    }, [lines, subtotal]);

    const handlePlaceOrder = async () => {
        if (lines.length === 0 || isPlacing) return;
        setMessage(null);
        try {
            const latest = await refetch();
            const latestItems = latest.data?.items ?? cart?.items ?? [];
            const set = new Set(lines.map((l) => cartItemKey(l)));
            const fromServer = latestItems.filter((i) => set.has(cartItemKey(i)));
            if (fromServer.length === 0) {
                setMessage({
                    type: "error",
                    text: "Không còn sản phẩm hợp lệ trong giỏ. Vui lòng quay lại giỏ hàng.",
                });
                return;
            }

            const recipientCheck = validateOrderRecipientCheckout(recipient);
            if (!recipientCheck.ok) {
                setMessage({ type: "error", text: recipientCheck.message });
                return;
            }

            const payload = {
                recipient: recipientCheck.value,
                items: fromServer.map((item) => ({
                    productVariantId: item.productVariantId,
                    boxWeight: item.boxWeight,
                    isPartial: item.isPartial,
                    quantity: Math.max(1, Math.floor(item.quantity)),
                })),
            };

            const res = await createOrder(payload).unwrap();
            navigate(
                generatePath(ROUTES.CHECKOUT_ORDER_RECEIVED, { orderId: String(res.orderId) }),
                { replace: true },
            );
        } catch (e: unknown) {
            const err = e as { data?: { message?: string } };
            const text =
                err?.data?.message ?? "Đặt hàng chưa thành công. Vui lòng thử lại hoặc kiểm tra giỏ hàng.";
            setMessage({ type: "error", text });
            toast.error(text);
        }
    };

    if (isLoading || isFetching) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <p className="text-slate-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <p className="text-red-700 font-medium">Không tải được dữ liệu.</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 text-sm font-medium text-red-700 hover:underline"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!cart?.items?.length) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                    <p className="text-slate-600 mb-4">Giỏ hàng trống.</p>
                    <Link
                        to={ROUTES.CART}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#1a5f2a] text-white font-semibold hover:bg-[#145026]"
                    >
                        Về giỏ hàng
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-28 sm:pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Xác nhận đơn hàng</h1>
                    <p className="text-slate-600 mt-1 text-sm sm:text-base">
                        Xác nhận địa chỉ nhận hàng và sản phẩm trước khi đặt đơn.
                    </p>
                </div>
                <Link
                    to={ROUTES.CART}
                    className="text-sm font-medium text-[#1a5f2a] hover:underline shrink-0"
                >
                    ← Quay lại giỏ hàng
                </Link>
            </div>

            {message && message.type === "error" && (
                <div className="mb-4 rounded-xl p-4 border bg-red-50 border-red-200 text-red-800">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} />
                        <p className="font-medium">{message.text}</p>
                    </div>
                </div>
            )}

            {/* Địa chỉ — map OrderRecipientCheckoutDto */}
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-4">
                <div className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2 text-slate-900">
                        <MapPin className="text-[#1a5f2a]" size={17} />
                        <h2 className="font-semibold text-base">Địa Chỉ Nhận Hàng</h2>
                    </div>

                    {!editAddress ? (
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 text-sm">
                            <p className="font-semibold text-black">
                                {recipient.fullName || "—"} {recipient.phone || "—"}
                            </p>
                            <p className="text-slate-700 break-words">{recipient.address || "—"}</p>
                            <span className="inline-flex items-center text-[11px] font-medium border border-slate-300 text-slate-600 px-1.5 py-0.5 leading-none">
                                Mặc Định
                            </span>
                            <button
                                type="button"
                                onClick={() => setEditAddress(true)}
                                className="text-[#1677ff] text-sm hover:underline sm:ml-auto shrink-0"
                            >
                                Thay Đổi
                            </button>
                        </div>
                    ) : (
                        <div className="mt-3 space-y-3 max-w-2xl">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Họ và tên</label>
                                <input
                                    value={recipient.fullName}
                                    onChange={(e) => {
                                        setRecipientTouched(true);
                                        setRecipient((p) => ({ ...p, fullName: e.target.value }));
                                    }}
                                    className="mt-1 w-full rounded-sm border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Số điện thoại</label>
                                <input
                                    value={recipient.phone}
                                    onChange={(e) => {
                                        setRecipientTouched(true);
                                        setRecipient((p) => ({ ...p, phone: e.target.value }));
                                    }}
                                    className="mt-1 w-full rounded-sm border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Địa chỉ</label>
                                <textarea
                                    value={recipient.address}
                                    onChange={(e) => {
                                        setRecipientTouched(true);
                                        setRecipient((p) => ({ ...p, address: e.target.value }));
                                    }}
                                    rows={3}
                                    className="mt-1 w-full rounded-sm border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditAddress(false)}
                                    className="text-sm text-slate-600 hover:text-slate-800"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Sản phẩm — map CartItem + CreateOrderFromCartByVariantIdsRequest khi đặt */}
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-4">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                    <Package className="text-[#1a5f2a]" size={20} />
                    <h2 className="font-semibold text-slate-900">Sản phẩm</h2>
                </div>

                <div className="hidden sm:grid grid-cols-[1.7fr_0.8fr_0.7fr_0.9fr_0.3fr_0.9fr] gap-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                    <span>Sản phẩm</span>
                    <span className="text-right">Đơn giá gốc</span>
                    <span className="text-center">Giảm giá</span>
                    <span className="text-right">Đơn giá sau giảm</span>
                    <span className="text-center">SL</span>
                    <span className="text-right">Thành tiền</span>
                </div>

                <ul className="divide-y divide-slate-100">
                    {lines.map((item) => {
                        const key = cartItemKey(item);
                        const line = getLineAmount(item);
                        const originalUnitPrice = item.originalUnitPrice ?? item.unitPrice;
                        const safeOriginalUnitPrice = originalUnitPrice > 0 ? originalUnitPrice : item.unitPrice;
                        const rawDiscountPercent =
                            safeOriginalUnitPrice > 0
                                ? ((safeOriginalUnitPrice - item.unitPrice) / safeOriginalUnitPrice) * 100
                                : 0;
                        const discountPercent = Math.max(0, Math.round(rawDiscountPercent));
                        const hasDiscount = discountPercent > 0;
                        const boxLabel = item.isPartial ? "Hộp lẻ" : "Hộp đầy";
                        return (
                            <li key={key} className="p-4 flex flex-col sm:grid sm:grid-cols-[1.7fr_0.8fr_0.7fr_0.9fr_0.3fr_0.9fr] sm:gap-3 sm:items-center">
                                <div className="flex gap-3 min-w-0">
                                    <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                                Ảnh
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">{item.productName}</p>
                                        <p className="text-sm text-slate-600 mt-0.5">
                                            {boxLabel} · {item.boxWeight} kg · {item.grade}
                                        </p>
                                        <p className="sm:hidden mt-2 text-xs text-slate-500">
                                            Đơn giá gốc:{" "}
                                            <span className={hasDiscount ? "line-through" : "font-medium text-slate-700"}>
                                                {vnd(safeOriginalUnitPrice)} ₫/kg
                                            </span>
                                        </p>
                                        <p className="sm:hidden text-xs text-slate-500">
                                            Giảm giá:{" "}
                                            <span className="font-medium text-emerald-700">
                                                {hasDiscount ? `-${discountPercent}%` : "0%"}
                                            </span>
                                        </p>
                                        <p className="sm:hidden text-xs text-slate-500">
                                            Đơn giá sau giảm:{" "}
                                            <span className="font-semibold text-slate-900">{vnd(item.unitPrice)} ₫/kg</span>
                                        </p>
                                        <p className="sm:hidden text-sm font-semibold text-slate-900 mt-1">
                                            Thành tiền: {vnd(line)} ₫
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden sm:block text-right text-sm text-slate-500">
                                    <span className={hasDiscount ? "line-through" : "text-slate-800"}>
                                        {vnd(safeOriginalUnitPrice)} ₫/kg
                                    </span>
                                </div>
                                <div className="hidden sm:flex justify-center">
                                    <span className="inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                        {hasDiscount ? `-${discountPercent}%` : "0%"}
                                    </span>
                                </div>
                                <div className="hidden sm:block text-right text-sm font-semibold text-slate-900">
                                    {vnd(item.unitPrice)} ₫/kg
                                </div>
                                <div className="hidden sm:block text-center text-sm font-medium text-slate-900">
                                    {item.quantity}
                                </div>
                                <div className="hidden sm:block text-right font-semibold text-slate-900">
                                    {vnd(line)} ₫
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* Ghi chú: BE chưa có field — không gửi API */}
            {/* Tóm tắt + đặt hàng — chỉ gửi recipient + items khớp DTO */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:sticky sm:bottom-auto sm:top-[90px]">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Tổng thanh toán dự kiến</h2>
                <div className="flex justify-between text-slate-700 py-2 border-b border-slate-100">
                    <span>Tạm tính (giá gốc)</span>
                    <span className="font-semibold text-slate-900">{vnd(pricingSummary.originalSubtotal)} ₫</span>
                </div>
                <div className="flex justify-between text-slate-700 py-2 border-b border-slate-100">
                    <span>Giảm giá</span>
                    <span className="font-semibold text-emerald-700">- {vnd(pricingSummary.discountTotal)} ₫</span>
                </div>
                <div className="flex justify-between text-slate-900 py-2">
                    <span className="font-semibold">Tổng thanh toán</span>
                    <span className="font-bold">{vnd(pricingSummary.subtotal)} ₫</span>
                </div>
                <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={lines.length === 0 || isPlacing}
                    className="mt-5 w-full sm:w-auto sm:min-w-[200px] sm:ml-auto sm:flex inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3.5 rounded-lg font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                    {isPlacing ? "Đang xử lý..." : "Đặt hàng"}
                </button>
            </section>
        </div>
    );
}
