import { z } from "zod";

export const PRODUCT_GRADE_OPTIONS = [
  { value: 1, label: "Hàng loại 1" },
  { value: 2, label: "Hàng loại 2" },
  { value: 3, label: "Hàng loại 3" },
] as const;

const VALID_PRODUCT_GRADES = PRODUCT_GRADE_OPTIONS.map((item) => item.value);

export const ProductVariantSchema = z.object({
  productId: z
    .number({ message: "Vui lòng chọn sản phẩm" })
    .int()
    .positive("Vui lòng chọn sản phẩm"),
  grade: z
    .number({ message: "Vui lòng chọn hàng loại" })
    .int()
    .refine((value) => VALID_PRODUCT_GRADES.includes(value as 1 | 2 | 3), {
      message: "Hàng loại không hợp lệ. Vui lòng chọn hàng loại 1, 2 hoặc 3",
    }),
  price: z
    .number({ message: "Vui lòng nhập giá" })
    .min(0.01, "Giá tối thiểu là 0.01"),
  shelfLifeDays: z
    .number({ message: "Vui lòng nhập hạn sử dụng" })
    .int()
    .min(1, "Tối thiểu 1 ngày"),
  imageUrl: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập URL ảnh"),
  minReceiptWeight: z
    .number({ message: "Vui lòng nhập định mức tối thiểu (kg)" })
    .min(0, "Định mức tối thiểu (kg) phải >= 0"),
  densityKgPerM3: z
    .number({ message: "Vui lòng nhập khối lượng riêng (kg/m3)" })
    .min(0.0001, "Khối lượng riêng phải > 0"),
});

export type ProductVariantDto = z.infer<typeof ProductVariantSchema>;