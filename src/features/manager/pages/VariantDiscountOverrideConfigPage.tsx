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
  priority: 0,
  overrideNearExpiryDiscountPercent: 0,
  reason: "",
  isActive: true,
  startAtUtc: null,
  endAtUtc: null,
});

/** Gán số ưu tiên dương chưa dùng trong danh sách hiện tại (số nhỏ = ưu tiên cao hơn). */
function nextFreePriority(rows: OverrideFormItem[]): number {
  const used = new Set(
    rows
      .map((x) => Math.floor(Number(x.priority) || 0))
      .filter((n) => n > 0),
  );
  let n = 1;
  while (used.has(n)) n += 1;
  return n;
}

/** Chuẩn hóa khi tải từ API: mỗi dòng có priority > 0 và không trùng trong form. */
function ensureUniquePositivePriorities(rows: OverrideFormItem[]): OverrideFormItem[] {
  const used = new Set<number>();
  return rows.map((row) => {
    let p = Math.floor(Number(row.priority) || 0);
    if (p <= 0) p = 1;
    while (used.has(p)) p += 1;
    used.add(p);
    return { ...row, priority: p };
  });
}

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

/** yyyy-MM-dd cho <input type="date" /> */
function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Ngày lịch (local) từ chuỗi API (ISO hoặc tương đương). */
function parseCalendarDateFromApiDate(iso: string | null | undefined): Date | null {
  if (!iso || !String(iso).trim()) return null;
  const text = String(iso).trim();
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const y = Number(m[1]);
    const mon = Number(m[2]);
    const d = Number(m[3]);
    const parsed = new Date(y, mon - 1, d);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const fallback = new Date(text);
  if (Number.isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

function formatDdMmYyyyFromYmd(ymd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("vi-VN");
}

/** ISO UTC: đầu ngày theo lịch local (không nhập giờ). */
function localYmdToUtcStartIso(ymd: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  // Lưu theo mốc UTC cố định để tránh lệch ngày khi client/server khác múi giờ.
  return `${ymd}T00:00:00.000Z`;
}

/** ISO UTC: cuối ngày local — để EndAtUtc >= cả ngày kết thúc đã chọn khi BE so sánh DateTime. */
function localYmdToUtcEndOfDayIso(ymd: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  // Dùng 23:59:59.999 UTC của đúng ngày đã chọn để không trôi sang ngày khác khi hiển thị lại.
  return `${ymd}T23:59:59.999Z`;
}

/** Lấy yyyy-MM-dd từ ISO đã lưu (hiển thị lại trên date input). */
function isoToLocalYmd(iso: string | null | undefined): string {
  if (!iso) return "";
  const text = String(iso).trim();
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return "";
  return toYmd(d);
}

function ymdCompare(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Ngày nhập hàng tham chiếu (calendar local) để validate "bắt đầu hiệu lực" > ngày nhập.
 * - Lot cụ thể: receivedDate của lot (API by-product-variant).
 * - Tất cả lot: ngày nhập sớm nhất trong các lot đã lọc của biến thể.
 * Trả về null nếu chưa có dữ liệu — khi đó chỉ dựa vào BE (nếu có lot) hoặc không kiểm tra receipt ở FE.
 */
function getReferenceReceiptCalendarDate(
  item: OverrideFormItem,
  variantLotsFiltered: LotListItem[],
): Date | null {
  if (item.lotId != null && Number(item.lotId) > 0) {
    const lot = variantLotsFiltered.find((l) => Number(l.lotId) === Number(item.lotId));
    return parseCalendarDateFromApiDate(lot?.receivedDate);
  }
  const dates = variantLotsFiltered
    .map((l) => parseCalendarDateFromApiDate(l.receivedDate))
    .filter((d): d is Date => d != null);
  if (dates.length === 0) return null;
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

/** Ngày bắt đầu hiệu lực (calendar) phải > ngày nhập hàng (calendar). */
function isEffectiveStartYmdAfterReceiptYmd(
  startYmd: string,
  receiptCal: Date | null,
): boolean {
  if (!receiptCal || !/^\d{4}-\d{2}-\d{2}$/.test(startYmd)) return true;
  const [y, m, d] = startYmd.split("-").map(Number);
  const startCal = new Date(y, m - 1, d);
  const rec = new Date(
    receiptCal.getFullYear(),
    receiptCal.getMonth(),
    receiptCal.getDate(),
  );
  return startCal.getTime() > rec.getTime();
}

/** min trên input date = ngày sau ngày nhập (user không được chọn đúng ngày nhập hoặc trước). */
function minStartYmdAfterReceipt(receiptCal: Date | null): string | undefined {
  if (!receiptCal) return undefined;
  const next = new Date(
    receiptCal.getFullYear(),
    receiptCal.getMonth(),
    receiptCal.getDate() + 1,
  );
  return toYmd(next);
}

/**
 * Dòng subtitle ngắn dưới title card: nhãn lot (mã hoặc #id) · % giảm · ưu tiên · trạng thái.
 */
function buildVariantDiscountConfigSummaryLine(
  config: OverrideFormItem,
  opts?: { lotCode?: string | null },
): string {
  const hasLot = config.lotId != null && Number(config.lotId) > 0;
  const lotLabel = hasLot
    ? opts?.lotCode?.trim()
      ? opts.lotCode.trim()
      : `Lot #${config.lotId}`
    : "Toàn lot biến thể";
  const pct = Number(config.overrideNearExpiryDiscountPercent ?? 0);
  const prio = Math.floor(Number(config.priority) || 0);
  const active = config.isActive ? "Kích hoạt" : "Tắt";
  return `${lotLabel} · ${pct}% · Ưu tiên ${prio} · ${active}`;
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
    const mapped = data.map((x) => ({
      productVariantId: Number(x.productVariantId || 0),
      lotId:
        x.lotId != null && Number.isFinite(Number(x.lotId))
          ? Number(x.lotId)
          : null,
      priority: Math.floor(Number(x.priority) || 0),
      overrideNearExpiryDiscountPercent: Number(
        x.overrideNearExpiryDiscountPercent || 0,
      ),
      reason: x.reason ?? "",
      isActive: Boolean(x.isActive),
      startAtUtc: x.startAtUtc ?? null,
      endAtUtc: x.endAtUtc ?? null,
    }));
    setItems(ensureUniquePositivePriorities(mapped));
  }, [data]);

  const updateItem = (idx: number, patch: Partial<OverrideFormItem>) => {
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { ...emptyItem(), priority: nextFreePriority(prev) },
    ]);
  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    toast("Đã xóa trên form, nhớ bấm Lưu để áp dụng vào hệ thống.", {
      icon: "⚠️",
      duration: 3000,
    });
  };

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
    const cleaned = items.map((x) => {
      const startYmd = isoToLocalYmd(x.startAtUtc ?? null);
      const endYmd = isoToLocalYmd(x.endAtUtc ?? null);
      return {
        productVariantId: Math.max(0, Math.floor(Number(x.productVariantId || 0))),
        lotId:
          x.lotId != null && Number(x.lotId) > 0
            ? Math.floor(Number(x.lotId))
            : null,
        priority: Math.max(0, Math.floor(Number(x.priority) || 0)),
        overrideNearExpiryDiscountPercent: Math.max(
          0,
          Math.min(100, Number(x.overrideNearExpiryDiscountPercent || 0)),
        ),
        reason: (x.reason || "").trim() || null,
        isActive: Boolean(x.isActive),
        startYmd,
        endYmd,
        startAtUtc: startYmd ? localYmdToUtcStartIso(startYmd) : null,
        endAtUtc: endYmd ? localYmdToUtcEndOfDayIso(endYmd) : null,
      };
    });

    if (cleaned.some((x) => x.productVariantId <= 0)) {
      toast.error("Mã biến thể sản phẩm phải lớn hơn 0.");
      return;
    }
    if (cleaned.some((x) => x.priority <= 0)) {
      toast.error("Độ ưu tiên phải là số nguyên dương trên mỗi dòng.");
      return;
    }
    const prioCounts = new Map<number, number>();
    for (const x of cleaned) {
      prioCounts.set(x.priority, (prioCounts.get(x.priority) ?? 0) + 1);
    }
    if ([...prioCounts.values()].some((c) => c > 1)) {
      toast.error("Độ ưu tiên không được trùng nhau giữa các dòng.");
      return;
    }
    for (const x of cleaned) {
      const raw = lotsByVariant[x.productVariantId] || [];
      const variantLots = filterLotsForOverrideSelect(raw);
      if (!x.startYmd || !x.endYmd) {
        toast.error("Ngày bắt đầu và ngày kết thúc hiệu lực là bắt buộc.");
        return;
      }
      if (!x.startAtUtc || !x.endAtUtc) {
        toast.error("Ngày hiệu lực không hợp lệ.");
        return;
      }
      if (ymdCompare(x.endYmd, x.startYmd) < 0) {
        toast.error("Ngày kết thúc hiệu lực phải từ ngày bắt đầu trở đi.");
        return;
      }
      const t0 = new Date(x.startAtUtc).getTime();
      const t1 = new Date(x.endAtUtc).getTime();
      if (!Number.isFinite(t0) || !Number.isFinite(t1) || t0 >= t1) {
        toast.error("Khoảng hiệu lực không hợp lệ.");
        return;
      }
      const refReceipt = getReferenceReceiptCalendarDate(
        {
          productVariantId: x.productVariantId,
          lotId: x.lotId,
          priority: x.priority,
          overrideNearExpiryDiscountPercent: x.overrideNearExpiryDiscountPercent,
          reason: x.reason,
          isActive: x.isActive,
          startAtUtc: x.startAtUtc,
          endAtUtc: x.endAtUtc,
        },
        variantLots,
      );
      if (
        refReceipt &&
        !isEffectiveStartYmdAfterReceiptYmd(x.startYmd, refReceipt)
      ) {
        toast.error("Ngày bắt đầu hiệu lực phải sau ngày nhập hàng.");
        return;
      }
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
      await save(
        cleaned.map(({ startYmd: _s, endYmd: _e, ...rest }) => rest),
      ).unwrap();
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

        <div className="space-y-2.5">
          {!isFetching && items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              Chưa có cấu hình ghi đè giảm giá biến thể.
            </div>
          ) : null}
          {items.map((x, idx) => {
            const variantLots =
              x.productVariantId > 0
                ? filterLotsForOverrideSelect(lotsByVariant[x.productVariantId] || [])
                : [];
            const pv = productVariants.find((p) => p.id === x.productVariantId);
            const variantLabel =
              pv != null
                ? `#${pv.id} — ${pv.productName}`
                : x.productVariantId > 0
                  ? `#${x.productVariantId}`
                  : "Chưa chọn biến thể";
            const selectedLotCode =
              x.lotId != null && Number(x.lotId) > 0
                ? variantLots.find((l) => Number(l.lotId) === Number(x.lotId))
                    ?.lotCode ?? null
                : null;
            const summaryLine = buildVariantDiscountConfigSummaryLine(x, {
              lotCode: selectedLotCode,
            });

            return (
            <div
              key={`${idx}-${x.productVariantId}`}
              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              <div className="border-b border-slate-200/90 bg-white/90 px-3 py-2">
                <p className="truncate text-sm font-semibold leading-snug text-slate-900">
                  {variantLabel}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-normal leading-snug text-slate-500">
                  {summaryLine}
                </p>
              </div>

              <div className="p-2.5 sm:p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <div className="space-y-1 md:col-span-2">
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
                
              </div>
              <div className="space-y-1 md:col-span-2">
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
                
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Độ ưu tiên
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={x.priority > 0 ? x.priority : ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateItem(idx, {
                      priority: raw === "" ? 0 : Math.floor(Number(raw) || 0),
                    });
                  }}
                  placeholder="1, 2, 3…"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                
              </div>
              <div className="space-y-1 md:col-span-1">
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
              <div className="space-y-1 md:col-span-2">
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
              {(() => {
                const refReceiptCal = getReferenceReceiptCalendarDate(
                  x,
                  variantLots,
                );
                const minStart = minStartYmdAfterReceipt(refReceiptCal);
                const startYmd = isoToLocalYmd(x.startAtUtc);
                const endYmd = isoToLocalYmd(x.endAtUtc);
                const minEnd = startYmd || undefined;
                const lotsFetchDone =
                  x.productVariantId <= 0 ||
                  x.productVariantId in lotsByVariant;
                const pendingLots =
                  x.productVariantId > 0 && !lotsFetchDone;
                return (
              <>
              <div className="space-y-1 md:col-span-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Ngày bắt đầu hiệu lực
                </label>
                <input
                  type="date"
                  required
                  min={minStart}
                  value={startYmd}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateItem(idx, {
                      startAtUtc: v ? localYmdToUtcStartIso(v) : null,
                    });
                  }}
                  className="w-full max-w-[11rem] rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-sky-500"
                />
                {startYmd ? (
                  <p className="text-[10px] text-slate-500">
                    {formatDdMmYyyyFromYmd(startYmd)}
                  </p>
                ) : null}
                {pendingLots ? (
                  <p className="text-[10px] text-slate-500">
                    Đang tải lot để lấy ngày nhập hàng cho giới hạn chọn.
                  </p>
                ) : lotsFetchDone &&
                  x.productVariantId > 0 &&
                  variantLots.length === 0 ? (
                  <p className="text-[10px] text-amber-700">
                    Biến thể này chưa có lot.
                  </p>
                ) : lotsFetchDone &&
                  x.productVariantId > 0 &&
                  variantLots.length > 0 &&
                  !refReceiptCal ? (
                  <p className="text-[10px] text-amber-700">
                    Lot không có receivedDate — không thể áp min ngày bắt đầu ở
                    FE (cần API trả receivedDate).
                  </p>
                ) : null}
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Ngày kết thúc hiệu lực
                </label>
                <input
                  type="date"
                  required
                  min={minEnd}
                  value={endYmd}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateItem(idx, {
                      endAtUtc: v ? localYmdToUtcEndOfDayIso(v) : null,
                    });
                  }}
                  className="w-full max-w-[11rem] rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-sky-500"
                />
                {endYmd ? (
                  <p className="text-[10px] text-slate-500">
                    {formatDdMmYyyyFromYmd(endYmd)}
                  </p>
                ) : null}
              </div>
              </>
                );
              })()}
              <div className="flex items-center gap-2 md:col-span-2">
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
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
