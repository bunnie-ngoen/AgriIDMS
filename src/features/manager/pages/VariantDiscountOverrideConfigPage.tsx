import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Tags } from "lucide-react";
import toast from "react-hot-toast";
import { useGetProductVariantsQuery } from "../../product/api/product-variant.api";
import {
  type UpsertProductVariantDiscountOverride,
  useGetProductVariantDiscountOverridesQuery,
  useUpdateProductVariantDiscountOverridesMutation,
} from "../api/variant-discount-override.api";

type OverrideFormItem = UpsertProductVariantDiscountOverride;

const emptyItem = (): OverrideFormItem => ({
  productVariantId: 0,
  overrideNearExpiryDiscountPercent: 0,
  reason: "",
  isActive: true,
  startAtUtc: null,
  endAtUtc: null,
});

export default function VariantDiscountOverrideConfigPage() {
  const [items, setItems] = useState<OverrideFormItem[]>([]);
  const { data, isFetching } = useGetProductVariantDiscountOverridesQuery();
  const { data: productVariants = [], isFetching: isFetchingVariants } =
    useGetProductVariantsQuery();
  const [save, { isLoading: isSaving }] =
    useUpdateProductVariantDiscountOverridesMutation();

  useEffect(() => {
    if (!data) return;
    setItems(
      data.map((x) => ({
        productVariantId: Number(x.productVariantId || 0),
        overrideNearExpiryDiscountPercent: Number(
          x.overrideNearExpiryDiscountPercent || 0,
        ),
        reason: x.reason ?? "",
        isActive: Boolean(x.isActive),
        startAtUtc: x.startAtUtc ?? null,
        endAtUtc: x.endAtUtc ?? null,
      })),
    );
  }, [data]);

  const updateItem = (idx: number, patch: Partial<OverrideFormItem>) => {
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveAll = async () => {
    const cleaned = items.map((x) => ({
      productVariantId: Math.max(0, Math.floor(Number(x.productVariantId || 0))),
      overrideNearExpiryDiscountPercent: Math.max(
        0,
        Math.min(100, Number(x.overrideNearExpiryDiscountPercent || 0)),
      ),
      reason: (x.reason || "").trim() || null,
      isActive: Boolean(x.isActive),
      startAtUtc: x.startAtUtc || null,
      endAtUtc: x.endAtUtc || null,
    }));

    if (cleaned.some((x) => x.productVariantId <= 0)) {
      toast.error("Mã biến thể sản phẩm phải lớn hơn 0.");
      return;
    }

    try {
      await save(cleaned).unwrap();
      toast.success("Đã lưu cấu hình ghi đè giảm giá theo sản phẩm.");
    } catch {
      toast.error("Lưu thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Cấu hình ghi đè giảm giá gần hết hạn theo sản phẩm</h2>
            <p className="mt-1 text-sm text-slate-600">
              Nếu có bản ghi đang hiệu lực và được kích hoạt, hệ thống sẽ ưu tiên áp dụng mức giảm này thay cho rule gần hết hạn mặc định.
            </p>
          </div>
          <Tags className="text-sky-600" size={20} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Danh sách cấu hình ghi đè</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus size={13} />
              Thêm cấu hình
            </button>
            <button
              type="button"
              onClick={() => void saveAll()}
              disabled={isSaving}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <Save size={13} />
              Lưu
            </button>
          </div>
        </div>

        {isFetching ? (
          <div className="mb-3 text-xs text-slate-500">Đang tải danh sách cấu hình...</div>
        ) : null}
        {isFetchingVariants ? (
          <div className="mb-3 text-xs text-slate-500">Đang tải danh sách biến thể sản phẩm...</div>
        ) : null}

        <div className="space-y-3">
          {items.map((x, idx) => (
            <div
              key={`${idx}-${x.productVariantId}`}
              className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-6"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Biến thể sản phẩm
                </label>
                <select
                  value={x.productVariantId}
                  onChange={(e) =>
                    updateItem(idx, { productVariantId: Number(e.target.value || 0) })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  <option value={0}>Chọn biến thể sản phẩm</option>
                  {productVariants
                    .filter((pv) => pv.isActive)
                    .map((pv) => (
                      <option key={pv.id} value={pv.id}>
                        #{pv.id} - {pv.productName}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Chọn biến thể cần ghi đè mức giảm giá gần hết hạn.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Mức giảm ghi đè (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={x.overrideNearExpiryDiscountPercent}
                  onChange={(e) =>
                    updateItem(idx, {
                      overrideNearExpiryDiscountPercent: Number(
                        e.target.value || 0,
                      ),
                    })
                  }
                  placeholder="0 - 100"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Ghi chú / lý do
                </label>
                <input
                  value={x.reason ?? ""}
                  onChange={(e) => updateItem(idx, { reason: e.target.value })}
                  placeholder="Ví dụ: Hàng cần đẩy nhanh trong tuần này"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Bắt đầu hiệu lực
                </label>
                <input
                  type="datetime-local"
                  value={x.startAtUtc ? x.startAtUtc.slice(0, 16) : ""}
                  onChange={(e) =>
                    updateItem(idx, {
                      startAtUtc: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Kết thúc hiệu lực
                </label>
                <input
                  type="datetime-local"
                  value={x.endAtUtc ? x.endAtUtc.slice(0, 16) : ""}
                  onChange={(e) =>
                    updateItem(idx, {
                      endAtUtc: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={x.isActive}
                    onChange={(e) => updateItem(idx, { isActive: e.target.checked })}
                  />
                  Kích hoạt
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  <Trash2 size={12} />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
