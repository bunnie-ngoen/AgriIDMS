/**
 * Bỏ hậu tố kiểu "Grade3", "Grade 3" ở cuối tên SP (hạng đã hiển thị riêng).
 */
export function stripGradeSuffixFromProductName(name: string): string {
    return name.replace(/\s*Grade\s*\d+\s*$/i, "").trim();
}
