import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useGetBoxTypeSpecsQuery,
  useReplaceAllBoxTypeSpecsMutation,
  type BoxTypeSpecItem,
} from "../../admin/api/create-user.api";
import { boxTypeLabel } from "../../../shared/lib/boxTypeUi";
import { volumeM3FromCm } from "../../../shared/lib/boxTypeSpecs";

type BoxTypeKey = "StyrofoamBox" | "Carton" | "MeshBag";
type LocalSpec = {
  id: number | string;
  type: BoxTypeKey;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

const TYPES: BoxTypeKey[] = ["StyrofoamBox", "Carton", "MeshBag"];
const BOX_TYPE_TO_ID: Record<BoxTypeKey, number> = {
  StyrofoamBox: 1,
  Carton: 2,
  MeshBag: 3,
};
const ID_TO_BOX_TYPE: Record<number, BoxTypeKey> = {
  1: "StyrofoamBox",
  2: "Carton",
  3: "MeshBag",
};

function clampNonNegativeNumber(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

function createLocalVariant(type: BoxTypeKey): LocalSpec {
  return {
    id: `new-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    name: "Kích cỡ mới",
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
  };
}

function normalizeFromApi(data: BoxTypeSpecItem[] | undefined): LocalSpec[] {
  const mapped: LocalSpec[] =
    data?.flatMap((x) => {
      const type = ID_TO_BOX_TYPE[Number(x.boxType)];
      if (!type) return [];
      const spec: LocalSpec = {
        id: x.id,
        type,
        name: x.displayName || "Mặc định",
        lengthCm: Number(x.lengthCm || 0),
        widthCm: Number(x.widthCm || 0),
        heightCm: Number(x.heightCm || 0),
      };
      return [spec];
    }) ?? [];

  const byType = new Map<BoxTypeKey, LocalSpec[]>();
  for (const t of TYPES) byType.set(t, []);
  for (const it of mapped) byType.get(it.type)!.push(it);
  for (const t of TYPES) {
    if (!byType.get(t)?.length) byType.set(t, [createLocalVariant(t)]);
  }

  return TYPES.flatMap((t) => byType.get(t)!);
}

export default function BoxTypeConfigPage() {
  const { data, isFetching } = useGetBoxTypeSpecsQuery();
  const [replaceAllBoxTypeSpecs, replaceState] = useReplaceAllBoxTypeSpecsMutation();
  const [specs, setSpecs] = useState<LocalSpec[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSpecs(normalizeFromApi(data));
    setDirty(false);
  }, [data]);

  const groups = useMemo(() => {
    const byType = new Map<BoxTypeKey, LocalSpec[]>();
    for (const t of TYPES) byType.set(t, []);
    for (const s of specs) {
      const list = byType.get(s.type) ?? [];
      list.push(s);
      byType.set(s.type, list);
    }
    for (const t of TYPES) {
      const list = byType.get(t) ?? [];
      if (list.length === 0) byType.set(t, [createLocalVariant(t)]);
    }
    return TYPES.map((t) => ({
      type: t,
      variants: byType.get(t)!,
    }));
  }, [specs]);

  const updateVariant = (id: number | string, patch: Partial<LocalSpec>) => {
    setSpecs((prev) => {
      const next = [...prev];
      const idx = next.findIndex((x) => x.id === id);
      if (idx < 0) return prev;

      const current = next[idx];
      next[idx] = {
        ...current,
        ...patch,
        id: current.id,
        type: current.type,
        name:
          typeof patch.name === "string"
            ? patch.name
            : (current.name ?? "Mặc định"),
        lengthCm: clampNonNegativeNumber(patch.lengthCm ?? current.lengthCm),
        widthCm: clampNonNegativeNumber(patch.widthCm ?? current.widthCm),
        heightCm: clampNonNegativeNumber(patch.heightCm ?? current.heightCm),
      };
      return next;
    });
    setDirty(true);
  };

  const addVariant = (type: BoxTypeKey) => {
    setSpecs((prev) => [...prev, createLocalVariant(type)]);
    setDirty(true);
  };

  const removeVariant = (type: BoxTypeKey, id: number | string) => {
    setSpecs((prev) => {
      const sameType = prev.filter((v) => v.type === type);
      if (sameType.length <= 1) {
        toast.error("Mỗi loại cần tối thiểu 1 kích cỡ.");
        return prev;
      }
      return prev.filter((v) => v.id !== id);
    });
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      const payload = specs.map((s) => ({
        id: typeof s.id === "number" ? s.id : undefined,
        boxType: BOX_TYPE_TO_ID[s.type],
        displayName: (s.name || "").trim(),
        lengthCm: clampNonNegativeNumber(s.lengthCm),
        widthCm: clampNonNegativeNumber(s.widthCm),
        heightCm: clampNonNegativeNumber(s.heightCm),
      }));
      const res = await replaceAllBoxTypeSpecs(payload).unwrap();
      setSpecs(normalizeFromApi(res.items));
      setDirty(false);
      toast.success("Đã lưu cấu hình loại box.");
    } catch {
      toast.error("Lưu cấu hình thất bại.");
    }
  };

  const handleReset = () => {
    setSpecs([
      createLocalVariant("StyrofoamBox"),
      createLocalVariant("Carton"),
      createLocalVariant("MeshBag"),
    ]);
    setDirty(true);
    toast("Đã reset về mặc định (chưa lưu).");
  };

  return (
    <div className="px-5">
      <div className="bg-white rounded-[18px] p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Cấu hình loại box
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dùng để cấu hình quy cách đóng gói (Dài/Rộng/Cao) và thể tích box.
              Dữ liệu lưu trên hệ thống và dùng chung cho quản lý.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset mặc định
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || replaceState.isLoading}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {replaceState.isLoading ? "Đang lưu..." : "Lưu cấu hình"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-white">
            <p className="text-xs font-semibold text-slate-800">
              Danh sách loại box (mỗi loại có thể nhiều kích cỡ)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Đơn vị nhập: <span className="font-semibold">cm</span>. Thể tích tự tính theo công thức{" "}
              <span className="font-semibold">Dài × Rộng × Cao</span>.
            </p>
          </div>

          {isFetching ? (
            <div className="p-6 text-sm text-slate-500">Đang tải cấu hình...</div>
          ) : (
          <div className="p-4 space-y-4">
            {groups.map((g) => (
              <div
                key={g.type}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {boxTypeLabel(g.type)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {g.variants.length} kích cỡ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVariant(g.type)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    + Thêm kích cỡ
                  </button>
                </div>

                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left w-[260px]">
                          Tên kích cỡ
                        </th>
                        <th className="px-4 py-3 text-left">Dài (cm)</th>
                        <th className="px-4 py-3 text-left">Rộng (cm)</th>
                        <th className="px-4 py-3 text-left">Cao (cm)</th>
                        <th className="px-4 py-3 text-right">Thể tích</th>
                        <th className="px-4 py-3 text-right w-[110px]">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {g.variants.map((v) => {
                        const vM3 = volumeM3FromCm(v.lengthCm, v.widthCm, v.heightCm);
                        const liters = vM3 * 1000;
                        return (
                          <tr key={v.id} className="border-t border-slate-100">
                            <td className="px-4 py-3">
                              <input
                                value={v.name}
                                onChange={(e) => updateVariant(v.id, { name: e.target.value })}
                                className="w-full max-w-[240px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                                placeholder="Ví dụ: Size M"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={v.lengthCm > 0 ? v.lengthCm : ""}
                                onChange={(e) =>
                                  updateVariant(v.id, {
                                    lengthCm: clampNonNegativeNumber(e.target.value),
                                  })
                                }
                                className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={v.widthCm > 0 ? v.widthCm : ""}
                                onChange={(e) =>
                                  updateVariant(v.id, {
                                    widthCm: clampNonNegativeNumber(e.target.value),
                                  })
                                }
                                className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={v.heightCm > 0 ? v.heightCm : ""}
                                onChange={(e) =>
                                  updateVariant(v.id, {
                                    heightCm: clampNonNegativeNumber(e.target.value),
                                  })
                                }
                                className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              <div className="font-semibold text-slate-900">
                                {vM3.toFixed(6)} m³
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {liters.toFixed(2)} L
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeVariant(g.type, v.id)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          )}

          {dirty && (
            <div className="px-4 py-3 border-t border-amber-200 bg-amber-50 text-[11px] text-amber-800">
              Bạn có thay đổi chưa lưu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

