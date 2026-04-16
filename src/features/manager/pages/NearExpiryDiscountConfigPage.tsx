import { useEffect, useMemo, useState } from "react";
import { Tags, Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useGetNearExpiryDashboardQuery } from "../../goods-receipt/api/goods-receipt.api";
import {
  useGetNearExpiryDiscountRulesQuery,
  useUpdateNearExpiryDiscountRulesMutation,
} from "../api/near-expiry-discount.api";

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

const defaultRules: DiscountRule[] = [
  { name: "0-2 ngày", minDays: 0, maxDays: 2, discountPercent: 30, priority: 1, isActive: true, startAtUtc: null, endAtUtc: null },
  { name: "3-5 ngày", minDays: 3, maxDays: 5, discountPercent: 20, priority: 2, isActive: true, startAtUtc: null, endAtUtc: null },
  { name: "6-10 ngày", minDays: 6, maxDays: 10, discountPercent: 10, priority: 3, isActive: true, startAtUtc: null, endAtUtc: null },
];

export default function NearExpiryDiscountConfigPage() {
  const [rules, setRules] = useState<DiscountRule[]>(() => defaultRules);
  const [daysThreshold, setDaysThreshold] = useState(7);

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.priority - b.priority || a.maxDays - b.maxDays),
    [rules],
  );

  const { data: rulesData, isFetching: isFetchingRules } =
    useGetNearExpiryDiscountRulesQuery();
  const [updateRules, { isLoading: isSavingRules }] =
    useUpdateNearExpiryDiscountRulesMutation();

  const { data, isFetching, refetch } = useGetNearExpiryDashboardQuery({
    days: daysThreshold,
  });

  const nearExpiryLots = useMemo(
    () => (data?.lots ?? []).filter((l) => l.status !== "Expired"),
    [data?.lots],
  );

  const getDiscountPercent = (daysLeft: number): number => {
    const matched = sortedRules.find(
      (r) => (r.minDays == null || daysLeft >= r.minDays) && daysLeft <= r.maxDays,
    );
    return matched?.discountPercent ?? 0;
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        name: "Rule mới",
        minDays: 0,
        maxDays: 1,
        discountPercent: 5,
        priority: rules.length + 1,
        isActive: true,
        startAtUtc: null,
        endAtUtc: null,
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
              [field]: Number.isFinite(value) ? Math.max(0, value) : 0,
            }
          : r,
      ),
    );
  };

  const saveRules = async () => {
    const cleaned = sortedRules.map((r) => ({
      ...r,
      name: (r.name || "").trim(),
      minDays:
        r.minDays == null ? null : Math.max(0, Math.floor(Number(r.minDays))),
      maxDays: Math.max(0, Math.floor(r.maxDays)),
      discountPercent: Math.max(0, Math.min(100, Number(r.discountPercent))),
      priority: Math.max(1, Math.floor(Number(r.priority || 1))),
    }));
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
    } catch {
      toast.error("Lưu cấu hình thất bại. Vui lòng thử lại.");
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
          maxDays: Math.max(0, Math.floor(Number(r.maxDaysLeft ?? 0))),
          name: r.name ?? "",
          minDays:
            r.minDaysLeft == null ? null : Math.max(0, Math.floor(Number(r.minDaysLeft))),
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
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Lấy danh sách lô hàng trong
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={daysThreshold}
                onChange={(e) =>
                  setDaysThreshold(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
              <span className="text-sm text-slate-600">ngày</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
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
              Lưu cấu hình
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
              className="grid grid-cols-1 md:grid-cols-7 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div>
                <label className="text-[11px] text-slate-500">Tên rule</label>
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
                <label className="text-[11px] text-slate-500">MinDaysLeft</label>
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
                  Áp dụng khi số ngày còn lại {"<="}
                </label>
                <input
                  type="number"
                  min={0}
                  value={r.maxDays}
                  onChange={(e) =>
                    updateRule(idx, "maxDays", Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Priority</label>
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
                <label className="text-[11px] text-slate-500">Thời gian hiệu lực</label>
                <div className="mt-1 grid grid-cols-1 gap-1">
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Danh sách lô hàng gần hết hạn (xem trước theo cấu hình)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Lô hàng</th>
                <th className="px-3 py-2 text-left">Sản phẩm</th>
                <th className="px-3 py-2 text-right">Ngày còn lại</th>
                <th className="px-3 py-2 text-right">Giảm giá đề xuất</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={4}>
                    Đang tải...
                  </td>
                </tr>
              ) : nearExpiryLots.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={4}>
                    Không có lô hàng gần hết hạn trong ngưỡng đã chọn.
                  </td>
                </tr>
              ) : (
                nearExpiryLots.map((lot) => (
                  <tr key={lot.lotId} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {lot.lotCode}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{lot.productName}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {lot.daysLeft}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        {(lot.suggestedDiscountPercent ??
                          getDiscountPercent(lot.daysLeft))}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

