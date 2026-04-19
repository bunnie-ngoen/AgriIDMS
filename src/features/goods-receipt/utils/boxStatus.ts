/** Khớp với AgriIDMS.Domain.Enums.BoxStatus (C#). */
const BOX_STATUS_NAMES = [
  "Stored",
  "Reserved",
  "Picking",
  "Exported",
  "Damaged",
  "Expired",
  "Disposed",
] as const;

/**
 * API thường trả enum dạng số; UI so sánh theo tên ("Stored", …).
 */
export function normalizeBoxStatus(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") return "";

  if (typeof raw === "number" && Number.isInteger(raw)) {
    if (raw >= 0 && raw < BOX_STATUS_NAMES.length) return BOX_STATUS_NAMES[raw];
    return String(raw);
  }

  if (typeof raw === "string") {
    if ((BOX_STATUS_NAMES as readonly string[]).includes(raw)) return raw;
    if (/^\d+$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (n >= 0 && n < BOX_STATUS_NAMES.length) return BOX_STATUS_NAMES[n];
    }
    return raw;
  }

  return String(raw);
}
