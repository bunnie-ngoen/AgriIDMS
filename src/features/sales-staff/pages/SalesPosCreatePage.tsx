import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useGetHomeProductsQuery, useGetHomeProductDetailQuery } from "../../home/api/home.api";
import type { HomeProduct } from "../../home/schemas/home.schema";
import { getHomeProductDiscountViewModel } from "../../home/utils/productDiscountDisplay";
import { useCreatePosOrderMutation, useLazyLookupPosCustomerByPhoneQuery } from "../../order/api/order.api";
import SalesStaffPageShell from "../components/SalesStaffPageShell";

type PosFormItem = {
  key: string;
  productVariantId: string;
  boxWeight: string;
  quantity: string;
  isPartial: boolean;
};

type RecreateOrderPrefill = {
  sourceOrderId: number;
  fulfillmentType: 0 | 1;
  /** Nếu có (đơn cũ gắn tài khoản), coi như khách đã xác thực — không bắt tìm lại. */
  customerUserId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  note?: string;
  expectedPaymentMethod?: "COD" | "BANKING";
  items: PosFormItem[];
};

type CustomerLookupMatch = "unset" | "found" | "guest" | "error";

function vnd(n: number) {
  return n.toLocaleString("vi-VN");
}

function gradeLabel(grade: number) {
  if (grade === 1) return "Hạng 1";
  if (grade === 2) return "Hạng 2";
  if (grade === 3) return "Hạng 3";
  return `Hạng ${grade}`;
}

function makeRow(seed: number): PosFormItem {
  return {
    key: `row-${Date.now()}-${seed}`,
    productVariantId: "",
    boxWeight: "",
    quantity: "1",
    isPartial: false,
  };
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const e = err as {
    data?: { message?: string; error?: string; detail?: string };
    message?: string;
  };
  return e?.data?.message || e?.data?.error || e?.data?.detail || e?.message || fallback;
}

type PosRowProps = {
  row: PosFormItem;
  variants: HomeProduct[];
  updateRow: <K extends keyof PosFormItem>(key: string, field: K, value: PosFormItem[K]) => void;
  removeRow: (key: string) => void;
  canRemove: boolean;
};

function PosRow({ row, variants, updateRow, removeRow, canRemove }: PosRowProps) {
  const variantId = Number(row.productVariantId);
  const {
    data: productDetail,
  } = useGetHomeProductDetailQuery(variantId, {
    skip: !Number.isFinite(variantId) || variantId <= 0,
  });

  const boxTypes = productDetail?.boxTypes ?? [];
  const selectedVariant = variants.find((v) => String(v.id) === row.productVariantId);
  /** Chi tiết Home khi đã load — ưu tiên; không thì dùng bản ghi GET product-variants (cùng field nearExpiry*). */
  const displayPriceVm = selectedVariant
    ? getHomeProductDiscountViewModel(productDetail ?? selectedVariant)
    : null;
  const selectedOptionValue = row.boxWeight
    ? `${row.isPartial ? "Partial" : "Full"}|${row.boxWeight}`
    : "";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-600">Biến thể</label>
              <select
                value={row.productVariantId}
                onChange={(e) => {
                  updateRow(row.key, "productVariantId", e.target.value);
                  // Reset các trường phụ thuộc khi đổi biến thể.
                  updateRow(row.key, "boxWeight", "");
                  updateRow(row.key, "isPartial", false);
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Chọn biến thể</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.productName} - {gradeLabel(v.grade)} (ID {v.id})
                  </option>
                ))}
              </select>
            </div>

            {selectedVariant && displayPriceVm ? (
              <div className="min-w-[220px] max-w-[260px]">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600">Giá bán (₫/kg)</label>
                  {displayPriceVm.hasDiscount ? (
                    <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                      Giảm giá
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 space-y-0.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  {displayPriceVm.hasDiscount && displayPriceVm.salePricePerKg != null ? (
                    <>
                      <div className="text-xs text-slate-500 line-through tabular-nums">
                        {vnd(displayPriceVm.basePricePerKg)} ₫/kg
                      </div>
                      <div className="font-semibold tabular-nums text-rose-700">
                        {vnd(displayPriceVm.salePricePerKg)} ₫/kg
                      </div>
                      {displayPriceVm.discountPercent != null ? (
                        <div className="text-[11px] font-medium text-rose-800">
                          −{displayPriceVm.discountPercent}%
                        </div>
                      ) : null}
                    </>
                  ) : displayPriceVm.hasDiscount &&
                    displayPriceVm.salePricePerKg == null &&
                    displayPriceVm.tiers.length > 0 ? (
                    <>
                      <div className="text-xs text-slate-500 line-through tabular-nums">
                        {vnd(displayPriceVm.basePricePerKg)} ₫/kg
                      </div>
                      <div className="text-xs font-medium text-amber-800">
                        Theo mức HSD từ {vnd(displayPriceVm.tiers[0]!.pricePerKg)} ₫/kg — giá cuối khớp khi tạo đơn
                      </div>
                    </>
                  ) : (
                    <div className="font-medium tabular-nums">{vnd(displayPriceVm.basePricePerKg)} ₫/kg</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-[220px]" />
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Khối lượng/thùng (kg)</label>
          <select
            value={selectedOptionValue}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                updateRow(row.key, "boxWeight", "");
                updateRow(row.key, "isPartial", false);
                return;
              }
              const [boxType, weightStr] = value.split("|");
              updateRow(row.key, "boxWeight", weightStr ?? "");
              updateRow(row.key, "isPartial", boxType === "Partial");
            }}
            disabled={!Number.isFinite(variantId) || variantId <= 0 || boxTypes.length === 0}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
          >
            <option value="">Chọn khối lượng thùng</option>
            {boxTypes.map((box) => {
              const typeLabel = box.boxType === "Partial" ? "Hộp lẻ" : "Hộp đầy";
              return (
                <option key={`${box.boxType}-${box.weight}`} value={`${box.boxType}|${box.weight}`}>
                  {typeLabel} - {box.weight} kg (Còn {box.availableCount} thùng)
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Số lượng thùng</label>
          <input
            type="number"
            min={1}
            step={1}
            value={row.quantity}
            onChange={(e) => updateRow(row.key, "quantity", e.target.value)}
            disabled={!row.boxWeight}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>

        <div className="flex items-end justify-between gap-2">
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            disabled={!canRemove}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            Xóa
          </button>
        </div>
      </div>

    </div>
  );
}

export default function SalesPosCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: variants = [], isLoading: isLoadingVariants } = useGetHomeProductsQuery();
  const [createPosOrder, { isLoading: isCreating }] = useCreatePosOrderMutation();
  const [triggerLookupCustomer, { isFetching: isLookupFetching }] = useLazyLookupPosCustomerByPhoneQuery();

  const [rows, setRows] = useState<PosFormItem[]>([makeRow(1)]);
  const [fulfillmentType, setFulfillmentType] = useState<0 | 1>(0);
  /** UserId khách (Customer) sau tra cứu SĐT hoặc từ prefill — không nhập tay trên form. */
  const [resolvedCustomerUserId, setResolvedCustomerUserId] = useState<string | null>(null);
  const [customerMatch, setCustomerMatch] = useState<CustomerLookupMatch>("unset");
  const [lastSearchedPhone, setLastSearchedPhone] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [note, setNote] = useState("");
  const [expectedPaymentMethod, setExpectedPaymentMethod] = useState<"COD" | "BANKING">("COD");
  const [sourceOrderId, setSourceOrderId] = useState<number | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [createdTotalAmount, setCreatedTotalAmount] = useState<number | null>(null);
  const [handoffMessage, setHandoffMessage] = useState<string>("");

  const activeVariants = useMemo(
    () => variants,
    [variants],
  );

  const phoneDirty =
    lastSearchedPhone !== null && customerPhone.trim() !== lastSearchedPhone.trim();
  const canUseLinkedAccount =
    customerMatch === "found" &&
    !!resolvedCustomerUserId?.trim() &&
    !phoneDirty;

  const onCustomerPhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (lastSearchedPhone !== null && value.trim() !== lastSearchedPhone.trim()) {
      setResolvedCustomerUserId(null);
      setCustomerMatch("unset");
    }
  };

  const handleLookupCustomer = async () => {
    const q = customerPhone.trim();
    if (!q) {
      toast.error("Vui lòng nhập số điện thoại trước khi tìm kiếm.");
      return;
    }
    try {
      const res = await triggerLookupCustomer(q).unwrap();
      setLastSearchedPhone(q);
      if (res.found && res.customerUserId) {
        setResolvedCustomerUserId(res.customerUserId);
        setCustomerMatch("found");
        setCustomerName((res.fullName ?? "").trim());
        setCustomerPhone((res.phoneNumber ?? q).trim());
        setCustomerAddress((res.address ?? "").trim());
      } else {
        setResolvedCustomerUserId(null);
        setCustomerMatch("guest");
        setCustomerName("");
        setCustomerPhone(q);
        setCustomerAddress("");
      }
    } catch {
      setCustomerMatch("error");
      toast.error("Không thể kiểm tra khách hàng, vui lòng thử lại.");
    }
  };

  useEffect(() => {
    const state = location.state as { prefillFromOrder?: RecreateOrderPrefill } | null;
    const prefill = state?.prefillFromOrder;
    if (!prefill) return;

    setSourceOrderId(prefill.sourceOrderId);
    setFulfillmentType(prefill.fulfillmentType);
    const uid = prefill.customerUserId?.trim();
    if (uid) {
      setResolvedCustomerUserId(uid);
      setCustomerMatch("found");
      setLastSearchedPhone(prefill.customerPhone?.trim() ?? null);
    } else {
      setResolvedCustomerUserId(null);
      setCustomerMatch("unset");
      setLastSearchedPhone(null);
    }
    setCustomerName(prefill.customerName ?? "");
    setCustomerPhone(prefill.customerPhone ?? "");
    setCustomerAddress(prefill.customerAddress ?? "");
    setNote(prefill.note ?? "");
    setExpectedPaymentMethod(prefill.expectedPaymentMethod ?? "COD");
    setRows(prefill.items.length > 0 ? prefill.items : [makeRow(1)]);
  }, [location.state]);

  const addRow = () => setRows((prev) => [...prev, makeRow(prev.length + 1)]);

  const removeRow = (key: string) =>
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));

  const updateRow = <K extends keyof PosFormItem>(key: string, field: K, value: PosFormItem[K]) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedItems = rows.map((r) => ({
      productVariantId: Number(r.productVariantId),
      boxWeight: Number(r.boxWeight),
      quantity: Number(r.quantity),
      isPartial: r.isPartial,
    }));

    if (
      parsedItems.some(
        (x) =>
          !Number.isInteger(x.productVariantId) ||
          x.productVariantId <= 0 ||
          !Number.isFinite(x.boxWeight) ||
          x.boxWeight <= 0 ||
          !Number.isFinite(x.quantity) ||
          x.quantity <= 0 ||
          !Number.isInteger(x.quantity),
      )
    ) {
      toast.error("Vui lòng chọn đúng biến thể, khối lượng thùng (>0) và nhập số lượng thùng (nguyên dương).");
      return;
    }

    if (!canUseLinkedAccount && !customerPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại khách (hoặc tra cứu để gắn tài khoản).");
      return;
    }

    const t = toast.loading("Đang tạo đơn mua trực tiếp tại quầy...");
    setCreatedOrderId(null);
    setCreatedTotalAmount(null);
    setHandoffMessage("");
    try {
      const created = await createPosOrder({
        fulfillmentType,
        // POS tại quầy chỉ trả trước (PayBefore); không hỗ trợ trả sau.
        paymentTiming: fulfillmentType === 1 ? 0 : undefined,
        customerUserId: canUseLinkedAccount ? resolvedCustomerUserId!.trim() : undefined,
        customerName: canUseLinkedAccount ? undefined : customerName.trim() || undefined,
        customerPhone: canUseLinkedAccount ? undefined : customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        items: parsedItems,
      }).unwrap();

      if (!created.orderId) {
        throw new Error("API không trả về orderId hợp lệ");
      }

      const createdText = `Tạo đơn POS thành công: Đơn hàng ${created.orderId}.`;
      setCreatedOrderId(created.orderId);
      setCreatedTotalAmount(created.totalAmount ?? 0);
      toast.success(createdText, { id: t });

      // Đơn POS (kể cả Delivery) BE tạo ở Confirmed và đã ReserveStockImmediately — không qua AwaitingAllocation.
      // Gọi auto-propose sau tạo đơn sẽ luôn lỗi "Chỉ có thể giữ hàng khi... Confirmed".
      if (fulfillmentType === 1) {
        setHandoffMessage(
          "Đơn POS giao hàng đã ở trạng thái Confirmed và kho đã giữ thùng khi tạo đơn. Tiếp tục: thu thanh toán (trả trước) → xuất kho → giao — không cần bước auto-propose như đơn online.",
        );
      } else {
        setHandoffMessage("TakeAway: đơn đã được giữ hàng ngay, chuyển sang bước thanh toán.");
      }
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Tạo đơn POS thất bại.");
      toast.error(msg, { id: t });
    }
  };

  return (
    <SalesStaffPageShell>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tạo đơn mua trực tiếp tại quầy</h1>
          <p className="text-sm text-slate-600 mt-1">
            Tạo đơn cho khách đến kho mua trực tiếp.
          </p>
        </div>
        <Link
          to="/sales/orders/sale-confirm"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Quay lại danh sách đơn
        </Link>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        {sourceOrderId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Đang tạo lại từ đơn cũ #{sourceOrderId}. Hệ thống sẽ tạo đơn mới với mã/thời gian/trạng thái mới và kiểm
            tra lại tồn kho, giá, giảm giá theo dữ liệu hiện tại.
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Hình thức nhận</label>
            <select
              value={fulfillmentType}
              onChange={(e) => setFulfillmentType(Number(e.target.value) as 0 | 1)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value={0}>Nhận tại quầy</option>
              <option value={1}>Giao hàng tận nơi</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Hình thức thanh toán dự kiến</label>
            <select
              value={expectedPaymentMethod}
              onChange={(e) => setExpectedPaymentMethod((e.target.value as "COD" | "BANKING"))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="COD">Tiền mặt </option>
              <option value="BANKING">Chuyển khoản ngân hàng</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Số điện thoại</label>
            <div className="mt-1 flex min-h-[42px] rounded-lg border border-slate-300 bg-white shadow-sm ring-1 ring-slate-900/5 focus-within:border-[#1a5f2a] focus-within:ring-2 focus-within:ring-[#1a5f2a]/20">
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                placeholder="Ví dụ: 09xxxxxxxx"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => void handleLookupCustomer()}
                disabled={isLookupFetching}
                className="shrink-0 border-l border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLookupFetching ? "Đang tìm..." : "Tìm kiếm"}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {canUseLinkedAccount ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  Khách đã có tài khoản
                </span>
              ) : null}
              {customerMatch === "guest" && lastSearchedPhone !== null && !phoneDirty ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                  Khách vãng lai
                </span>
              ) : null}
              {customerMatch === "found" && !phoneDirty ? (
                <span className="text-[11px] font-medium text-emerald-700">
                  Đã tìm thấy khách hàng trong hệ thống.
                </span>
              ) : null}
              {customerMatch === "guest" && lastSearchedPhone !== null && !phoneDirty ? (
                <span className="text-[11px] font-medium text-amber-800">
                  Không tìm thấy tài khoản, tạo đơn cho khách vãng lai.
                </span>
              ) : null}
              {phoneDirty ? (
                <span className="text-[11px] font-medium text-slate-600">
                  Số điện thoại đã thay đổi — bấm Tìm kiếm để cập nhật khách theo SĐT mới.
                </span>
              ) : null}
            </div>
            {resolvedCustomerUserId && canUseLinkedAccount ? (
              <div className="mt-2">
                <label className="text-xs font-medium text-slate-500">Mã tài khoản khách (tự điền)</label>
                <input
                  readOnly
                  value={resolvedCustomerUserId}
                  className="mt-1 w-full cursor-default rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
                />
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Tên khách hàng</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={canUseLinkedAccount}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Địa chỉ khách hàng</label>
            <input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder={
                canUseLinkedAccount
                  ? "Địa chỉ giao / ghi nhận (có thể chỉnh trước khi tạo đơn)"
                  : "Địa chỉ ( tùy chọn)"
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ghi chú tại quầy "
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Danh sách mặt hàng</p>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus size={14} />
              Thêm dòng
            </button>
          </div>

          {rows.map((row) => (
            <PosRow
              key={row.key}
              row={row}
              variants={activeVariants}
              updateRow={updateRow}
              removeRow={removeRow}
              canRemove={rows.length > 1}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isCreating || isLoadingVariants}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isCreating ? "Đang tạo đơn..." : "Tạo đơn"}
        </button>
      </form>

      {createdOrderId && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Đã tạo thành công đơn mới #{createdOrderId}
            {sourceOrderId ? (
              <span className="font-normal text-emerald-700">
                {" "}
                (tham chiếu tạo lại từ đơn #{sourceOrderId})
              </span>
            ) : null}
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Thành tiền (VNĐ): {vnd(createdTotalAmount ?? 0)} ₫
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {fulfillmentType === 1
              ? "Đơn Delivery: kho/staff tiếp tục allocation -> xuất kho -> giao hàng."
              : "Đơn TakeAway: sau khi quản lý duyệt phiếu xuất, kho xác nhận đã giao cho khách tại quầy thì đơn mới hoàn tất (Delivered)."}
          </p>
          {!!handoffMessage && (
            <p className="mt-2 text-xs text-emerald-800">{handoffMessage}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {fulfillmentType === 1 && (
              <button
                type="button"
                onClick={() => navigate(`/sales/orders?orderId=${createdOrderId}`)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
              >
                Mở hàng đợi đơn để theo dõi
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/sales/orders/${createdOrderId}`)}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Mở chi tiết đơn để xử lý tiếp
            </button>
            <button
              type="button"
              onClick={() => {
                setRows([makeRow(1)]);
                setFulfillmentType(0);
                setResolvedCustomerUserId(null);
                setCustomerMatch("unset");
                setLastSearchedPhone(null);
                setCustomerName("");
                setCustomerPhone("");
                setCustomerAddress("");
                setNote("");
                setExpectedPaymentMethod("COD");
                setSourceOrderId(null);
                setCreatedOrderId(null);
                setCreatedTotalAmount(null);
                setHandoffMessage("");
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tạo đơn mới
            </button>
          </div>
        </div>
      )}
    </div>
    </SalesStaffPageShell>
  );
}
