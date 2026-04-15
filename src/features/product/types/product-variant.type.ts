// types/product-variant.type.ts
export type ProductVariant = {
  id: number;
  productId: number;
  productName: string;
  /**
   * Bên BE: enum ProductGrade (A/B/C...). FE hiện đang dùng number.
   */
  grade: number;
  price: number;
  isActive: boolean;
  /**
   * Số ngày bảo quản (shelf life) kể từ ngày thu hoạch.
   */
  shelfLifeDays: number;
  /**
   * Đường dẫn ảnh biến thể (có thể null bên BE).
   */
  imageUrl: string | null;
  /**
   * Định mức tối thiểu (kg) cho mỗi dòng nhập sản phẩm này. Null = không bắt buộc.
   */
  minReceiptWeight?: number | null;
  /**
   * Khối lượng riêng (kg/m3) để quy đổi từ thể tích box sang kg.
   */
  densityKgPerM3: number;
  /**
   * Số box khả dụng trong kho cho biến thể này.
   */
  availableBoxCount?: number;
};