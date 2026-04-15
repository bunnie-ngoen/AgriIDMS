export type BoxTypeKey = "StyrofoamBox" | "Carton" | "MeshBag";

export type BoxTypeSpec = {
  /** Id để tham chiếu (FE local) */
  id: string;
  type: BoxTypeKey;
  /** Tên quy cách (VD: S/M/L, 10kg, 40x30x25...) */
  name: string;
  /** Chiều dài (cm) */
  lengthCm: number;
  /** Chiều rộng (cm) */
  widthCm: number;
  /** Chiều cao (cm) */
  heightCm: number;
};

const STORAGE_KEY_V1 = "agriidms.boxTypeSpecs.v1";
const STORAGE_KEY = "agriidms.boxTypeSpecs.v2";

export const DEFAULT_BOX_TYPE_SPECS: BoxTypeSpec[] = [
  {
    id: "styrofoam-default",
    type: "StyrofoamBox",
    name: "Mặc định",
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
  },
  {
    id: "carton-default",
    type: "Carton",
    name: "Mặc định",
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
  },
  {
    id: "meshbag-default",
    type: "MeshBag",
    name: "Mặc định",
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
  },
];

export function volumeM3FromCm(lengthCm: number, widthCm: number, heightCm: number) {
  const l = Number(lengthCm);
  const w = Number(widthCm);
  const h = Number(heightCm);
  if (!Number.isFinite(l) || !Number.isFinite(w) || !Number.isFinite(h)) return 0;
  if (l <= 0 || w <= 0 || h <= 0) return 0;
  return (l * w * h) / 1_000_000;
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function createEmptyVariant(type: BoxTypeKey): BoxTypeSpec {
  return {
    id: randomId(type),
    type,
    name: "Kích cỡ mới",
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
  };
}

type LegacyV1Item = {
  type: BoxTypeKey;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

function isBoxTypeKey(x: unknown): x is BoxTypeKey {
  return x === "StyrofoamBox" || x === "Carton" || x === "MeshBag";
}

export function normalizeBoxTypeSpecs(input: unknown): BoxTypeSpec[] {
  if (!Array.isArray(input)) return DEFAULT_BOX_TYPE_SPECS;

  // v2: array of variants
  const variants: BoxTypeSpec[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const it = item as Partial<BoxTypeSpec> & { type?: unknown };
    if (!isBoxTypeKey(it.type)) continue;
    const id = typeof it.id === "string" && it.id.trim() ? it.id.trim() : randomId(it.type);
    const name = typeof it.name === "string" && it.name.trim() ? it.name.trim() : "Mặc định";
    variants.push({
      id,
      type: it.type,
      name,
      lengthCm: Number(it.lengthCm ?? 0) || 0,
      widthCm: Number(it.widthCm ?? 0) || 0,
      heightCm: Number(it.heightCm ?? 0) || 0,
    });
  }

  const allowed: BoxTypeKey[] = ["StyrofoamBox", "Carton", "MeshBag"];
  const hasAny = variants.length > 0;
  if (!hasAny) return DEFAULT_BOX_TYPE_SPECS;

  // Ensure mỗi type có ít nhất 1 variant
  const byType = new Map<BoxTypeKey, BoxTypeSpec[]>();
  for (const v of variants) {
    const list = byType.get(v.type) ?? [];
    list.push(v);
    byType.set(v.type, list);
  }
  for (const t of allowed) {
    if (!byType.get(t)?.length) byType.set(t, [createEmptyVariant(t)]);
  }

  // flatten theo thứ tự type, giữ thứ tự nhập của từng type
  return allowed.flatMap((t) => byType.get(t)!);
}

function migrateFromV1(raw: string): BoxTypeSpec[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const items: LegacyV1Item[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const it = item as Partial<LegacyV1Item> & { type?: unknown };
      if (!isBoxTypeKey(it.type)) continue;
      items.push({
        type: it.type,
        lengthCm: Number(it.lengthCm ?? 0) || 0,
        widthCm: Number(it.widthCm ?? 0) || 0,
        heightCm: Number(it.heightCm ?? 0) || 0,
      });
    }
    if (items.length === 0) return null;

    // v1 chỉ có 1 spec / type → convert thành 1 variant "Mặc định"
    const mapped: BoxTypeSpec[] = items.map((s) => ({
      id: randomId(s.type),
      type: s.type,
      name: "Mặc định",
      lengthCm: s.lengthCm,
      widthCm: s.widthCm,
      heightCm: s.heightCm,
    }));
    return normalizeBoxTypeSpecs(mapped);
  } catch {
    return null;
  }
}

export function loadBoxTypeSpecs(): BoxTypeSpec[] {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) return normalizeBoxTypeSpecs(JSON.parse(rawV2));

    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const migrated = migrateFromV1(rawV1);
      if (migrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }

    return DEFAULT_BOX_TYPE_SPECS;
  } catch {
    return DEFAULT_BOX_TYPE_SPECS;
  }
}

export function saveBoxTypeSpecs(specs: BoxTypeSpec[]) {
  const normalized = normalizeBoxTypeSpecs(specs);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

