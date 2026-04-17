import { useEffect, useRef, useState } from "react";
import { Plus, Save, Trash2, Tags } from "lucide-react";
import toast from "react-hot-toast";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useGetProductVariantsQuery } from "../../product/api/product-variant.api";
import {
  useLazyGetLotsByProductVariantIdQuery,
} from "../../goods-receipt/api/goods-receipt.api";
import type { LotListItem } from "../../goods-receipt/types/goods-receipt.type";
import {
  type UpsertProductVariantDiscountOverride,
  useGetProductVariantDiscountOverridesQuery,
  useUpdateProductVariantDiscountOverridesMutation,
} from "../api/variant-discount-override.api";

type OverrideFormItem = UpsertProductVariantDiscountOverride;

const emptyItem = (): OverrideFormItem => ({
  productVariantId: 0,
  lotId: null,
  overrideNearExpiryDiscountPercent: 0,
  reason: "",
  isActive: true,
  startAtUtc: null,
  endAtUtc: null,
});

/** Lot đã quá ngày HSD (theo lịch UTC) hoặc trạng thái Expired → không hiện trong dropdown ghi đè. */
function isLotExpiredForOverride(lot: LotListItem): boolean {
  const st = (lot.status || "").trim().toLowerCase();
  if (st === "expired") return true;
  if (!lot.expiryDate) return false;
  const exp = new Date(lot.expiryDate);
  if (Number.isNaN(exp.getTime())) return false;
  const now = new Date();
  const expDayUtc = Date.UTC(exp.getUTCFullYear(), exp.getUTCMonth(), exp.getUTCDate());
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return expDayUtc < todayUtc;
}

function filterLotsForOverrideSelect(lots: LotListItem[]): LotListItem[] {
  return lots.filter((l) => !isLotExpiredForOverride(l));
}

export default function VariantDiscountOverrideConfigPage() {
  const [items, setItems] = useState<OverrideFormItem[]>([]);
  const { data, isFetching } = useGetProductVariantDiscountOverridesQuery();
  const { data: productVariants = [], isFetching: isFetchingVariants } =
    useGetProductVariantsQuery();
  const [triggerLotsByVariant, { isFetching: isFetchingLots }] =
    useLazyGetLotsByProductVariantIdQuery();
  const [lotsByVariant, setLotsByVariant] = useState<Record<number, LotListItem[]>>(
    {},
  );
  const [save, { isLoading: isSaving }] =
    useUpdateProductVariantDiscountOverridesMutation();

  /** Tránh gọi trùng song song (React Strict Mode / effect) → 2 toast giống nhau. */
  const lotsLoadInFlight = useRef(new Set<number>());

  const extractErrorMessage = (err: unknown, fallback: string) => {
    const e = err as FetchBaseQueryError & { data?: unknown; error?: string };
    const dataObj = (e?.data ?? null) as
      | { message?: unknown; title?: unknown }
      | null;
    if (typeof dataObj?.message === "string" && dataObj.message.trim()) {
      return dataObj.message;
    }
    if (typeof dataObj?.title === "string" && dataObj.title.trim()) {
      return dataObj.title;
    }
    if (typeof e?.error === "string" && e.error.trim()) return e.error;
    if (e?.status === "FETCH_ERROR") return "Lỗi kết nối tới máy chủ.";
    if (typeof e?.status === "number") return `Lỗi máy chủ (${e.status}).`;
    return fallback;
  };

  useEffect(() => {
    if (!data) return;
    setItems(
      data.map((x) => ({
        productVariantId: Number(x.productVariantId || 0),
        lotId:
          x.lotId != null && Number.isFinite(Number(x.lotId))
            ? Number(x.lotId)
            : null,
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

  const ensureLotsLoaded = async (productVariantId: number) => {
    if (productVariantId <= 0) return;
    if (productVariantId in lotsByVariant) return;
    if (lotsLoadInFlight.current.has(productVariantId)) return;
    lotsLoadInFlight.current.add(productVariantId);
    try {
      const result = await triggerLotsByVariant(productVariantId).unwrap();
      setLotsByVariant((prev) => ({ ...prev, [productVariantId]: result }));
    } catch (err) {
      setLotsByVariant((prev) => ({ ...prev, [productVariantId]: [] }));
      toast.error(
        extractErrorMessage(err, "Không thể tải danh sách lot theo biến thể."),
        { id: `lots-by-variant-${productVariantId}` },
      );
    } finally {
      lotsLoadInFlight.current.delete(productVariantId);
    }
  };

  useEffect(() => {
    const variantIds = Array.from(
      new Set(
        items
          .map((x) => Number(x.productVariantId || 0))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );
    variantIds.forEach((variantId) => {
      if (!(variantId in lotsByVariant)) {
        void ensureLotsLoaded(variantId);
      }
    });
  }, [items, lotsByVariant]);

  /** Bỏ lot đã hết hạn khỏi lựa chọn đã lưu (nếu dữ liệu API cập nhật sau). */
  useEffect(() => {
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.lotId == null || item.productVariantId <= 0) return item;
        const raw = lotsByVariant[item.productVariantId];
        if (!raw) return item;
        const eligible = filterLotsForOverrideSelect(raw);
        if (!eligible.some((l) => Number(l.lotId) === Number(item.lotId))) {
          changed = true;
          return { ...item, lotId: null };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [lotsByVariant]);

  const saveAll = async () => {
    const cleaned = items.map((x) => ({
      productVariantId: Math.max(0, Math.floor(Number(x.productVariantId || 0))),
      lotId:
        x.lotId != null && Number(x.lotId) > 0
          ? Math.floor(Number(x.lotId))
          : null,
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
    if (
      cleaned.some((x) => {
        if (x.lotId == null) return false;
        const raw = lotsByVariant[x.productVariantId] || [];
        const lot = raw.find((l) => Number(l.lotId) === x.lotId);
        return !lot || isLotExpiredForOverride(lot);
      })
    ) {
      toast.error(
        "Lot đã chọn không thuộc biến thể hoặc đã hết hạn. Vui lòng chọn lot khác hoặc để trống (tất cả lot).",
      );
      return;
    }

    try {
      await save(cleaned).unwrap();
      toast.success("Đã lưu cấu hình ghi đè giảm giá theo sản phẩm.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Lưu thất bại. Vui lòng thử lại."));
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
        {isFetchingLots ? (
          <div className="mb-3 text-xs text-slate-500">Đang tải danh sách lot...</div>
        ) : null}

        <div className="space-y-3">
          {items.map((x, idx) => {
            const variantLots =
              x.productVariantId > 0
                ? filterLotsForOverrideSelect(lotsByVariant[x.productVariantId] || [])
                : [];

            return (
            <div
              key={`${idx}-${x.productVariantId}`}
              className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-7"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Biến thể sản phẩm
                </label>
                <select
                  value={x.productVariantId}
                  onChange={(e) =>
                    {
                      const nextVariantId = Number(e.target.value || 0);
                      updateItem(idx, {
                        productVariantId: nextVariantId,
                        lotId: null,
                      });
                      if (nextVariantId > 0) {
                        void ensureLotsLoaded(nextVariantId);
                      }
                    }
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
                  Lot áp dụng (tùy chọn)
                </label>
                <select
                  value={x.lotId ?? ""}
                  onChange={(e) =>
                    updateItem(idx, {
                      lotId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  disabled={x.productVariantId <= 0}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">Tất cả lot của biến thể</option>
                  {variantLots.map((lot) => (
                    <option key={lot.lotId} value={lot.lotId}>
                      {lot.lotCode} • HSD{" "}
                      {lot.expiryDate ? lot.expiryDate.slice(0, 10) : "N/A"} • Còn{" "} 
                      {Number(lot.remainingQuantity || 0)} kg
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Để trống = áp dụng cho toàn bộ lot của biến thể đã chọn. Lot đã quá HSD không hiển thị.
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
