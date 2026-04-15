/**
 * Quy cách box chuẩn — phải khớp migration StandardBoxSpecs (10/30/50 kg → m³).
 * Dùng để ước thể tích chiếm chỗ trước khi gọi API (BE vẫn là nguồn đúng).
 */
const STANDARD_BOX_SPECS = [
  { id: 1, weightKg: 10, volumeM3: 0.08 },
  { id: 2, weightKg: 30, volumeM3: 0.24 },
  { id: 3, weightKg: 50, volumeM3: 0.4 },
] as const;

/** max(VolumeM3/WeightKg) — với seed hiện tại mọi spec đều = 0.008 m³/kg. */
export const MAX_VOLUME_PER_KG = STANDARD_BOX_SPECS.reduce(
  (m, s) => Math.max(m, s.volumeM3 / s.weightKg),
  0,
);

function resolveSpecByWeight(weightKg: number) {
  return [...STANDARD_BOX_SPECS].reduce((best, s) =>
    Math.abs(weightKg - s.weightKg) < Math.abs(weightKg - best.weightKg) ? s : best,
  );
}

/** Thể tích m³ một box chiếm (gần giống BoxVolume.OccupiedVolumeM3 phía BE). */
export function occupiedVolumeM3FromWeight(weightKg: number): number {
  if (weightKg <= 0) return 0;
  const spec = resolveSpecByWeight(weightKg);
  const ratio = Math.min(1, Math.max(0, weightKg / spec.weightKg));
  return spec.volumeM3 * ratio;
}
