import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useGetPurchaseOrderByIdQuery } from "../../purchase-order/api/purchase-order.api";
import { useUpdatePurchaseOrderMutation } from "../../purchase-order/api/purchase-order.api";
import { useGetSuppliersQuery } from "../../supplier/api/supplier.api";
import { useGetProductVariantsQuery } from "../../product/api/product-variant.api";
import type { UpdatePurchaseOrderDetailRequest } from "../../purchase-order/types/purchase-order.type";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type FormValues = {
  supplierId: number;
  details: (UpdatePurchaseOrderDetailRequest & { harvestDate: string })[];
};

export default function EditPurchaseOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin/purchase-orders");
  const detailLink = (n: number) =>
    isAdmin ? `/admin/purchase-orders/${n}` : `/purchase-staff/orders/${n}`;
  const backLink = isAdmin ? "/admin/purchase-orders" : "/purchase-staff/orders";

  const poId = id ? parseInt(id, 10) : 0;
  const { data: order, isLoading: loadingOrder } = useGetPurchaseOrderByIdQuery(poId, {
    skip: !poId || Number.isNaN(poId),
  });
  const [updatePo, { isLoading: isSaving }] = useUpdatePurchaseOrderMutation();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: variants = [] } = useGetProductVariantsQuery();

  const form = useForm<FormValues>({
    defaultValues: {
      supplierId: 0,
      details: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "details",
  });

  useEffect(() => {
    if (!order) return;
    form.reset({
      supplierId: order.supplierId,
      details:
        order.details?.map((d) => ({
          id: d.id,
          productVariantId: d.productVariantId,
          orderedWeight: d.orderedWeight,
          unitPrice: d.unitPrice,
          tolerancePercent: d.tolerancePercent,
          harvestDate: d.harvestDate
            ? new Date(d.harvestDate).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
        })) ?? [],
    });
  }, [order, form]);

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    if (!poId || !order) return;
    setServerError(null);

    // Validate FE
    const localErrors: string[] = [];
    if (!values.supplierId || values.supplierId === 0) {
      localErrors.push("Vui lòng chọn nhà cung cấp.");
    }
    if (!values.details || values.details.length === 0) {
      localErrors.push("Đơn mua phải có ít nhất 1 dòng chi tiết.");
    }

    values.details.forEach((d, idx) => {
      const row = idx + 1;
      if (!d.productVariantId || d.productVariantId === 0) {
        localErrors.push(`Dòng ${row}: vui lòng chọn sản phẩm (variant).`);
      }
      if (!d.harvestDate) {
        localErrors.push(`Dòng ${row}: vui lòng chọn ngày thu hoạch.`);
      }
      if (!d.orderedWeight || Number(d.orderedWeight) <= 0) {
        localErrors.push(`Dòng ${row}: khối lượng đặt phải lớn hơn 0.`);
      }
      const matchedVariant = variants.find((v) => v.id === d.productVariantId);
      const minLine =
        typeof matchedVariant?.minReceiptWeight === "number"
          ? matchedVariant.minReceiptWeight
          : null;
      if (minLine != null && Number(d.orderedWeight) < minLine) {
        localErrors.push(
          `Khối lượng đặt (kg) phải >= định mức tối thiểu (${minLine} kg) của sản phẩm.`,
        );
      }
      if (d.unitPrice != null && Number(d.unitPrice) < 0) {
        localErrors.push(`Dòng ${row}: đơn giá không được âm.`);
      }
      if (
        d.tolerancePercent != null &&
        (Number(d.tolerancePercent) < 0 || Number(d.tolerancePercent) > 100)
      ) {
        localErrors.push(`Dòng ${row}: dung sai phải từ 0 đến 100%.`);
      }
    });

    if (localErrors.length > 0) {
      const message = localErrors.join(" ");
      setServerError(message);
      toast.error("Vui lòng kiểm tra lại các trường bị lỗi trong đơn mua.");
      return;
    }

    try {
      const res = await updatePo({
        id: poId,
        body: {
          supplierId: values.supplierId,
          details: values.details.map((d) => ({
            id: d.id ?? undefined,
            productVariantId: d.productVariantId,
            orderedWeight: Number(d.orderedWeight),
            unitPrice: Number(d.unitPrice),
            tolerancePercent: Number(d.tolerancePercent),
            harvestDate: new Date(d.harvestDate).toISOString(),
          })),
        },
      }).unwrap();

      const successMessage =
        (res as { message?: string })?.message ?? "Cập nhật đơn mua thành công.";
      toast.success(successMessage);

      // Sau khi cập nhật thành công, quay về danh sách đơn mua
      setTimeout(() => {
        navigate(backLink);
      }, 600);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        (err as { data?: { error?: string } })?.data?.error ||
        "Cập nhật đơn mua thất bại.";
      setServerError(msg);
      toast.error(msg);
    }
  };

  if (Number.isNaN(poId) || poId < 1) {
    navigate(backLink);
    return null;
  }

  if (loadingOrder || !order) {
    return (
      <div className="max-w-3xl mx-auto flex justify-center py-12">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (order.status !== "Pending") {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-amber-600">Chỉ được sửa đơn ở trạng thái Pending.</p>
        <button
          type="button"
          onClick={() => navigate(detailLink(poId))}
          className="mt-2 text-emerald-600 hover:underline"
        >
          Quay lại chi tiết đơn
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate(detailLink(poId))}
          className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sửa đơn mua · {order.orderCode}</h1>
          <p className="text-sm text-slate-500">Cập nhật nhà cung cấp và chi tiết đơn</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nhà cung cấp *</label>
          <select
            {...form.register("supplierId", { valueAsNumber: true, required: true })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
          >
            <option value={0}>Chọn nhà cung cấp</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Chi tiết đơn hàng</h2>
            <button
              type="button"
              onClick={() =>
                append({
                  productVariantId: 0,
                  orderedWeight: 0,
                  unitPrice: 0,
                  tolerancePercent: 2,
                  harvestDate: new Date().toISOString().slice(0, 10),
                })
              }
              className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Plus size={16} /> Thêm dòng
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Sản phẩm (variant) *
                    </label>
                    <select
                      {...form.register(`details.${index}.productVariantId`, {
                        valueAsNumber: true,
                        required: true,
                      })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value={0}>Chọn variant</option>
                      {variants
                        .filter((v) => v.isActive)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.productName} (Grade {v.grade})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Ngày thu hoạch *
                    </label>
                    <input
                      type="date"
                      {...form.register(`details.${index}.harvestDate`, { required: true })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">KL đặt (kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0.01}
                      {...form.register(`details.${index}.orderedWeight`, {
                        valueAsNumber: true,
                        required: true,
                        min: 0.01,
                      })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Đơn giá</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      {...form.register(`details.${index}.unitPrice`, { valueAsNumber: true })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Dung sai (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      {...form.register(`details.${index}.tolerancePercent`, { valueAsNumber: true })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
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
            ))}
          </div>
        </div>

        {serverError && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {serverError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(detailLink(poId))}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-[2] rounded-xl py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
