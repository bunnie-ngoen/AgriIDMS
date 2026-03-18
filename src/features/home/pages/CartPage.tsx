import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Minus, Plus, Leaf } from "lucide-react";
import {
    useGetCartQuery,
    useUpdateCartItemMutation,
    useRemoveCartItemMutation,
    useClearCartMutation,
    useCreateOrderFromCartMutation,
} from "../api/home.api";
import type { CartItem } from "../schemas/home.schema";
import { ROUTES } from "../../../shared/constants/routes";

function formatPrice(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function CartItemRow({
    item,
    onUpdate,
    onRemove,
    isUpdating,
}: {
    item: CartItem;
    onUpdate: (qty: number) => void;
    onRemove: () => void;
    isUpdating: boolean;
}) {
    return (
        <div className="flex flex-wrap items-center gap-4 py-4 border-b border-slate-100 last:border-0">
            <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Leaf size={24} />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{item.productName}</p>
                <p className="text-sm text-slate-500">
                    Hạng {String(item.grade)} · {item.boxWeight}kg · {item.isPartial ? "Nửa hộp" : "Nguyên hộp"}
                </p>
                <p className="text-sm text-[#1a5f2a] font-medium mt-0.5">{formatPrice(item.unitPrice)} / kg</p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onUpdate(Math.max(1, item.quantity - 1))}
                    disabled={isUpdating || item.quantity <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                    <Minus size={16} />
                </button>
                <span className="w-10 text-center font-medium">{item.quantity}</span>
                <button
                    type="button"
                    onClick={() => onUpdate(item.quantity + 1)}
                    disabled={isUpdating}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                    <Plus size={16} />
                </button>
            </div>
            <p className="w-28 text-right font-semibold text-slate-800">
                {formatPrice(item.lineAmount ?? item.quantity * item.unitPrice * item.boxWeight)}
            </p>
            <button
                type="button"
                onClick={onRemove}
                disabled={isUpdating}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                aria-label="Xóa"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}

export default function CartPage() {
    const navigate = useNavigate();
    const { data: cart, isLoading } = useGetCartQuery();
    const [updateItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
    const [removeItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
    const [clearCart, { isLoading: isClearing }] = useClearCartMutation();
    const [createOrder, { isLoading: isPlacing }] = useCreateOrderFromCartMutation();

    const handleUpdate = (item: CartItem, quantity: number) => {
        updateItem({
            productVariantId: item.productVariantId,
            boxWeight: item.boxWeight,
            isPartial: item.isPartial,
            quantity,
        });
    };

    const handleRemove = (item: CartItem) => {
        removeItem({
            productVariantId: item.productVariantId,
            boxWeight: item.boxWeight,
            isPartial: item.isPartial,
        });
    };

    const handleClear = () => {
        if (window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
            clearCart();
        }
    };

    const handlePlaceOrder = async () => {
        try {
            const res = await createOrder().unwrap();
            navigate(ROUTES.ORDER_SUCCESS, {
                state: { orderId: res.orderId, totalAmount: res.totalAmount },
            });
        } catch (e: unknown) {
            const msg =
                (e as { data?: { error?: string; message?: string } })?.data?.error ??
                (e as { data?: { error?: string; message?: string } })?.data?.message ??
                "Tạo đơn hàng thất bại. Vui lòng đăng nhập (Customer) và thử lại.";
            alert(msg);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const items = cart?.items ?? [];
    const total = cart?.totalAmount ?? 0;

    if (items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 text-slate-400 mb-6">
                    <ShoppingCart size={40} />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Giỏ hàng trống</h2>
                <p className="text-slate-500 mb-8">Thêm sản phẩm từ trang chủ hoặc trang chi tiết sản phẩm.</p>
                <a
                    href="/#san-pham"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a5f2a] text-white font-medium hover:bg-[#145026]"
                >
                    Xem sản phẩm
                </a>
            </div>
        );
    }

    const busy = isUpdating || isRemoving || isClearing || isPlacing;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="text-[#1a5f2a]" size={28} />
                    Giỏ hàng
                </h1>
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={busy}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                    Xóa toàn bộ
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100 px-4 sm:px-6">
                    {items.map((item) => (
                        <CartItemRow
                            key={`${item.productVariantId}-${item.boxWeight}-${item.isPartial}`}
                            item={item}
                            onUpdate={(qty) => handleUpdate(item, qty)}
                            onRemove={() => handleRemove(item)}
                            isUpdating={busy}
                        />
                    ))}
                </div>
                <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-lg font-semibold text-slate-800">
                        Tổng cộng: <span className="text-[#1a5f2a]">{formatPrice(total)}</span>
                    </p>
                    <div className="flex gap-3">
                        <a
                            href="/#san-pham"
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                        >
                            Tiếp tục mua
                        </a>
                        <button
                            type="button"
                            onClick={handlePlaceOrder}
                            disabled={busy}
                            className="px-6 py-2.5 rounded-xl bg-[#1a5f2a] text-white font-semibold hover:bg-[#145026] disabled:opacity-60"
                        >
                            {isPlacing ? "Đang tạo đơn..." : "Đặt hàng"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
