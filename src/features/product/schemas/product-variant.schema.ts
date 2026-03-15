import { z } from "zod";

export const ProductVariantSchema = z.object({
  productId: z
    .number({ message: "Vui lòng chọn sản phẩm" })
    .int()
    .positive("Vui lòng chọn sản phẩm"),
  grade: z
    .number({ message: "Vui lòng nhập grade" })
    .int()
    .min(1, "Grade tối thiểu là 1"),
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
});

export type ProductVariantDto = z.infer<typeof ProductVariantSchema>;