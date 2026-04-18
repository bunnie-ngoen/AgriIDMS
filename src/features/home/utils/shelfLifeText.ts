/**
 * Chuyển số ngày bảo quản / khuyến nghị (BE: shelfLifeDays) thành câu tự nhiên cho khách mua,
 * tránh wording kiểu "hạn sử dụng: X ngày" hoặc quá kỹ thuật.
 */
export function formatShelfLifeRecommendationText(shelfLifeDays: number): string {
    const d = Math.floor(Number(shelfLifeDays));
    if (!Number.isFinite(d) || d <= 0) {
        return "Thời gian thưởng thức lý tưởng sẽ được ghi nhận trên nhãn khi bạn nhận hàng.";
    }
    if (d === 1) {
        return "Nên thưởng thức trong ngày để cảm nhận trọn vị tươi ngon nhất.";
    }
    return `Sản phẩm phù hợp sử dụng trong vòng ${d} ngày tới.`;
}
