import type { NearExpiryLotItem } from "../../goods-receipt/types/goods-receipt.type";

/** Chuẩn hóa enum/string grade từ API → nhãn tiếng Việt. */
export function formatProductGradeLabel(gradeRaw: string): string {
  const g = (gradeRaw ?? "").trim();
  if (g === "1" || g === "Grade1") return "Loại 1";
  if (g === "2" || g === "Grade2") return "Loại 2";
  if (g === "3" || g === "Grade3") return "Loại 3";
  const n = parseInt(g, 10);
  if (n === 1) return "Loại 1";
  if (n === 2) return "Loại 2";
  if (n === 3) return "Loại 3";
  const m = /^Grade(\d+)$/i.exec(g);
  if (m) return `Loại ${m[1]}`;
  return g;
}

const isPlaceholderProductName = (name: string): boolean => {
  const t = name.trim();
  return !t || /^string$/i.test(t) || /^n\/?a$/i.test(t);
};

/**
 * Dòng hiển thị sản phẩm + loại + biến thể cho dashboard lô gần hết hạn.
 * Ưu tiên tên biến thể khi tên sản phẩm master rỗng / placeholder.
 */
export function formatNearExpiryProductLines(
  lot: NearExpiryLotItem,
): { title: string; subtitle: string | null } {
  const grade = formatProductGradeLabel(lot.grade);
  const product = (lot.productName ?? "").trim();
  const variant = (lot.productVariantName ?? "").trim();

  if (isPlaceholderProductName(product) && variant) {
    return {
      title: variant,
      subtitle: grade || null,
    };
  }

  const titleParts: string[] = [];
  if (product) titleParts.push(product);
  if (grade) titleParts.push(grade);
  const title =
    titleParts.length > 0 ? titleParts.join(" · ") : variant || `Biến thể #${lot.productVariantId}`;

  let subtitle: string | null = null;
  if (variant && variant !== title && !title.includes(variant)) {
    subtitle = variant;
  }

  return { title, subtitle };
}
