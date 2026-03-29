import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useGetProductVariantsQuery } from "../../product/api/product-variant.api";
import {
  useAutoProposeAllocationAsStaffMutation,
  useCreatePosOrderMutation,
} from "../../order/api/order.api";

type PosFormItem = {
  key: string;
  productVariantId: string;
  boxWeight: string;
  quantity: string;
  unitPrice: string;
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
    boxWeight: "1",
    quantity: "1",
    unitPrice: "",
    isPartial: false,
  };
}

export default function SalesPosCreatePage() {
  const navigate = useNavigate();
  const { data: variants = [], isLoading: isLoadingVariants } = useGetProductVariantsQuery();
  const [createPosOrder, { isLoading: isCreating }] = useCreatePosOrderMutation();
  const [autoPropose, { isLoading: isAutoProposing }] = useAutoProposeAllocationAsStaffMutation();

  const [rows, setRows] = useState<PosFormItem[]>([makeRow(1)]);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [createdTotalAmount, setCreatedTotalAmount] = useState<number | null>(null);
  const [handoffMessage, setHandoffMessage] = useState<string>("");
  const [hasProposal, setHasProposal] = useState<boolean | null>(null);

  const activeVariants = useMemo(
    () => variants.filter((v) => v.isActive),
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
      unitPrice: r.unitPrice.trim() === "" ? undefined : Number(r.unitPrice),
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
      toast.error("Vui lòng nhập đúng biến thể, số lượng (nguyên dương) và khối lượng thùng (>0).");
      return;
    }

    if (parsedItems.some((x) => x.unitPrice !== undefined && (!Number.isFinite(x.unitPrice) || x.unitPrice <= 0))) {
      toast.error("Đơn giá (nếu nhập) phải lớn hơn 0.");
      return;
    }

    const t = toast.loading("Đang tạo đơn mua trực tiếp tại quầy...");
    setCreatedOrderId(null);
    setCreatedTotalAmount(null);
    setHandoffMessage("");
    setHasProposal(null);
    try {
      const created = await createPosOrder({
        items: parsedItems,
      }).unwrap();

      if (!created.orderId) {
        throw new Error("API không trả về orderId hợp lệ");
      }

      let message = `Tạo đơn POS thành công: Đơn hàng ${created.orderId}`;
      const proposal = await autoPropose(created.orderId).unwrap();
      if ((proposal.proposedBoxCount ?? 0) > 0) {
        message += ". Đã tự động đề xuất FEFO, chuyển kho xác nhận phân bổ.";
        setHandoffMessage(
          "Đơn đã có đề xuất FEFO. Kho vào tab \"Chờ kho xác nhận\" để xem đề xuất và xác nhận phân bổ.",
        );
        setHasProposal(true);
        toast.success(message, { id: t });
      } else {
        message = `Đơn hàng ${created.orderId}: không có box khả dụng để đề xuất FEFO.`;
        setHandoffMessage(
          "Chưa có box khả dụng để đề xuất FEFO. Sales vào \"POS chưa có đề xuất FEFO\" để theo dõi và thử đề xuất lại.",
        );
        setHasProposal(false);
        toast.error(message, { id: t });
      }
      setCreatedOrderId(created.orderId);
      setCreatedTotalAmount(created.totalAmount ?? 0);
    } catch {
      toast.error("Tạo đơn POS thất bại.", { id: t });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tạo đơn mua trực tiếp tại quầy (POS)</h1>
          <p className="text-sm text-slate-600 mt-1">
            Tạo đơn cho khách đến kho mua trực tiếp. Đơn POS không cần sale-confirm.
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-700">Khách mua tại quầy</p>
            <p className="mt-1 text-xs text-slate-500">
              Đơn sẽ được tạo theo tài khoản nhân sự đang thao tác.
            </p>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
            <p className="text-xs font-medium text-indigo-700">Đề xuất FEFO tự động</p>
            <p className="mt-1 text-xs text-indigo-700">
              Hệ thống sẽ tự đề xuất FEFO ngay sau khi tạo đơn để kho chỉ cần mở đề xuất và xác nhận phân bổ.
            </p>
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

          {rows.map((row, idx) => {
            const selectedVariant = activeVariants.find((v) => String(v.id) === row.productVariantId);
            return (
              <div key={row.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-3 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Biến thể</label>
                    <select
                      value={row.productVariantId}
                      onChange={(e) => updateRow(row.key, "productVariantId", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Chọn biến thể</option>
                      {activeVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.productName} - {gradeLabel(v.grade)} (ID {v.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Khối lượng/thùng (kg)</label>
                    <input
                      type="number"
                      min={0.1}
                      step="0.1"
                      value={row.boxWeight}
                      onChange={(e) => updateRow(row.key, "boxWeight", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Số lượng thùng</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, "quantity", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Đơn giá/kg (tùy chọn)</label>
                    <input
                      type="number"
                      min={0}
                      step="100"
                      value={row.unitPrice}
                      onChange={(e) => updateRow(row.key, "unitPrice", e.target.value)}
                      placeholder="Để trống = giá variant"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={row.isPartial}
                        onChange={(e) => updateRow(row.key, "isPartial", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Mua lẻ
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      disabled={rows.length <= 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Xóa
                    </button>
                  </div>
                </div>

                {selectedVariant && (
                  <p className="mt-2 text-xs text-slate-600">
                    Giá hiện tại: <span className="font-semibold">{vnd(selectedVariant.price)} ₫/kg</span>
                    {" · "}
                    Tồn khả dụng: <span className="font-semibold">{selectedVariant.availableBoxCount ?? 0} thùng</span>
                    {" · "}
                    Dòng hàng: <span className="font-semibold">#{idx + 1}</span>
                  </p>
                )}
              </div>
            );
          })}
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
              : "Tạo đơn POS"}
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
            Sau bước này, kho sẽ vào màn kho để xác nhận phân bổ và tiếp tục luồng xuất hàng.
          </p>
          {!!handoffMessage && (
            <p className="mt-2 text-xs text-emerald-800">{handoffMessage}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {hasProposal === false && (
              <button
                type="button"
                onClick={() => navigate(`/sales/orders/pos-no-proposal?orderId=${createdOrderId}`)}
                className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
              >
                Mở danh sách POS chưa có đề xuất
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/sales/orders/pending-customer-decision?orderId=${createdOrderId}`)}
              className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
            >
              Đến trang thiếu hàng (nếu có)
            </button>
            <button
              type="button"
              onClick={() => {
                setRows([makeRow(1)]);
                setCreatedOrderId(null);
                setCreatedTotalAmount(null);
                setHandoffMessage("");
                setHasProposal(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tạo đơn POS mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
