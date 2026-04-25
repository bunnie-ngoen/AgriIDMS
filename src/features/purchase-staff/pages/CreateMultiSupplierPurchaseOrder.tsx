import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useGetSuppliersQuery } from "../../supplier/api/supplier.api";
import { useGetProductsQuery } from "../../product/api/product.api";
import { useCreateMultiSupplierPurchaseOrderMutation } from "../../purchase-order/api/purchase-order.api";
import type { CreateMultiSupplierPurchaseOrderRequest } from "../../purchase-order/types/purchase-order.type";

type SupplierPlanLine = {
  productId: number;
  orderedWeight: number;
  unitPriceAtOrder: number;
  priceDate: string;
  tolerancePercent: number;
};

type SupplierPlanForm = {
  supplierId: number;
  orderDate: string;
  notes: string;
  details: SupplierPlanLine[];
};

const getTodayLocalYmd = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const newLine = (): SupplierPlanLine => ({
  productId: 0,
  orderedWeight: 0,
  unitPriceAtOrder: 0,
  priceDate: getTodayLocalYmd(),
  tolerancePercent: 0,
});

const newPlan = (): SupplierPlanForm => ({
  supplierId: 0,
  orderDate: getTodayLocalYmd(),
  notes: "",
  details: [newLine()],
});

export default function CreateMultiSupplierPurchaseOrder() {
  const navigate = useNavigate();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: products = [] } = useGetProductsQuery();
  const [createMultiPo, { isLoading }] = useCreateMultiSupplierPurchaseOrderMutation();
  const [plans, setPlans] = useState<SupplierPlanForm[]>([newPlan()]);

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);
  const activeSuppliers = useMemo(() => suppliers, [suppliers]);

  const updatePlan = <K extends keyof SupplierPlanForm>(idx: number, key: K, value: SupplierPlanForm[K]) => {
    setPlans((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));
  };

  const updateLine = <K extends keyof SupplierPlanLine>(
    planIdx: number,
    lineIdx: number,
    key: K,
    value: SupplierPlanLine[K],
  ) => {
    setPlans((prev) =>
      prev.map((plan, i) => {
        if (i !== planIdx) return plan;
        return {
          ...plan,
          details: plan.details.map((line, j) => (j === lineIdx ? { ...line, [key]: value } : line)),
        };
      }),
    );
  };

  const addPlan = () => setPlans((prev) => [...prev, newPlan()]);
  const removePlan = (idx: number) =>
    setPlans((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  const addLine = (planIdx: number) =>
    setPlans((prev) =>
      prev.map((plan, i) => (i === planIdx ? { ...plan, details: [...plan.details, newLine()] } : plan)),
    );

  const removeLine = (planIdx: number, lineIdx: number) =>
    setPlans((prev) =>
      prev.map((plan, i) => {
        if (i !== planIdx) return plan;
        if (plan.details.length <= 1) return plan;
        return { ...plan, details: plan.details.filter((_, j) => j !== lineIdx) };
      }),
    );

  const validate = (): string[] => {
    const errors: string[] = [];
    if (!plans.length) errors.push("Phải có ít nhất 1 kế hoạch nhà cung cấp.");

    plans.forEach((plan, i) => {
      const planNo = i + 1;
      if (!plan.supplierId) errors.push(`Kế hoạch ${planNo}: vui lòng chọn nhà cung cấp.`);
      if (!plan.orderDate) errors.push(`Kế hoạch ${planNo}: vui lòng chọn ngày đặt.`);
      if (!plan.details.length) errors.push(`Kế hoạch ${planNo}: phải có ít nhất 1 dòng sản phẩm.`);

      plan.details.forEach((line, j) => {
        const lineNo = j + 1;
        if (!line.productId) errors.push(`Kế hoạch ${planNo} - dòng ${lineNo}: vui lòng chọn sản phẩm.`);
        if (!line.orderedWeight || line.orderedWeight <= 0)
          errors.push(`Kế hoạch ${planNo} - dòng ${lineNo}: khối lượng đặt phải lớn hơn 0.`);
        if (line.unitPriceAtOrder < 0)
          errors.push(`Kế hoạch ${planNo} - dòng ${lineNo}: đơn giá tại thời điểm đặt không được âm.`);
        if (!line.priceDate) errors.push(`Kế hoạch ${planNo} - dòng ${lineNo}: vui lòng chọn ngày áp giá.`);
        if (line.priceDate && plan.orderDate && line.priceDate > plan.orderDate)
          errors.push(`Kế hoạch ${planNo} - dòng ${lineNo}: ngày áp giá không được sau ngày đặt.`);
        if (line.tolerancePercent < 0 || line.tolerancePercent > 100)
          errors.push(`Kế hoạch ${planNo} - dòng ${lineNo}: dung sai phải từ 0 đến 100%.`);
      });
    });
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    const payload: CreateMultiSupplierPurchaseOrderRequest = {
      supplierPlans: plans.map((plan) => ({
        supplierId: plan.supplierId,
        orderDate: new Date(plan.orderDate).toISOString(),
        notes: plan.notes.trim() || undefined,
        details: plan.details.map((line) => ({
          productId: line.productId,
          orderedWeight: Number(line.orderedWeight),
          unitPriceAtOrder: Number(line.unitPriceAtOrder),
          priceDate: new Date(line.priceDate).toISOString(),
          tolerancePercent: Number(line.tolerancePercent),
        })),
      })),
    };

    try {
      const res = await createMultiPo(payload).unwrap();
      toast.success(res.message || "Tạo đơn mua đa nhà cung cấp thành công.");
      navigate(`/purchase-staff/orders/${res.purchaseOrderId}`);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: string } };
      toast.error(e?.data?.message || e?.data?.error || "Tạo đơn mua đa nhà cung cấp thất bại.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/purchase-staff/orders")}
          className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tạo đơn mua đa nhà cung cấp</h1>
          <p className="text-sm text-slate-500">Mỗi kế hoạch nhà cung cấp có giá chốt tại thời điểm đặt.</p>
        </div>
      </div>

      {plans.map((plan, planIdx) => (
        <div key={`plan-${planIdx}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Kế hoạch NCC #{planIdx + 1}</h2>
            <button
              type="button"
              onClick={() => removePlan(planIdx)}
              disabled={plans.length <= 1}
              className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-40"
            >
              <Trash2 size={14} /> Xóa kế hoạch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nhà cung cấp *</label>
              <select
                value={plan.supplierId}
                onChange={(e) => updatePlan(planIdx, "supplierId", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value={0}>Chọn nhà cung cấp</option>
                {activeSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ngày đặt *</label>
              <input
                type="date"
                value={plan.orderDate}
                onChange={(e) => updatePlan(planIdx, "orderDate", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú</label>
              <input
                type="text"
                value={plan.notes}
                onChange={(e) => updatePlan(planIdx, "notes", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Ghi chú kế hoạch nhà cung cấp..."
              />
            </div>
          </div>

          <div className="space-y-3">
            {plan.details.map((line, lineIdx) => (
              <div
                key={`line-${planIdx}-${lineIdx}`}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm *</label>
                  <select
                    value={line.productId}
                    onChange={(e) => updateLine(planIdx, lineIdx, "productId", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value={0}>Chọn sản phẩm</option>
                    {activeProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">KL đặt (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={line.orderedWeight}
                    onChange={(e) => updateLine(planIdx, lineIdx, "orderedWeight", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Đơn giá tại lúc đặt *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.unitPriceAtOrder}
                    onChange={(e) => updateLine(planIdx, lineIdx, "unitPriceAtOrder", Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ngày áp giá *</label>
                  <input
                    type="date"
                    value={line.priceDate}
                    onChange={(e) => updateLine(planIdx, lineIdx, "priceDate", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Dung sai (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={line.tolerancePercent}
                      onChange={(e) => updateLine(planIdx, lineIdx, "tolerancePercent", Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeLine(planIdx, lineIdx)}
                      disabled={plan.details.length <= 1}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addLine(planIdx)}
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Plus size={16} /> Thêm dòng sản phẩm
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addPlan}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          + Thêm kế hoạch nhà cung cấp
        </button>
        <button
          type="button"
          onClick={() => navigate("/purchase-staff/orders")}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={handleSubmit}
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          Tạo đơn mua đa NCC
        </button>
      </div>
    </div>
  );
}
