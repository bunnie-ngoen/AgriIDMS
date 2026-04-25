import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useGetProductsQuery } from "../../product/api/product.api";
import { useCreatePurchaseRequestMutation } from "../../purchase-request/api/purchase-request.api";

type FormValues = {
  notes: string;
  details: {
    productId: number;
    requestedWeight: number;
    targetUnitPrice: number;
  }[];
};

const defaultDetail: FormValues["details"][0] = {
  productId: 0,
  requestedWeight: 0,
  targetUnitPrice: 0,
};

export default function CreatePurchaseRequest() {
  const navigate = useNavigate();
  const { data: products = [] } = useGetProductsQuery();
  const [createRequest, { isLoading }] = useCreatePurchaseRequestMutation();

  const form = useForm<FormValues>({
    defaultValues: {
      notes: "",
      details: [{ ...defaultDetail }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "details",
  });

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);

  const onSubmit = async (values: FormValues) => {
    const errors: string[] = [];
    values.details.forEach((d, i) => {
      if (!d.productId) errors.push(`Dòng ${i + 1}: chọn sản phẩm`);
      if (!d.requestedWeight || Number(d.requestedWeight) <= 0) {
        errors.push(`Dòng ${i + 1}: khối lượng > 0`);
      }
    });
    if (errors.length) {
      toast.error(errors.join(". "));
      return;
    }
    try {
      await createRequest({
        notes: values.notes?.trim() || undefined,
        details: values.details.map((d) => ({
          productId: Number(d.productId),
          requestedWeight: Number(d.requestedWeight),
          targetUnitPrice: Number(d.targetUnitPrice ?? 0),
        })),
      }).unwrap();
      toast.success("Tạo phiếu đề xuất mua thành công.");
      navigate("/purchase-staff/purchase-requests");
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Tạo phiếu đề xuất mua thất bại.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate("/purchase-staff/purchase-requests")}
          className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tạo phiếu đề xuất mua</h1>
          <p className="text-sm text-slate-500">Gom nhu cầu mua sản phẩm gốc trước khi tách PO theo supplier.</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Ghi chú</label>
          <textarea
            rows={3}
            {...form.register("notes")}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Mô tả nhu cầu mua, mùa vụ..."
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Chi tiết nhu cầu</h2>
            <button
              type="button"
              onClick={() => append({ ...defaultDetail })}
              className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Plus size={16} /> Thêm dòng
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm *</label>
                    <select
                      {...form.register(`details.${index}.productId`, { valueAsNumber: true })}
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
                    <label className="block text-xs font-medium text-slate-500 mb-1">Khối lượng yêu cầu (kg) *</label>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      {...form.register(`details.${index}.requestedWeight`, { valueAsNumber: true })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Đơn giá mục tiêu (VNĐ)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        {...form.register(`details.${index}.targetUnitPrice`, { valueAsNumber: true })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/purchase-staff/purchase-requests")}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-[2] rounded-xl py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang tạo...
              </>
            ) : (
              "Tạo phiếu đề xuất mua"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
