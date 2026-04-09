import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useGetHomeProductsQuery, useGetHomeProductDetailQuery } from "../../home/api/home.api";
import type { HomeProduct } from "../../home/schemas/home.schema";
import {
  useAutoProposeAllocationAsStaffMutation,
  useCreatePosOrderMutation,
} from "../../order/api/order.api";
import SalesStaffPageShell from "../components/SalesStaffPageShell";

type PosFormItem = {
  key: string;
  productVariantId: string;
  boxWeight: string;
  quantity: string;
  isPartial: boolean;
};

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

            {selectedVariant ? (
              <div className="w-[220px]">
                <label className="text-xs font-medium text-slate-600">Giá bán (₫/kg)</label>
                <input
                  type="text"
                  readOnly
                  value={`${vnd(selectedVariant.price)} ₫/kg`}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                />
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
  const { data: variants = [], isLoading: isLoadingVariants } = useGetHomeProductsQuery();
  const [createPosOrder, { isLoading: isCreating }] = useCreatePosOrderMutation();
  const [autoPropose, { isLoading: isAutoProposing }] = useAutoProposeAllocationAsStaffMutation();

  const [rows, setRows] = useState<PosFormItem[]>([makeRow(1)]);
  const [fulfillmentType, setFulfillmentType] = useState<0 | 1>(0);
  const [customerUserId, setCustomerUserId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [createdTotalAmount, setCreatedTotalAmount] = useState<number | null>(null);
  const [handoffMessage, setHandoffMessage] = useState<string>("");

  const activeVariants = useMemo(
    () => variants,
    [variants],
  );

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

    const t = toast.loading("Đang tạo đơn mua trực tiếp tại quầy...");
    setCreatedOrderId(null);
    setCreatedTotalAmount(null);
    setHandoffMessage("");
    try {
      const created = await createPosOrder({
        fulfillmentType,
        customerUserId: customerUserId.trim() || undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: parsedItems,
      }).unwrap();

      if (!created.orderId) {
        throw new Error("API không trả về orderId hợp lệ");
      }

      const createdText = `Tạo đơn POS thành công: Đơn hàng ${created.orderId}.`;
      setCreatedOrderId(created.orderId);
      setCreatedTotalAmount(created.totalAmount ?? 0);
      toast.success(createdText, { id: t });

      if (fulfillmentType === 1) {
        // Delivery mới đi allocation flow, nên auto-propose FEFO sau khi tạo đơn.
        try {
          const proposal = await autoPropose(created.orderId).unwrap();
          const hasProposalValue = (proposal.proposedBoxCount ?? 0) > 0;
          setHandoffMessage(proposal.message ?? "");

          if (hasProposalValue) {
            toast.success(proposal.message ?? "Đã đề xuất FEFO, chờ kho xác nhận.", { id: t });
          } else {
            // proposedBoxCount = 0 nghĩa là BE không có box khả dụng để đề xuất allocate
            toast.error(proposal.message ?? "Không có box khả dụng để đề xuất FEFO.", { id: t });
          }
        } catch (e: unknown) {
          const msg = getApiErrorMessage(e, "Không thể tự động đề xuất FEFO.");
          setHandoffMessage(msg);
          toast.error(msg, { id: t });
        }
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
            <label className="text-xs font-medium text-slate-600">Customer User ID (nếu có)</label>
            <input
              value={customerUserId}
              onChange={(e) => setCustomerUserId(e.target.value)}
              placeholder="Nhập mã tài khoản khách (nếu có)"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Tên khách hàng</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Số điện thoại</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ví dụ: 09xxxxxxxx"
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
          disabled={isCreating || isAutoProposing || isLoadingVariants}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isCreating
            ? "Đang tạo đơn..."
            : isAutoProposing
              ? "Đang tự đề xuất FEFO..."
              : "Tạo đơn"}
        </button>
      </form>

      {createdOrderId && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Đã tạo thành công Đơn hàng {createdOrderId}
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Thành tiền (VNĐ): {vnd(createdTotalAmount ?? 0)} ₫
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {fulfillmentType === 1
              ? "Đơn Delivery: kho/staff tiếp tục allocation -> xuất kho -> giao hàng."
              : "Đơn TakeAway: thanh toán thành công sẽ tự chuyển Delivered."}
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
                setCustomerUserId("");
                setCustomerName("");
                setCustomerPhone("");
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
