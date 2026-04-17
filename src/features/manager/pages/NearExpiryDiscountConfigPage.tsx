import { useEffect, useMemo, useState } from "react";
import { Tags, Plus, Trash2, Save, RefreshCw, Package, Warehouse, Boxes } from "lucide-react";
import toast from "react-hot-toast";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useGetNearExpiryDashboardQuery } from "../../goods-receipt/api/goods-receipt.api";
import {
  useGetNearExpiryDiscountRulesQuery,
  useUpdateNearExpiryDiscountRulesMutation,
} from "../api/near-expiry-discount.api";
import { formatNearExpiryProductLines } from "../utils/nearExpiryProductDisplay";

type DiscountRule = {
  name: string;
  minDays: number | null;
  maxDays: number;
  discountPercent: number;
  priority: number;
  isActive: boolean;
  startAtUtc: string | null;
  endAtUtc: string | null;
};

/** Khung hiệu lực mặc định: 00:00 hôm nay → cùng giờ sau 1 năm (UTC ISO cho API). */
function defaultEffectiveWindowIso(): { startAtUtc: string; endAtUtc: string } {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return { startAtUtc: start.toISOString(), endAtUtc: end.toISOString() };
}

const defaultRules: DiscountRule[] = (() => {
  const w = defaultEffectiveWindowIso();
  return [
    {
      name: "0-2 ngày",
      minDays: 0,
      maxDays: 2,
      discountPercent: 30,
      priority: 1,
      isActive: true,
      startAtUtc: w.startAtUtc,
      endAtUtc: w.endAtUtc,
    },
    {
      name: "3-5 ngày",
      minDays: 3,
      maxDays: 5,
      discountPercent: 20,
      priority: 2,
      isActive: true,
      startAtUtc: w.startAtUtc,
      endAtUtc: w.endAtUtc,
    },
    {
      name: "6-10 ngày",
      minDays: 6,
      maxDays: 10,
      discountPercent: 10,
      priority: 3,
      isActive: true,
      startAtUtc: w.startAtUtc,
      endAtUtc: w.endAtUtc,
    },
  ];
})();

type PreviewTableFilter = "near" | "beyondThreshold";

export default function NearExpiryDiscountConfigPage() {
  const [rules, setRules] = useState<DiscountRule[]>(() => defaultRules);
  const [daysThreshold, setDaysThreshold] = useState(7);
  const [previewTableFilter, setPreviewTableFilter] = useState<PreviewTableFilter>("near");

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.priority - b.priority || a.maxDays - b.maxDays),
    [rules],
  );

  const { data: rulesData, isFetching: isFetchingRules } =
    useGetNearExpiryDiscountRulesQuery();
  const [updateRules, { isLoading: isSavingRules }] =
    useUpdateNearExpiryDiscountRulesMutation();

  /** Lấy cửa sổ đủ rộng để có cả lô còn nhiều ngày hơn ngưỡng “Hết hạn trong…”. */
  const fetchWindowDays = Math.max(365, daysThreshold);

  const { data, isFetching, refetch } = useGetNearExpiryDashboardQuery({
    days: fetchWindowDays,
  });

  const lotsNonExpired = useMemo(
    () => (data?.lots ?? []).filter((l) => l.status !== "Expired"),
    [data?.lots],
  );

  const lotsGanHetHanTheoNguong = useMemo(
    () =>
      lotsNonExpired.filter(
        (l) => l.daysLeft >= 0 && l.daysLeft <= daysThreshold,
      ),
    [lotsNonExpired, daysThreshold],
  );

  const lotsVuotNguong = useMemo(
    () => lotsNonExpired.filter((l) => l.daysLeft > daysThreshold),
    [lotsNonExpired, daysThreshold],
  );

  const previewStats = useMemo(() => {
    const box = (l: (typeof lotsNonExpired)[number]) => l.nearExpiryBoxCount ?? 0;
    const soLoGanHetHan = lotsGanHetHanTheoNguong.length;
    const soThungGanHetHan = lotsGanHetHanTheoNguong.reduce((s, l) => s + box(l), 0);
    const soLoChuaQuaHanTheoNguong = lotsVuotNguong.length;
    return { soLoGanHetHan, soThungGanHetHan, soLoChuaQuaHanTheoNguong };
  }, [lotsGanHetHanTheoNguong, lotsVuotNguong]);

  const displayLots = useMemo(() => {
    if (previewTableFilter === "near") return lotsGanHetHanTheoNguong;
    return lotsVuotNguong;
  }, [lotsGanHetHanTheoNguong, lotsVuotNguong, previewTableFilter]);

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    const e = err as FetchBaseQueryError & { data?: unknown; error?: string };
    const dataObj = (e?.data ?? null) as
      | { message?: unknown; title?: unknown; errors?: unknown }
      | null;
    if (typeof dataObj?.message === "string" && dataObj.message.trim()) {
      return dataObj.message;
    }
    if (typeof dataObj?.title === "string" && dataObj.title.trim()) {
      return dataObj.title;
    }
    if (dataObj?.errors && typeof dataObj.errors === "object") {
      const values = Object.values(dataObj.errors as Record<string, unknown>).flatMap(
        (v) => (Array.isArray(v) ? v : [v]),
      );
      const first = values.find((v) => typeof v === "string" && v.trim());
      if (typeof first === "string") return first;
    }
    if (typeof e?.error === "string" && e.error.trim()) return e.error;
    return fallback;
  };

  const isRuleEffectiveAt = (rule: DiscountRule, now: Date): boolean => {
    if (!rule.isActive) return false;
    if (!rule.startAtUtc || !rule.endAtUtc) return false;
    if (now < new Date(rule.startAtUtc)) return false;
    if (now > new Date(rule.endAtUtc)) return false;
    return true;
  };

  const getDiscountPercent = (daysLeft: number): number => {
    const now = new Date();
    const matched = sortedRules.find((r) => r.isActive && daysLeft <= r.maxDays);
    const effective = sortedRules.find((r) => {
      if (!isRuleEffectiveAt(r, now)) return false;
      if (r.minDays != null && daysLeft < r.minDays) return false;
      return daysLeft <= r.maxDays;
    });
    if (effective) return effective.discountPercent;
    return matched?.discountPercent ?? 0;
  };

  const addRule = () => {
    const w = defaultEffectiveWindowIso();
    setRules((prev) => [
      ...prev,
      {
        name: "Rule mới",
        minDays: 0,
        maxDays: 1,
        discountPercent: 5,
        priority: prev.length + 1,
        isActive: true,
        startAtUtc: w.startAtUtc,
        endAtUtc: w.endAtUtc,
      },
    ]);
  };

  const removeRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRule = (
    idx: number,
    field: "maxDays" | "discountPercent" | "priority",
    value: number,
  ) => {
    setRules((prev) =>
      prev.map((r, i) =>
        i === idx
          ? {
              ...r,
              [field]:
                field === "priority"
                  ? Math.max(1, Number.isFinite(value) ? value : 1)
                  : field === "discountPercent"
                    ? Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
                    : Math.max(0, Number.isFinite(value) ? value : 0),
            }
          : r,
      ),
    );
  };

  const saveRules = async () => {
    const cleaned = sortedRules.map((r) => ({
      name: (r.name || "").trim(),
      minDays:
        r.minDays == null ? null : Math.max(0, Math.floor(Number(r.minDays))),
      maxDays: Math.max(0, Math.floor(r.maxDays)),
      discountPercent: Math.max(0, Math.min(100, Number(r.discountPercent))),
      priority: Math.max(1, Math.floor(Number(r.priority || 1))),
      isActive: Boolean(r.isActive),
      startAtUtc: r.startAtUtc,
      endAtUtc: r.endAtUtc,
    }));

    const missingTimeRule = cleaned.find((r) => !r.startAtUtc?.trim() || !r.endAtUtc?.trim());
    if (missingTimeRule) {
      toast.error(
        `Bắt buộc nhập đủ thời gian bắt đầu và kết thúc (kèm giờ) ở "${missingTimeRule.name || "(không tên)"}".`,
      );
      return;
    }

    const invalidTimeRule = cleaned.find((r) => {
      const start = new Date(r.startAtUtc as string).getTime();
      const end = new Date(r.endAtUtc as string).getTime();
      return Number.isNaN(start) || Number.isNaN(end) || start > end;
    });
    if (invalidTimeRule) {
      toast.error(
        `Thời gian hiệu lực không hợp lệ (bắt đầu phải trước hoặc bằng kết thúc) ở "${invalidTimeRule.name || "(không tên)"}".`,
      );
      return;
    }

    const invalidMinMaxRule = cleaned.find(
      (r) => r.minDays != null && Number(r.minDays) > Number(r.maxDays),
    );
    if (invalidMinMaxRule) {
      toast.error(
        `Số ngày tối thiểu phải nhỏ hơn hoặc bằng số ngày tối đa ở "${invalidMinMaxRule.name || "(không tên)"}".`,
      );
      return;
    }

    setRules(cleaned);
    try {
      await updateRules(
        cleaned.map((r) => ({
          name: r.name,
          minDaysLeft: r.minDays,
          maxDaysLeft: r.maxDays,
          discountPercent: r.discountPercent,
          priority: r.priority,
          isActive: r.isActive,
          startAtUtc: r.startAtUtc,
          endAtUtc: r.endAtUtc,
        })),
      ).unwrap();
      toast.success("Đã lưu cấu hình giảm giá gần hết hạn.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Lưu cấu hình thất bại. Vui lòng thử lại."));
    }
  };

  useEffect(() => {
    if (!rulesData) return;
    if (!Array.isArray(rulesData) || rulesData.length === 0) {
      setRules(defaultRules);
      return;
    }

    setRules(
      rulesData
        .map((r) => ({
          name: r.name ?? "",
          minDays:
            r.minDaysLeft == null
              ? null
              : Math.max(0, Math.floor(Number(r.minDaysLeft))),
          maxDays: Math.max(0, Math.floor(Number(r.maxDaysLeft ?? 0))),
          discountPercent: Math.max(
            0,
            Math.min(100, Number(r.discountPercent ?? 0)),
          ),
          priority: Math.max(1, Math.floor(Number(r.priority ?? 1))),
          isActive: Boolean(r.isActive),
          startAtUtc: r.startAtUtc ?? null,
          endAtUtc: r.endAtUtc ?? null,
        }))
        .sort((a, b) => a.priority - b.priority || a.maxDays - b.maxDays),
    );
  }, [rulesData]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Cấu hình giảm giá sản phẩm gần hết hạn
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Thiết lập % giảm giá theo số ngày còn lại của lô hàng để ưu tiên xử lý.
            </p>
          </div>
          <Tags className="text-amber-600" size={20} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Cấu hình giảm giá theo số ngày còn lại
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addRule}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus size={13} />
              Thêm mức
            </button>
            <button
              type="button"
              onClick={() => void saveRules()}
              disabled={isSavingRules}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <Save size={13} />
              {isSavingRules ? "Đang lưu…" : "Lưu cấu hình"}
            </button>
          </div>
        </div>

        {isFetchingRules ? (
          <div className="mb-3 text-xs text-slate-500">Đang tải cấu hình...</div>
        ) : null}

        <div className="space-y-2">
          {sortedRules.map((r, idx) => (
            <div
              key={`${r.maxDays}-${idx}`}
              className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-7"
            >
              <div>
                <label className="text-[11px] text-slate-500">Tên mức giảm giá</label>
                <input
                  value={r.name}
                  onChange={(e) =>
                    setRules((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Số ngày còn lại từ</label>
                <input
                  type="number"
                  min={0}
                  value={r.minDays ?? 0}
                  onChange={(e) =>
                    setRules((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? { ...x, minDays: Math.max(0, Number(e.target.value || 0)) }
                          : x,
                      ),
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">
                  Áp dụng đến khi số ngày còn lại {"<="}
                </label>
                <input
                  type="number"
                  min={0}
                  value={r.maxDays}
                  onChange={(e) => updateRule(idx, "maxDays", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Độ ưu tiên</label>
                <input
                  type="number"
                  min={1}
                  value={r.priority}
                  onChange={(e) => updateRule(idx, "priority", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Giảm giá (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={r.discountPercent}
                  onChange={(e) =>
                    updateRule(idx, "discountPercent", Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <div className="mt-1 grid grid-cols-1 gap-1">
                  <span className="text-[10px] text-slate-500">Thời gian bắt đầu</span>
                  <input
                    type="datetime-local"
                    value={r.startAtUtc ? r.startAtUtc.slice(0, 16) : ""}
                    onChange={(e) =>
                      setRules((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? {
                                ...x,
                                startAtUtc: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              }
                            : x,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-500">Thời gian kết thúc</span>
                  <input
                    type="datetime-local"
                    value={r.endAtUtc ? r.endAtUtc.slice(0, 16) : ""}
                    onChange={(e) =>
                      setRules((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? {
                                ...x,
                                endAtUtc: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              }
                            : x,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeRule(idx)}
                  disabled={rules.length <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/80">
        <div className="mb-5 flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <h2 className="shrink-0 text-lg font-semibold text-slate-900">
            Xem trước lô gần hết hạn
          </h2>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-end">
            <div className="flex min-h-[3rem] w-full min-w-0 flex-1 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:px-6 sm:py-3 lg:max-w-3xl xl:max-w-[40rem]">
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Hết hạn trong
              </span>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-5">
                <input
                  type="number"
                  min={1}
                  value={daysThreshold}
                  onChange={(e) =>
                    setDaysThreshold(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-14 shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-20"
                />
                <span className="shrink-0 text-sm font-medium text-slate-600">ngày</span>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50/60"
                >
                  <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
                  Làm mới
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mb-3 text-xs text-slate-500">
          Nhấn ô thống kê để xem chi tiết
        </p>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setPreviewTableFilter("near")}
            aria-pressed={previewTableFilter === "near"}
            className={
              "flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-sm outline-none transition hover:brightness-[0.99] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 " +
              (previewTableFilter === "near"
                ? "border-emerald-400 bg-emerald-50/90 ring-2 ring-emerald-300/60"
                : "border-emerald-100 bg-emerald-50/60 hover:border-emerald-200")
            }
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-emerald-100">
              <Package className="text-emerald-600" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900/85">
                Số lô hàng gần hết hạn
              </p>
              <p className="text-xl font-bold tabular-nums text-emerald-950">
                {isFetching ? "…" : previewStats.soLoGanHetHan}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPreviewTableFilter("near")}
            aria-pressed={previewTableFilter === "near"}
            className={
              "flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-sm outline-none transition hover:brightness-[0.99] focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 " +
              (previewTableFilter === "near"
                ? "border-sky-400 bg-sky-50/90 ring-2 ring-sky-300/60"
                : "border-sky-100 bg-sky-50/60 hover:border-sky-200")
            }
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-sky-100">
              <Boxes className="text-sky-600" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-900/85">
                Số thùng gần hết hạn
              </p>
              <p className="text-xl font-bold tabular-nums text-sky-950">
                {isFetching ? "…" : previewStats.soThungGanHetHan}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPreviewTableFilter("beyondThreshold")}
            aria-pressed={previewTableFilter === "beyondThreshold"}
            className={
              "flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-sm outline-none transition hover:brightness-[0.99] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 " +
              (previewTableFilter === "beyondThreshold"
                ? "border-amber-400 bg-amber-50/90 ring-2 ring-amber-300/60"
                : "border-amber-100 bg-amber-50/60 hover:border-amber-200")
            }
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-amber-100">
              <Warehouse className="text-amber-700" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-950/90">
                Số lô chưa quá hạn
              </p>
              <p className="text-xl font-bold tabular-nums text-amber-950">
                {isFetching ? "…" : previewStats.soLoChuaQuaHanTheoNguong}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-amber-900/70">
                Lô còn lại <span className="font-semibold">&gt; {daysThreshold}</span> ngày trước HSD
              </p>
            </div>
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-inner">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 text-left text-[11px] font-bold uppercase tracking-wider text-white">
                <th className="px-4 py-3.5">Lô hàng</th>
                <th className="px-4 py-3.5">Sản phẩm &amp; biến thể</th>
                <th className="hidden px-4 py-3.5 md:table-cell">Kho</th>
                <th className="px-4 py-3.5 text-right">Ngày còn lại</th>
                <th className="px-4 py-3.5 text-right">Giảm đề xuất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isFetching ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                    Đang tải dữ liệu…
                  </td>
                </tr>
              ) : displayLots.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                    {previewTableFilter === "beyondThreshold"
                      ? `Không có lô nào có số ngày còn lại lớn hơn ${daysThreshold} ngày trong dữ liệu đang tải (cửa sổ ${fetchWindowDays} ngày).`
                      : "Không có lô hàng trong ngưỡng 0–N ngày (theo số bạn nhập)."}
                  </td>
                </tr>
              ) : (
                displayLots.map((lot) => {
                  const { title, subtitle } = formatNearExpiryProductLines(lot);
                  return (
                    <tr
                      key={lot.lotId}
                      className="transition-colors hover:bg-slate-50/90"
                    >
                      <td className="px-4 py-3 align-top">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {lot.lotCode}
                        </span>
                      </td>
                      <td className="max-w-md px-4 py-3 align-top">
                        <div className="font-semibold leading-snug text-slate-900">{title}</div>
                        {subtitle ? (
                          <div className="mt-1 text-xs leading-snug text-slate-500">
                            {subtitle}
                          </div>
                        ) : null}
                      </td>
                      <td className="hidden max-w-[10rem] truncate px-4 py-3 align-top text-slate-600 md:table-cell">
                        {lot.warehouseName?.trim() || "—"}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <span className="inline-flex min-w-[2rem] justify-end font-semibold tabular-nums text-slate-800">
                          {lot.daysLeft}
                        </span>
                        <span className="text-xs font-normal text-slate-500"> ngày</span>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <span className="inline-flex rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200/80">
                          {(lot.suggestedDiscountPercent ??
                            getDiscountPercent(lot.daysLeft))}
                          %
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
